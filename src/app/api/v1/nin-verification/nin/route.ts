import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/developer-api/auth";
import { executeApiTransaction } from "@/lib/developer-api/executor";
import { getSandboxNinRecord } from "@/lib/developer-api/sandbox-fixtures";
import { executeNinSlipGeneration } from "@/lib/nin-slips-provider";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
  const slipType = body.slipType ? String(body.slipType).trim().toLowerCase() : "nin_standard";
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

  const validSlipTypes = ["nin_basic", "nin_vnin", "nin_regular", "nin_standard", "nin_premium"];
  if (slipType && !validSlipTypes.includes(slipType)) {
    return NextResponse.json(
      {
        status: false,
        error: "INVALID_SLIP_TYPE",
        message: `Invalid slipType. Allowed values are: ${validSlipTypes.join(", ")}.`,
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
    requestPayload: { nin: `${nin.slice(0, 3)}*****${nin.slice(-3)}`, slipType, includeSlip },

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
          fullname: `${mockRecord.firstname} ${mockRecord.middlename ? mockRecord.middlename + " " : ""}${mockRecord.surname}`.trim(),
          birthdate: mockRecord.birthdate,
          gender: mockRecord.gender,
          telephoneno: mockRecord.telephoneno,
          residence_state: mockRecord.residence_state,
          residence_lga: mockRecord.residence_lga,
          residence_address: mockRecord.residence_address,
          photo: mockRecord.photo,
          slipType,
          slipPdfUrl: includeSlip
            ? "https://res.cloudinary.com/lorabiz/image/upload/sample_nin_slip_preview.pdf"
            : undefined,
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

      let securePdfUrl: string | undefined = undefined;
      if (includeSlip && result.pdfBase64) {
        try {
          const uploadResult = await cloudinary.uploader.upload(
            `data:application/pdf;base64,${result.pdfBase64}`,
            {
              folder: "lorabiz_api_nin_slips",
              resource_type: "auto",
            }
          );
          securePdfUrl = uploadResult.secure_url;
        } catch (cloudErr) {
          console.warn("⚠️ Cloudinary PDF Upload Warning in B2B API:", cloudErr);
        }
      }

      const u = result.userData || {};
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
          photo: result.photo || (u.photo as string) || "",
          signature: result.signature || undefined,
          slipType,
          slipPdfUrl: securePdfUrl,
          pdfBase64: includeSlip && !securePdfUrl ? result.pdfBase64 : undefined,
        },
      };
    },
  });
}
