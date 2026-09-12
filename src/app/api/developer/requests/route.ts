import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ApiKeyType } from "@prisma/client";

export const dynamic = "force-dynamic";

export interface UnifiedApiRequestItem {
  id: string;
  serviceType: "NIN_PERSONALIZATION" | "NIN_IPE" | "NIN_VALIDATION" | "NIN_SEARCH" | "NIN_PHONE" | "BVN_VERIFY";
  serviceName: string;
  reference: string;
  clientReference: string | null;
  inputIdentifier: string;
  inputLabel: "Tracking ID" | "NIN" | "Phone" | "ID";
  status: "PROCESSING" | "COMPLETED" | "VALIDATED" | "FAILED";
  amountCharged: number;
  refunded: boolean;
  failureReason: string | null;
  details: Record<string, unknown>;
  createdAt: string;
  completedAt: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const serviceFilter = searchParams.get("service")?.trim().toUpperCase() || "ALL";
    const statusFilter = searchParams.get("status")?.trim().toUpperCase() || "ALL";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));

    // STRICT USER DIRECTIVE: Requests history is STRICTLY for LIVE mode (No test mode mock simulations)
    // 1. Fetch LIVE NIN Personalization Requests (isApiRequest: true)
    const pznPromise = prisma.ninPersonalizationRequest.findMany({
      where: {
        userId: user.id,
        isApiRequest: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // 2. Fetch LIVE NIMC IPE Clearance Requests (isApiRequest: true)
    const ipePromise = prisma.ninIpeRequest.findMany({
      where: {
        userId: user.id,
        isApiRequest: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // 3. Fetch LIVE NIN Validation Requests (isApiRequest: true)
    const valPromise = prisma.ninValidationRequest.findMany({
      where: {
        userId: user.id,
        isApiRequest: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // 4. Fetch LIVE Synchronous Verification Logs (by-nin, by-phone, bvn)
    const logsPromise = prisma.apiRequestLog.findMany({
      where: {
        userId: user.id,
        environment: ApiKeyType.LIVE,
        OR: [
          { endpoint: { contains: "by-nin" } },
          { endpoint: { contains: "by-phone" } },
          { endpoint: { contains: "bvn" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const [pznRecords, ipeRecords, valRecords, syncLogs] = await Promise.all([
      pznPromise,
      ipePromise,
      valPromise,
      logsPromise,
    ]);

    // Normalize all LIVE requests into unified records
    const normalized: UnifiedApiRequestItem[] = [];

    // Personalization
    pznRecords.forEach((r) => {
      let normalizedStatus: "PROCESSING" | "COMPLETED" | "FAILED" = "PROCESSING";
      if (r.status === "COMPLETED") normalizedStatus = "COMPLETED";
      else if (r.status === "FAILED") normalizedStatus = "FAILED";

      normalized.push({
        id: `pzn_${r.id}`,
        serviceType: "NIN_PERSONALIZATION",
        serviceName: "NIN Personalization",
        reference: r.reference,
        clientReference: r.clientReference,
        inputIdentifier: r.trackingId,
        inputLabel: "Tracking ID",
        status: normalizedStatus,
        amountCharged: Number(r.amountCharged),
        refunded: Boolean(r.refunded),
        failureReason: r.failureReason || null,
        details: {
          resolvedNin: r.resolvedNin,
          fullName: r.fullName,
          dob: r.dob,
          gender: r.gender,
          phone: r.phone,
          residenceState: r.residenceState,
          pdfUrl: r.pdfUrl,
          userData: r.userData,
          adminNotes: r.adminNotes,
        },
        createdAt: r.createdAt.toISOString(),
        completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      });
    });

    // IPE Clearance
    ipeRecords.forEach((r) => {
      let normalizedStatus: "PROCESSING" | "COMPLETED" | "FAILED" = "PROCESSING";
      if (r.status === "COMPLETED") normalizedStatus = "COMPLETED";
      else if (r.status === "FAILED") normalizedStatus = "FAILED";

      normalized.push({
        id: `ipe_${r.id}`,
        serviceType: "NIN_IPE",
        serviceName: "NIMC IPE Clearance",
        reference: r.reference,
        clientReference: r.clientReference,
        inputIdentifier: r.trackingId,
        inputLabel: "Tracking ID",
        status: normalizedStatus,
        amountCharged: Number(r.amountCharged),
        refunded: Boolean(r.refunded),
        failureReason: r.failureReason || null,
        details: {
          newTrackingId: r.newTrackingId,
          resolvedNin: r.resolvedNin,
          adminNotes: r.adminNotes,
        },
        createdAt: r.createdAt.toISOString(),
        completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      });
    });

    // NIN Validation
    valRecords.forEach((r) => {
      let normalizedStatus: "PROCESSING" | "VALIDATED" | "FAILED" = "PROCESSING";
      if (r.status === "COMPLETED") normalizedStatus = "VALIDATED";
      else if (r.status === "FAILED") normalizedStatus = "FAILED";

      normalized.push({
        id: `val_${r.id}`,
        serviceType: "NIN_VALIDATION",
        serviceName: "NIN Validation",
        reference: r.transactionRef || r.id,
        clientReference: r.clientReference,
        inputIdentifier: r.nin,
        inputLabel: "NIN",
        status: normalizedStatus,
        amountCharged: Number(r.amountCharged),
        refunded: Boolean(r.refunded),
        failureReason: r.adminNotes || null,
        details: {
          validationType: r.category,
        },
        createdAt: r.createdAt.toISOString(),
        completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      });
    });

    // Synchronous NIN/BVN Verification Calls
    syncLogs.forEach((l) => {
      const isPhone = l.endpoint.includes("by-phone");
      const isBvn = l.endpoint.includes("bvn");
      const body = (l.requestBody as Record<string, any>) || {};
      const resBody = (l.responseBody as Record<string, any>) || {};

      let input = "—";
      let inputLabel: "NIN" | "Phone" | "ID" = "NIN";

      if (isPhone) {
        input = body.phone || body.phone_number || "—";
        inputLabel = "Phone";
      } else if (isBvn) {
        input = body.bvn || "—";
        inputLabel = "ID";
      } else {
        input = body.nin || resBody.nin || "—";
        inputLabel = "NIN";
      }

      const serviceType = isPhone ? "NIN_PHONE" : isBvn ? "BVN_VERIFY" : "NIN_SEARCH";
      const serviceName = isPhone
        ? "NIN Verification (by Phone)"
        : isBvn
        ? "BVN Verification"
        : "NIN Verification (by NIN)";

      const isSuccess = l.statusCode >= 200 && l.statusCode < 300;
      const ref = resBody.reference || l.clientReference || l.id;

      normalized.push({
        id: `log_${l.id}`,
        serviceType,
        serviceName,
        reference: ref,
        clientReference: l.clientReference,
        inputIdentifier: input,
        inputLabel,
        status: isSuccess ? "COMPLETED" : "FAILED",
        amountCharged: Number(l.amountCharged),
        refunded: false,
        failureReason: isSuccess ? null : l.errorMessage || `HTTP ${l.statusCode} Error`,
        details: resBody,
        createdAt: l.createdAt.toISOString(),
        completedAt: l.createdAt.toISOString(),
      });
    });

    // Sort all records chronologically descending
    normalized.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Summary counters across all live requests
    const summary = {
      total: normalized.length,
      completed: normalized.filter((i) => i.status === "COMPLETED" || i.status === "VALIDATED").length,
      processing: normalized.filter((i) => i.status === "PROCESSING").length,
      failed: normalized.filter((i) => i.status === "FAILED").length,
    };

    // Apply Filters
    let filtered = normalized;

    // Service Filter
    if (serviceFilter !== "ALL") {
      filtered = filtered.filter((i) => i.serviceType.toUpperCase().includes(serviceFilter));
    }

    // Status Filter
    if (statusFilter !== "ALL") {
      if (statusFilter === "COMPLETED") {
        filtered = filtered.filter((i) => i.status === "COMPLETED" || i.status === "VALIDATED");
      } else {
        filtered = filtered.filter((i) => i.status === statusFilter);
      }
    }

    // Search Filter
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.reference.toLowerCase().includes(q) ||
          (i.clientReference && i.clientReference.toLowerCase().includes(q)) ||
          i.inputIdentifier.toLowerCase().includes(q) ||
          i.serviceName.toLowerCase().includes(q)
      );
    }

    // Pagination
    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const skip = (page - 1) * limit;
    const paginatedItems = filtered.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: {
        requests: paginatedItems,
        summary,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
      },
    });
  } catch (err) {
    console.error("❌ [Unified API Requests Error]:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
