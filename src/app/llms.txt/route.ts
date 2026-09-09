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
  "tracking_id": "nin_val_da7c1d16cd69891a7a9044",
  "client_reference": "REF_MY_APP_99182",
  "nin": "18867568313",
  "validation_type": "no_record_found",
  "request_status": "submitted",
  "amount_charged": 700.00,
  "currency": "NGN",
  "refunded": false,
  "environment": "live"
}
\`\`\`

---

### 4. Check NIN Validation Status
- **Method**: \`GET\`
- **Path**: \`/api/v1/nin/validation/status\`
- **Query Parameters**:
  - \`tracking_id\` (optional): Lorabiz tracking identifier
  - \`client_reference\` (optional): Your custom reference
  *(Provide either tracking_id or client_reference to look up status)*

In both live and test modes, look up requests using the \`tracking_id\` returned upon submission or your custom \`client_reference\`.

#### Status Transitions:
- \`submitted\`
- \`processing\`
- \`validated\`
- \`failed\`

#### Success Response (\`200 OK\`)
\`\`\`json
{
  "status": "success",
  "tracking_id": "nin_val_da7c1d16cd69891a7a9044",
  "client_reference": "REF_MY_APP_99182",
  "nin": "18867568313",
  "validation_type": "no_record_found",
  "request_status": "validated",
  "message": "NIN Validation completed successfully.",
  "error_detail": null,
  "completed_at": "2026-09-09T08:35:12.000Z",
  "refunded": false,
  "amount_charged": 700.00,
  "currency": "NGN",
  "environment": "live",
  "date": "2026-09-09T08:15:00.000Z"
}
\`\`\`

---

## Centralized Webhooks & HMAC Signatures
Configure your centralized webhook URL in the [Developer Console](https://lorabiz.com/dashboard/developer). All events are dispatched with:
- \`x-lorabiz-signature\`: HMAC-SHA256 hex digest computed with your webhook secret.
- \`x-lorabiz-event\`: Event name (\`nin_validation.submitted\`, \`nin_validation.completed\`, \`nin_validation.failed\`).

### Event: \`nin_validation.completed\`
\`\`\`json
{
  "event": "nin_validation.completed",
  "data": {
    "tracking_id": "nin_val_da7c1d16cd69891a7a9044",
    "client_reference": "REF_MY_APP_99182",
    "nin": "18867568313",
    "validation_type": "no_record_found",
    "request_status": "validated",
    "message": "NIN Validation completed successfully.",
    "completed_at": "2026-09-09T08:35:12.000Z",
    "refunded": false,
    "amount_charged": 500.00,
    "currency": "NGN"
  }
}
\`\`\`

### Event: \`nin_validation.failed\`
\`\`\`json
{
  "event": "nin_validation.failed",
  "data": {
    "tracking_id": "nin_val_da7c1d16cd69891a7a9044",
    "client_reference": "REF_MY_APP_99182",
    "nin": "18867568313",
    "validation_type": "no_record_found",
    "request_status": "failed",
    "message": "Your NIN Validation request has failed.",
    "error_detail": "Validation failed due to suspended or unverified record.",
    "refunded": true,
    "amount_charged": 0.00,
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
