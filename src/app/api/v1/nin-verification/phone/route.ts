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

  const phone = body.phone ? String(body.phone).trim().replace(/\s+/g, "") : "";
  const slipType = body.slipType ? String(body.slipType).trim().toLowerCase() : "nin_regular";
  const includeSlip = Boolean(body.includeSlip || body.generateSlip);

  if (!phone) {
    return NextResponse.json(
      {
        status: false,
        error: "MISSING_PHONE",
        message: "The 'phone' field is required.",
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  // Normalize phone (e.g. +2348012345678 or 2348012345678 or 08012345678)
  let normalizedPhone = phone;
  if (normalizedPhone.startsWith("+234")) {
    normalizedPhone = "0" + normalizedPhone.slice(4);
  } else if (normalizedPhone.startsWith("234") && normalizedPhone.length === 13) {
    normalizedPhone = "0" + normalizedPhone.slice(3);
  }

  if (!/^\d{11}$/.test(normalizedPhone)) {
    return NextResponse.json(
      {
        status: false,
        error: "INVALID_PHONE_FORMAT",
        message: "Phone number must be an 11-digit Nigerian mobile number (e.g. 08012345678).",
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  const validPhoneSlipTypes = ["nin_regular", "nin_standard", "nin_premium"];
  if (slipType && !validPhoneSlipTypes.includes(slipType)) {
    return NextResponse.json(
      {
        status: false,
        error: "INVALID_SLIP_TYPE",
        message: `Invalid slipType for phone search. Allowed values: ${validPhoneSlipTypes.join(", ")}.`,
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  // 3. Execute via standard B2B transaction executor
  return executeApiTransaction({
    req,
    auth: authResult.context,
    serviceKey: "NIN_PHONE_LOOKUP",
    defaultPrice: 150.0,
    endpoint: "/api/v1/nin-verification/phone",
    isRefundableOnFailure: true,
    requestPayload: { phone: `${normalizedPhone.slice(0, 4)}****${normalizedPhone.slice(-3)}`, slipType, includeSlip },

    // --- SANDBOX EXECUTION ---
    executeSandbox: async () => {
      const mockRecord = getSandboxNinRecord(normalizedPhone);
      if (!mockRecord) {
        return {
          success: false,
          error: "No NIMC identity record found linked to the provided phone number.",
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
      const result = await executeNinSlipGeneration(slipType, normalizedPhone, "PHONE");

      if (!result.success) {
        return {
          success: false,
          error: result.error || result.message || "No NIMC identity record found linked to the provided phone number.",
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
          nin: result.nin || undefined,
          firstname: result.firstName || (u.firstname as string) || "",
          surname: result.lastName || (u.surname as string) || "",
          middlename: result.middleName || (u.middlename as string) || "",
          fullname: result.fullName || `${result.firstName || ""} ${result.lastName || ""}`.trim(),
          birthdate: result.dob || (u.birthdate as string) || "",
          gender: result.gender || (u.gender as string) || "",
          telephoneno: normalizedPhone,
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
