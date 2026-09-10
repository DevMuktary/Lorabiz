import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 86400; // Cache for 24 hours

const LLMS_TEXT_CONTENT = `# Lorabiz Developer Platform API

> Enterprise developer API gateway for Nigerian identity verification, regulatory compliance, business registrations, and government documentation. Built for modern fintechs, developers, and autonomous AI agents.

## Quick Links
- Interactive Documentation: https://lorabiz.com/docs
- OpenAPI 3.1 Spec: https://api.lorabiz.com/api/openapi.json
- Developer Dashboard & API Keys: https://lorabiz.com/dashboard/developer

## Base URL
https://api.lorabiz.com

## Authentication
Every request requires an API key in one of the following HTTP headers:
- \`Authorization: Bearer <api_key>\`
- \`Authorization: <api_key>\`
- \`x-api-key: <api_key>\`

### Key Environments
- Test Mode: Starts with \`lora_test_\` (Uses virtual ₦1,000,000 sandbox credit. Real funds are never deducted. Returns deterministic mock responses).
- Live Mode: Starts with \`lora_live_\` (Deducts real balance per successful 2xx verification. 4xx errors are billed ₦0.00).

## Endpoints

### 1. Verify NIN by NIN
- **Method**: \`POST\`
- **Path**: \`/api/v1/nin/by-nin\`
- **Content-Type**: \`application/json\`

#### Sandbox Test Numbers:
- Success (Female Record): \`23456789012\` (Returns 200 OK)
- Success (Male Record): \`12345678901\` (Returns 200 OK)
- Record Not Found (422): \`00000000000\` or \`99999999999\` (Billed ₦0.00)

#### Request Body
\`\`\`json
{
  "nin": "12345678901",
  "slip_type": "nin_premium",
  "client_reference": "TXN_ORD_9812401"
}
\`\`\`
- \`nin\` (string, required): Exactly 11 numeric digits.
- \`slip_type\` (string, required):
  - \`nin_basic\`: Demographic data slip.
  - \`nin_vnin\`: Virtual NIN slip.
  - \`nin_regular\`: Standard Regular demographic slip.
  - \`nin_standard\`: Standard Biometric KYC identity slip.
  - \`nin_premium\`: Premium wallet-sized card slip.
- \`client_reference\` (string, optional): Your internal idempotency or transaction tracking ID.

#### Success Response (\`200 OK\`)
\`\`\`json
{
  "status": "success",
  "data": {
    "nin": "12345678901",
    "slip_type": "nin_premium",
    "demographics": {
      "firstname": "JOHN",
      "surname": "DOE",
      "birthdate": "1990-01-01",
      "gender": "male",
      "telephoneno": "08012345678"
    },
    "slip": {
      "format": "pdf",
      "mime_type": "application/pdf",
      "pdf_base64": "<base64_encoded_pdf_string>"
    }
  },
  "billing": {
    "charged": true,
    "amount": 150.00,
    "currency": "NGN"
  }
}
\`\`\`

---

### 2. Verify NIN by Phone Number
- **Method**: \`POST\`
- **Path**: \`/api/v1/nin/by-phone\`
- **Content-Type**: \`application/json\`

#### Sandbox Test Numbers:
- Success (Female Record): \`08023456789\` (Returns 200 OK)
- Success (Male Record): \`08012345678\` (Returns 200 OK)
- Record Not Found (422): \`00000000000\` or \`08000000000\` (Billed ₦0.00)

#### Request Body
\`\`\`json
{
  "phone": "08012345678",
  "slip_type": "nin_standard",
  "client_reference": "TXN_ORD_9812402"
}
\`\`\`
- \`phone\` (string, required): Exactly 11 numeric digits (e.g., "08012345678").
- \`slip_type\` (string, required):
  - \`nin_regular\`: Standard Regular slip.
  - \`nin_standard\`: Standard Biometric KYC slip.
  - \`nin_premium\`: Premium wallet card slip.
- \`client_reference\` (string, optional): Your internal idempotency or transaction tracking ID.

---

### 3. Submit NIN Validation Request
- **Method**: \`POST\`
- **Path**: \`/api/v1/nin/validation\`
- **Content-Type**: \`application/json\`

#### Validation Categories (\`validation_type\`):
- \`no_record_found\` (No Record Found)
- \`vnin_validation\` (VNIN / SIM / Bank Validation)
- \`modification\` (Record Modification)
- \`photo_error\` (Photo Error Correction)

#### Sandbox Test NINs:
In test mode (\`lora_test_...\`), use the following designated test NINs to simulate validation outcomes:
- \`11111111111\`: Success simulation (transitions to \`validated\`)
- \`22222222222\`: Failure simulation (transitions to \`failed\`, \`refunded: true\`)
- \`99999999999\`: Duplicate Conflict simulation (returns \`409 DUPLICATE_REQUEST\`)

You can supply any random \`client_reference\` of your choice (e.g., \`REF_MY_APP_99182\`).

#### Request Body
\`\`\`json
{
  "nin": "18867568313",
  "validation_type": "no_record_found",
  "client_reference": "REF_MY_APP_99182"
}
\`\`\`

#### Success Response (\`201 Created\`)
\`\`\`json
{
  "status": "success",
  "message": "NIN validation request submitted successfully.",
  "reference": "nin_val_da7c1d16cd69891a7a9044",
  "client_reference": "REF_MY_APP_99182",
  "nin": "18867568313",
  "validation_type": "no_record_found",
  "request_status": "submitted",
  "amount_charged": 700.00,
  "currency": "NGN",
  "environment": "live"
}
\`\`\`

---

### 4. Check NIN Validation Status
- **Method**: \`GET\`
- **Path**: \`/api/v1/nin/validation/status\`
- **Query Parameters**:
  - \`reference\` (optional): Lorabiz platform transaction reference
  - \`client_reference\` (optional): Your custom reference
  *(Provide reference or client_reference to look up status)*

In both live and test modes, look up requests using the \`reference\` returned upon submission or your custom \`client_reference\`.

#### Status Transitions:
- \`submitted\`
- \`processing\`
- \`validated\`
- \`failed\`

#### Success Response (\`200 OK\`)
\`\`\`json
{
  "status": "success",
  "reference": "nin_val_da7c1d16cd69891a7a9044",
  "client_reference": "REF_MY_APP_99182",
  "nin": "18867568313",
  "validation_type": "no_record_found",
  "request_status": "validated",
  "message": "NIN Validation completed successfully.",
  "completed_at": "2026-09-09T08:35:12.000Z",
  "amount_charged": 700.00,
  "currency": "NGN",
  "environment": "live",
  "date": "2026-09-09T08:15:00.000Z"
}
\`\`\`

---

### 5. Submit NIMC IPE Clearance Request
- **Method**: \`POST\`
- **Path**: \`/api/v1/nin/ipe\`
- **Content-Type**: \`application/json\`

Clears NIMC In-Processing Errors (IPE). Once cleared, NIMC releases an updated tracking ID (\`new_tracking_id\`) and the 11-digit NIN (\`resolved_nin\`).

#### Sandbox Test Numbers:
- Success: \`0TEB51VS5RES4ZZ\` (transitions to \`completed\` in 5 seconds)
- Failed (Refunded): \`0TBH26SQHQCR9F\` (transitions to \`failed\`, \`refunded: true\`)
- Duplicate Conflict (409): \`0TDUPCONFLICT01\`

#### Request Body
\`\`\`json
{
  "tracking_id": "0TEB51VS5RES4ZZ",
  "client_reference": "kyc_ipe_order_10029"
}
\`\`\`

#### Success Response (\`201 Created\`)
\`\`\`json
{
  "status": "success",
  "message": "NIMC IPE Clearance request submitted successfully.",
  "reference": "lora_ipe_1725934820123_xyz89",
  "tracking_id": "0TEB51VS5RES4ZZ",
  "client_reference": "kyc_ipe_order_10029",
  "request_status": "submitted",
  "amount_charged": 2500.0,
  "currency": "NGN",
  "environment": "live"
}
\`\`\`

---

### 6. Check NIMC IPE Clearance Status
- **Method**: \`GET\`
- **Path**: \`/api/v1/nin/ipe/status\`
- **Query Parameters**:
  - \`reference\` (optional): Lorabiz platform reference (e.g. \`lora_ipe_...\`)
  - \`client_reference\` (optional): Custom client reference
  *(Provide reference or client_reference to look up status)*

#### Completed Response (\`200 OK\`)
\`\`\`json
{
  "status": "success",
  "reference": "lora_ipe_1725934820123_xyz89",
  "tracking_id": "0TEB51VS5RES4ZZ",
  "client_reference": "kyc_ipe_order_10029",
  "request_status": "completed",
  "message": "IPE Clearance completed successfully.",
  "new_tracking_id": "0T448N2SR7OFAZC",
  "resolved_nin": "44297896804",
  "completed_at": "2026-09-05T21:47:56.000Z",
  "amount_charged": 2500.0,
  "currency": "NGN",
  "environment": "live",
  "date": "2026-09-05T20:30:12.000Z"
}
\`\`\`

#### Failed Response (\`200 OK with Refund\`)
\`\`\`json
{
  "status": "error",
  "reference": "lora_ipe_1725934820123_xyz89",
  "tracking_id": "0TBH26SQHQCR9F",
  "client_reference": "kyc_ipe_order_10029",
  "request_status": "failed",
  "message": "Your IPE Clearance request has failed.",
  "error_detail": "Your IPE clearance request has failed. Please contact support for more details.",
  "refunded": true,
  "completed_at": null,
  "amount_charged": 0.0,
  "currency": "NGN",
  "environment": "live",
  "date": "2026-09-05T20:30:12.000Z"
}
\`\`\`

---

### 7. Submit NIMC NIN Personalization Request
- **Method**: \`POST\`
- **Path**: \`/api/v1/nin/personalization\`
- **Content-Type**: \`application/json\`

Resolves official NIMC enrollment Tracking ID to retrieve the citizen's official 11-digit NIN, verified demographic details, and official National Identification Slip in raw base64 PDF format (\`pdf_base64\`).

**Strict Zero-Refund Policy**:
NIMC NIN Personalization is strictly non-refundable. Failed or rejected requests retain the charged fee (₦1,500.00).

#### Sandbox Test Numbers:
- Success: \`0TEB51VS5RES4ZZ\` (transitions to \`completed\` in 5 seconds with \`resolved_nin: "44297896804"\`, raw \`pdf_base64\`, and demographics)
- Failed (Zero Refund): \`0TBH26SQHQCR9F\` (transitions to \`failed\`, debited fee ₦1,500 retained)
- Duplicate Conflict (409): \`0TDUPCONFLICT01\`

#### Request Body
\`\`\`json
{
  "tracking_id": "0TEB51VS5RES4ZZ",
  "client_reference": "kyc_pzn_1001"
}
\`\`\`

#### Success Response (\`201 Created\`)
\`\`\`json
{
  "status": "success",
  "message": "NIN Personalization request submitted successfully.",
  "reference": "lora_pzn_1725934820123_abc45",
  "tracking_id": "0TEB51VS5RES4ZZ",
  "client_reference": "kyc_pzn_1001",
  "request_status": "submitted",
  "amount_charged": 1500.0,
  "currency": "NGN",
  "environment": "live"
}
\`\`\`

---

### 8. Check NIMC NIN Personalization Status
- **Method**: \`GET\`
- **Path**: \`/api/v1/nin/personalization/status\`
- **Query Parameters**:
  - \`reference\` (optional): Lorabiz platform reference (e.g. \`lora_pzn_...\`)
  - \`client_reference\` (optional): Custom client reference
  *(Provide reference or client_reference to look up status. Polling by tracking_id is strictly prohibited)*

#### Processing Response (\`200 OK — Explicit Fee Display\`)
\`\`\`json
{
  "status": "success",
  "reference": "lora_pzn_1725934820123_abc45",
  "tracking_id": "0TEB51VS5RES4ZZ",
  "client_reference": "kyc_pzn_1001",
  "request_status": "processing",
  "message": "Your NIN Personalization request is currently processing. Please check back later.",
  "completed_at": null,
  "amount_charged": 1500.0,
  "currency": "NGN",
  "environment": "live",
  "date": "2026-09-10T14:45:00.000Z"
}
\`\`\`

#### Completed Response (\`200 OK — Direct pdf_base64 Delivery\`)
\`\`\`json
{
  "status": "success",
  "reference": "lora_pzn_1725934820123_abc45",
  "tracking_id": "0TEB51VS5RES4ZZ",
  "client_reference": "kyc_pzn_1001",
  "request_status": "completed",
  "message": "NIN Personalization completed successfully.",
  "resolved_nin": "44297896804",
  "pdf_base64": "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoK...",
  "data": {
    "nin": "44297896804",
    "firstname": "IBRAHIM",
    "surname": "MUSA",
    "middlename": "BELLO",
    "birthdate": "1995-04-12",
    "gender": "Male",
    "telephoneno": "08012345678",
    "residence_state": "Kano",
    "photo": "/9j/4AAQSkZJRg..."
  },
  "completed_at": "2026-09-10T14:50:00.000Z",
  "amount_charged": 1500.0,
  "currency": "NGN",
  "environment": "live",
  "date": "2026-09-10T14:45:00.000Z"
}
\`\`\`

#### Failed Response (\`200 OK — Strict Zero Refund\`)
\`\`\`json
{
  "status": "error",
  "reference": "lora_pzn_1725934820123_abc45",
  "tracking_id": "0TBH26SQHQCR9F",
  "client_reference": "kyc_pzn_1001",
  "request_status": "failed",
  "message": "Your NIN Personalization request has failed.",
  "error_detail": "Tracking ID could not be resolved or was rejected by identity authority.",
  "completed_at": null,
  "amount_charged": 1500.0,
  "currency": "NGN",
  "environment": "live",
  "date": "2026-09-10T14:45:00.000Z"
}
\`\`\`

---

## Centralized Webhooks & HMAC Signatures
Configure your centralized webhook URL in the [Developer Console](https://lorabiz.com/dashboard/developer). All events are dispatched with:
- \`x-lorabiz-signature\`: HMAC-SHA256 hex digest computed with your webhook secret.
- \`x-lorabiz-event\`: Event name (\`nin_validation.submitted\`, \`nin_validation.completed\`, \`nin_validation.failed\`, \`nin_ipe.submitted\`, \`nin_ipe.completed\`, \`nin_ipe.failed\`, \`nin_personalization.submitted\`, \`nin_personalization.completed\`, \`nin_personalization.failed\`).

### Event: \`nin_ipe.completed\`
\`\`\`json
{
  "event": "nin_ipe.completed",
  "environment": "live",
  "timestamp": "2026-09-05T21:47:56.240Z",
  "data": {
    "reference": "lora_ipe_1725934820123_xyz89",
    "tracking_id": "0TEB51VS5RES4ZZ",
    "client_reference": "kyc_ipe_order_10029",
    "new_tracking_id": "0T448N2SR7OFAZC",
    "resolved_nin": "44297896804",
    "request_status": "completed",
    "message": "IPE Clearance completed successfully.",
    "completed_at": "2026-09-05T21:47:56.000Z",
    "amount_charged": 2500.0,
    "currency": "NGN"
  }
}
\`\`\`

### Event: \`nin_ipe.failed\`
\`\`\`json
{
  "event": "nin_ipe.failed",
  "environment": "live",
  "timestamp": "2026-09-05T21:47:56.240Z",
  "data": {
    "reference": "lora_ipe_1725934820123_xyz89",
    "tracking_id": "0TBH26SQHQCR9F",
    "client_reference": "kyc_ipe_order_10029",
    "request_status": "failed",
    "message": "Your IPE Clearance request has failed.",
    "error_detail": "Your IPE clearance request has failed. Please contact support for more details.",
    "refunded": true,
    "refund_amount": 2500.0,
    "amount_charged": 0.0,
    "currency": "NGN"
  }
}
\`\`\`

### Event: \`nin_personalization.completed\`
\`\`\`json
{
  "event": "nin_personalization.completed",
  "environment": "live",
  "timestamp": "2026-09-10T14:50:00.000Z",
  "data": {
    "reference": "lora_pzn_1725934820123_abc45",
    "tracking_id": "0TEB51VS5RES4ZZ",
    "client_reference": "kyc_pzn_1001",
    "resolved_nin": "44297896804",
    "pdf_base64": "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoK...",
    "data": {
      "nin": "44297896804",
      "firstname": "IBRAHIM",
      "surname": "MUSA",
      "middlename": "BELLO",
      "birthdate": "1995-04-12",
      "gender": "Male",
      "telephoneno": "08012345678",
      "residence_state": "Kano",
      "photo": "/9j/4AAQSkZJRg..."
    },
    "request_status": "completed",
    "message": "NIN Personalization completed successfully.",
    "completed_at": "2026-09-10T14:50:00.000Z",
    "amount_charged": 1500.0,
    "currency": "NGN"
  }
}
\`\`\`

### Event: \`nin_personalization.failed\`
\`\`\`json
{
  "event": "nin_personalization.failed",
  "environment": "live",
  "timestamp": "2026-09-10T14:50:00.000Z",
  "data": {
    "reference": "lora_pzn_1725934820123_abc45",
    "tracking_id": "0TBH26SQHQCR9F",
    "client_reference": "kyc_pzn_1001",
    "request_status": "failed",
    "message": "Your NIN Personalization request has failed.",
    "error_detail": "Tracking ID could not be resolved or was rejected by identity authority.",
    "refunded": false,
    "amount_charged": 1500.0,
    "currency": "NGN"
  }
}
\`\`\`

---

## Error Handling & Standard Codes
Every error response adheres to standard envelope format:
\`\`\`json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human readable description"
}
\`\`\`

### Error Codes:
- \`VALIDATION_ERROR\` (400): Malformed input (e.g., invalid 11-digit format, missing query parameters).
- \`UNAUTHORIZED\` (401): Missing or invalid API key.
- \`INSUFFICIENT_BALANCE\` (402): Account balance is insufficient to process verification.
- \`NOT_FOUND\` / \`RECORD_NOT_FOUND\` (404/422): Identification number or tracking ID not found. Zero charge applied (₦0.00).
- \`DUPLICATE_REQUEST\` (409): An active validation request for this NIN and category is already currently in progress. Zero charge applied (₦0.00).
- \`RATE_LIMITED\` (429): Exceeded sliding-window rate limit (Default: 60 req/min).
- \`SERVICE_UNAVAILABLE\` (503): National gateway temporary maintenance.
`;

export async function GET() {
  return new NextResponse(LLMS_TEXT_CONTENT, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
