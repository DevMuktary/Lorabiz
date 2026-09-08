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
  "slip_type": "nin_standard",
  "include_slip": true
}
\`\`\`
- \`nin\` (string, required): Exactly 11 numeric digits.
- \`slip_type\` (string, optional, default: "nin_basic"):
  - \`nin_basic\`: Demographic data only.
  - \`nin_vnin\`: Virtual NIN generation and demographic lookup.
  - \`nin_regular\`: Standard demographic slip with portrait and QR code.
  - \`nin_standard\`: Standard KYC identity slip with comprehensive bio-data.
  - \`nin_premium\`: Premium wallet-sized NIN card layout with barcode/QR.
- \`include_slip\` (boolean, optional, default: true): When true and slip_type produces a document, \`pdf_base64\` is generated and included.

#### Success Response (\`200 OK\`)
\`\`\`json
{
  "status": "success",
  "data": {
    "nin": "12345678901",
    "firstname": "MUSA",
    "middlename": "IBRAHIM",
    "surname": "BELLO",
    "fullname": "MUSA IBRAHIM BELLO",
    "gender": "male",
    "birthdate": "1994-05-18",
    "telephoneno": "08012345678",
    "photo": "data:image/jpeg;base64,...",
    "address": "14 ADEOLA ODEKU STREET, VICTORIA ISLAND",
    "residence_lga": "ETI OSA",
    "residence_state": "LAGOS",
    "self_origin_lga": "KANO MUNICIPAL",
    "self_origin_state": "KANO",
    "tracking_id": "TRK-984210",
    "slip_type": "nin_standard",
    "pdf_base64": "JVBERi0xLjQK..."
  },
  "meta": {
    "charged_amount": 150.0,
    "currency": "NGN",
    "environment": "test",
    "reference": "api_txn_...",
    "timestamp": "2026-09-08T02:00:00.000Z"
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
  "slip_type": "nin_regular",
  "include_slip": true
}
\`\`\`
- \`phone\` (string, required): Exactly 11 numeric digits (e.g., "08012345678").
- \`slip_type\` (string, optional, default: "nin_regular"):
  - \`nin_regular\`: Standard slip.
  - \`nin_standard\`: Standard KYC slip.
  - \`nin_premium\`: Premium wallet card slip.
- \`include_slip\` (boolean, optional, default: true): Returns high-resolution \`pdf_base64\`.

---

## Error Handling & Standard Codes
Every non-2xx response adheres to standard envelope format:
\`\`\`json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human readable description",
  "details": []
}
\`\`\`

### Common Codes:
- \`INVALID_API_KEY\` (401): Missing or invalid API key.
- \`INSUFFICIENT_BALANCE\` (402): Account balance is insufficient to process verification.
- \`VALIDATION_ERROR\` (400): Malformed input (e.g. invalid NIN length).
- \`RECORD_NOT_FOUND\` (422): Identification number not found on national identity database. Zero charge applied.
- \`RATE_LIMIT_EXCEEDED\` (429): Exceeded sliding-window rate limit (Default: 60 req/min).
- \`GATEWAY_TIMEOUT\` (504): National identity database provider temporary timeout.
`;

export async function GET() {
  return new NextResponse(LLMS_TEXT_CONTENT, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
