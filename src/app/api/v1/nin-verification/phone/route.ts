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

  const phone = body.phone ? String(body.phone).trim().replace(/\s+/g, "") : "";
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

  // Normalize phone (e.g. 2348012345678 or 08012345678)
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

  // 3. Execute via standard B2B transaction executor
  return executeApiTransaction({
    req,
    auth: authResult.context,
    serviceKey: "NIN_PHONE_LOOKUP",
    defaultPrice: 150.0,
    endpoint: "/api/v1/nin-verification/phone",
    isRefundableOnFailure: true,
    requestPayload: { phone: `${normalizedPhone.slice(0, 4)}****${normalizedPhone.slice(-3)}`, includeSlip },

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
      const result = await fetchNinSlip(slipType, normalizedPhone, "PHONE", authResult.context.userId);

      if (!result.success || !result.demographics) {
        return {
          success: false,
          error: result.error || "No NIMC identity record found linked to the provided phone number.",
          statusCode: result.error?.includes("offline") ? 503 : 404,
        };
      }

      const demo = result.demographics;
      return {
        success: true,
        data: {
          nin: demo.nin || undefined,
          firstname: demo.firstName || "",
          surname: demo.lastName || "",
          middlename: demo.middleName || "",
          fullname: demo.fullName || `${demo.firstName || ""} ${demo.lastName || ""}`.trim(),
          birthdate: demo.dob || "",
          gender: demo.gender || "",
          telephoneno: normalizedPhone,
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
