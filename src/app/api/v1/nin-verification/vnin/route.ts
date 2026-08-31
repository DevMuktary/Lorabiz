import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/developer-api/auth";
import { executeApiTransaction } from "@/lib/developer-api/executor";
import { getSandboxNinRecord } from "@/lib/developer-api/sandbox-fixtures";
import { fetchNinSlip } from "@/lib/nin-slips-provider";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. Authenticate API Key
  const authResult = await authenticateApiKey(req);
  if (!authResult.success) {
    return authResult.response;
  }

  // 2. Parse & Validate Payload
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        status: false,
        error: "INVALID_JSON_BODY",
        message: "The request body must be valid JSON.",
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  const vnin = body.vnin ? String(body.vnin).trim().replace(/\s+/g, "") : "";
  const includeSlip = Boolean(body.includeSlip || body.generateSlip);

  if (!vnin) {
    return NextResponse.json(
      {
        status: false,
        error: "MISSING_VNIN",
        message: "The 'vnin' (Virtual NIN) field is required.",
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  if (vnin.length < 10 || vnin.length > 20) {
    return NextResponse.json(
      {
        status: false,
        error: "INVALID_VNIN_FORMAT",
        message: "Invalid Virtual NIN format. VNIN should be a 16-character alphanumeric string.",
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  // 3. Execute via standard B2B transaction executor
  return executeApiTransaction({
    req,
    auth: authResult.context,
    serviceKey: "VNIN_LOOKUP",
    defaultPrice: 100.0,
    endpoint: "/api/v1/nin-verification/vnin",
    isRefundableOnFailure: true,
    requestPayload: { vnin: `${vnin.slice(0, 4)}****${vnin.slice(-4)}`, includeSlip },

    // --- SANDBOX EXECUTION ---
    executeSandbox: async () => {
      const mockRecord = getSandboxNinRecord(vnin);
      if (!mockRecord) {
        return {
          success: false,
          error: "No record found matching the provided Virtual NIN.",
          statusCode: 404,
        };
      }

      return {
        success: true,
        data: {
          vnin: mockRecord.vnin || vnin,
          nin: mockRecord.nin,
          firstname: mockRecord.firstname,
          surname: mockRecord.surname,
          middlename: mockRecord.middlename || "",
          fullname: `${mockRecord.firstname} ${mockRecord.middlename ? mockRecord.middlename + " " : ""}${mockRecord.surname}`,
          birthdate: mockRecord.birthdate,
          gender: mockRecord.gender,
          telephoneno: mockRecord.telephoneno,
          residence_state: mockRecord.residence_state,
          residence_lga: mockRecord.residence_lga,
          residence_address: mockRecord.residence_address,
          photo: mockRecord.photo,
          slipPdfUrl: includeSlip
            ? "https://res.cloudinary.com/lorabiz/image/upload/sample_nin_slip_preview.pdf"
            : undefined,
        },
      };
    },

    // --- LIVE PRODUCTION EXECUTION ---
    executeLive: async () => {
      const slipType = "nin_vnin";
      const result = await fetchNinSlip(slipType, vnin, "NIN", authResult.context.userId);

      if (!result.success || !result.demographics) {
        return {
          success: false,
          error: result.error || "No record found matching the provided Virtual NIN.",
          statusCode: result.error?.includes("offline") ? 503 : 404,
        };
      }

      const demo = result.demographics;
      return {
        success: true,
        data: {
          vnin: vnin,
          nin: demo.nin || undefined,
          firstname: demo.firstName || "",
          surname: demo.lastName || "",
          middlename: demo.middleName || "",
          fullname: demo.fullName || `${demo.firstName || ""} ${demo.lastName || ""}`.trim(),
          birthdate: demo.dob || "",
          gender: demo.gender || "",
          telephoneno: demo.phone || "",
          residence_state: demo.state || "",
          residence_lga: demo.lga || "",
          residence_address: demo.address || "",
          photo: demo.photoUrl || "",
          trackingId: demo.trackingId || undefined,
          slipPdfUrl: includeSlip ? result.pdfUrl : undefined,
        },
      };
    },
  });
}
