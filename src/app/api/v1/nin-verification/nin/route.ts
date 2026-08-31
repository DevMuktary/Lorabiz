import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/developer-api/auth";
import { executeApiTransaction } from "@/lib/developer-api/executor";
import { getSandboxNinRecord, getSandboxPdfBase64 } from "@/lib/developer-api/sandbox-fixtures";
import { executeNinSlipGeneration } from "@/lib/nin-slips-provider";

export const dynamic = "force-dynamic";

const VALID_NIN_SLIP_TYPES = [
  "nin_basic",
  "nin_vnin",
  "nin_regular",
  "nin_standard",
  "nin_premium",
] as const;

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
  const slipType = body.slipType
    ? String(body.slipType).trim().toLowerCase()
    : "nin_standard";

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

  if (!VALID_NIN_SLIP_TYPES.includes(slipType as any)) {
    return NextResponse.json(
      {
        status: false,
        error: "INVALID_SLIP_TYPE",
        message: `Invalid slipType. Allowed values are: ${VALID_NIN_SLIP_TYPES.join(", ")}.`,
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
    requestPayload: { nin: `${nin.slice(0, 3)}*****${nin.slice(-3)}`, slipType },

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
          firstname: mockRecord.firstname,
          surname: mockRecord.surname,
          middlename: mockRecord.middlename || "",
          fullname: `${mockRecord.firstname} ${mockRecord.middlename ? mockRecord.middlename + " " : ""}${mockRecord.surname}`.trim(),
          birthdate: mockRecord.birthdate,
          gender: mockRecord.gender,
          telephoneno: mockRecord.telephoneno,
          residence_state: mockRecord.residence_state,
          residence_lga: mockRecord.residence_lga,
          residence_address: mockRecord.residence_address,
          photo: mockRecord.photo_base64,
          slipType,
          pdf_base64: getSandboxPdfBase64(),
        },
      };
    },

    // --- LIVE PRODUCTION EXECUTION ---
    executeLive: async () => {
      const result = await executeNinSlipGeneration(slipType, nin, "NIN");

      if (!result.success) {
        return {
          success: false,
          error: result.error || result.message || "No record found for the provided NIN in the NIMC database.",
          statusCode: result.error?.includes("maintenance") ? 503 : 404,
        };
      }

      const u = result.userData || {};
      const photoBase64 = result.photo || (u.photo as string) || undefined;

      return {
        success: true,
        data: {
          nin: result.nin || nin,
          firstname: result.firstName || (u.firstname as string) || "",
          surname: result.lastName || (u.surname as string) || "",
          middlename: result.middleName || (u.middlename as string) || "",
          fullname: result.fullName || `${result.firstName || ""} ${result.lastName || ""}`.trim(),
          birthdate: result.dob || (u.birthdate as string) || "",
          gender: result.gender || (u.gender as string) || "",
          telephoneno: result.phone || (u.telephoneno as string) || "",
          residence_state: (u.residence_state as string) || (u.state as string) || "",
          residence_lga: (u.residence_lga as string) || (u.lga as string) || "",
          residence_address: result.address || (u.residence_address as string) || "",
          photo: photoBase64,
          signature: result.signature || undefined,
          trackingId: (u.tracking_id as string) || undefined,
          slipType,
          pdf_base64: result.pdfBase64 || undefined,
        },
      };
    },
  });
}
