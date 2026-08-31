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

  const nin = body.nin ? String(body.nin).trim().replace(/\s+/g, "") : "";
  const includeSlip = Boolean(body.includeSlip || body.generateSlip);

  if (!nin) {
    return NextResponse.json(
      {
        status: false,
        error: "MISSING_NIN",
        message: "The 'nin' field is required.",
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  if (!/^\d{11}$/.test(nin)) {
    return NextResponse.json(
      {
        status: false,
        error: "INVALID_NIN_FORMAT",
        message: "NIN must be exactly 11 numeric digits.",
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  // 3. Execute via standard B2B transaction executor
  return executeApiTransaction({
    req,
    auth: authResult.context,
    serviceKey: "NIN_LOOKUP",
    defaultPrice: 100.0,
    endpoint: "/api/v1/nin-verification/nin",
    isRefundableOnFailure: true,
    requestPayload: { nin: `${nin.slice(0, 3)}*****${nin.slice(-3)}`, includeSlip },

    // --- SANDBOX EXECUTION ---
    executeSandbox: async () => {
      const mockRecord = getSandboxNinRecord(nin);
      if (!mockRecord) {
        return {
          success: false,
          error: "No record found for the provided NIN in the NIMC database.",
          statusCode: 404,
        };
      }

      return {
        success: true,
        data: {
          nin: mockRecord.nin,
          vnin: mockRecord.vnin,
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
      const slipType = "nin_standard";
      const result = await fetchNinSlip(slipType, nin, "NIN", authResult.context.userId);

      if (!result.success || !result.demographics) {
        return {
          success: false,
          error: result.error || "No record found for the provided NIN in the NIMC database.",
          statusCode: result.error?.includes("offline") ? 503 : 404,
        };
      }

      const demo = result.demographics;
      return {
        success: true,
        data: {
          nin: nin,
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
