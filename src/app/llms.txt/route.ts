import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 86400; // Cache for 24 hours

const LLMS_TEXT_CONTENT = `# Lorabiz Developer Platform API

> Enterprise developer API gateway for Nigerian identity verification, regulatory compliance, business registrations, and government documentation. Built for modern fintechs, developers, and autonomous AI agents.

## Quick Links
- Interactive Documentation: https://lorabiz.com/docs
- OpenAPI 3.1 Spec: https://lorabiz.com/api/openapi.json
- Developer Dashboard & API Keys: https://lorabiz.com/dashboard/developer

## Base URL
https://lorabiz.com

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
- Success (Female Record): \`61904909560\` (Returns 200 OK)
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
  "message": "NIN verification slip generated successfully.",
  "data": {
    "nin": "12345678901",
    "firstname": "MUSA",
    "middlename": "IBRAHIM",
    "surname": "BELLO",
    "fullname": "MUSA IBRAHIM BELLO",
    "gender": "Male",
    "birthdate": "1994-05-18",
    "telephoneno": "08012345678",
    "photo": "/9j/4AAQSkZJRgABAQ...",
    "address": "14 Adeola Odeku Street, Victoria Island",
    "residence_lga": "Eti-Osa",
    "residence_state": "Lagos",
    "self_origin_lga": "Kano Municipal",
    "self_origin_state": "Kano",
    "tracking_id": "TRK-984210"
  },
  "slip": {
    "slip_type": "nin_premium",
    "display_name": "Premium Card Slip",
    "pdf_base64": "JVBERi0xLjQKJ..."
  },
  "transaction": {
    "reference": "NIN_PREMIUM_1725732104912",
    "client_reference": "TXN_ORD_9812401",
    "amount_charged": 150.0,
    "currency": "NGN",
    "environment": "live",
    "balance_after": 45850.0
  }
}
\`\`\`

---

### 2. Verify NIN by Phone Number
- **Method**: \`POST\`
- **Path**: \`/api/v1/nin/by-phone\`
- **Content-Type**: \`application/json\`

#### Sandbox Test Numbers:
- Success (Female Record): \`09047073004\` (Returns 200 OK)
- Success (Male Record): \`08012345678\` (Returns 200 OK)
- Record Not Found (422): \`00000000000\` or \`07000000000\` (Billed ₦0.00)

#### Request Body
\`\`\`json
{
  "phone": "08012345678",
  "slip_type": "nin_premium",
  "client_reference": "TXN_PHONE_9812402"
}
\`\`\`
- \`phone\` (string, required): Exactly 11 numeric digits (e.g., "08012345678").
- \`slip_type\` (string, required):
  - \`nin_regular\`: Standard Regular slip.
  - \`nin_standard\`: Standard Biometric KYC slip.
  - \`nin_premium\`: Premium wallet card slip.
- \`client_reference\` (string, optional): Your internal idempotency or transaction tracking ID.

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
- \`VALIDATION_ERROR\` (400): Malformed input (e.g., invalid 11-digit format).
- \`UNAUTHORIZED\` (401): Missing or invalid API key.
- \`INSUFFICIENT_BALANCE\` (402): Account balance is insufficient to process verification.
- \`RECORD_NOT_FOUND\` (422): Identification number not found on national identity database. Zero charge applied (₦0.00).
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
