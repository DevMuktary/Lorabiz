import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { logUserActivity } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const affidavit = await prisma.courtAffidavitRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    if (!affidavit) {
      return NextResponse.json({ success: false, message: "Affidavit not found." }, { status: 404 });
    }

    // Authorization check (owner or staff/admin)
    if (affidavit.userId !== user.id && user.role !== "ADMIN" && user.role !== "STAFF") {
      return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      affidavit,
    });
  } catch (error: any) {
    console.error("Court Affidavit Fetch Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch affidavit details." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const affidavit = await prisma.courtAffidavitRequest.findUnique({
      where: { id },
    });

    if (!affidavit || affidavit.userId !== user.id) {
      return NextResponse.json({ success: false, message: "Affidavit not found." }, { status: 404 });
    }

    const body = await req.json();
    const { passportUrl, signatureUrl, details, deponentFullName, residentialAddress } = body;

    const updated = await prisma.courtAffidavitRequest.update({
      where: { id },
      data: {
        ...(passportUrl ? { passportUrl } : {}),
        ...(signatureUrl ? { signatureUrl } : {}),
        ...(details ? { details: details as any } : {}),
        ...(deponentFullName ? { deponentFullName: deponentFullName.trim() } : {}),
        ...(residentialAddress ? { residentialAddress: residentialAddress.trim() } : {}),
        // If it was queried, reset back to PROCESSING so staff knows it was resolved
        ...(affidavit.status === "QUERIED" ? { status: "PROCESSING" } : {}),
      }
    });

    await logUserActivity({
      userId: user.id,
      action: "COURT_AFFIDAVIT_QUERY_RESOLVED",
      category: "SERVICES",
      description: `Updated particulars for affidavit ${affidavit.trackingId}`,
      status: "SUCCESS",
      referenceId: affidavit.trackingId,
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Affidavit updated successfully.",
      affidavit: updated,
    });
  } catch (error: any) {
    console.error("Court Affidavit Update Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update affidavit." }, { status: 500 });
  }
}
