# Lorabiz Developer API — Architecture & Engineering Standards

This document establishes the technical architecture, security invariants, and engineering standards for the **Lorabiz Developer API Platform**.

---

## 1. Architectural Principles

1. **Clean & Minimal Endpoint Topology**:
   - We maintain only dedicated, canonical routes under `/api/v1/nin/`:
     - `POST /api/v1/nin/by-nin`: NIN verification and slip generation by 11-digit National Identification Number.
     - `POST /api/v1/nin/by-phone`: NIN verification and slip generation by 11-digit registered phone number.
   - All redundant, legacy, or alias routes (such as `/api/v1/identity/...`) are strictly omitted.

2. **Provider Agnosticism & Output Standardization**:
   - External API consumers must **never** be exposed to upstream provider anomalies, changing JSON structures, or provider-specific keys (e.g., `easeid` envelopes, `user_data`, `details`, or `response[0]`).
   - Lorabiz normalizes demographic fields into a single, clean **straightforward lowercase** contract:
     - `nin`, `firstname`, `middlename`, `surname`, `fullname`, `gender`, `birthdate`, `telephoneno`, `photo`, `address`, `residence_lga`, `residence_state`, `self_origin_lga`, `self_origin_state`, `tracking_id`.
   - Address fields are populated when NIMC returns them, and gracefully defaulted to `null` or empty strings when omitted by NIMC.

3. **High-Performance Direct Base64 Delivery (No Cloudinary Overhead)**:
   - For developer API requests, generated PDF slips are returned **directly as `pdf_base64`**.
   - Cloudinary upload is bypassed for API calls. This saves 500ms–1500ms of roundtrip upload latency and eliminates Cloudinary storage and bandwidth costs for bulk API traffic.

4. **Strict Database-Driven Pricing (Zero Fallback Constants)**:
   - **No fallback prices**: Prices are never hardcoded as fallback constants in application logic.
   - Every price must be explicitly configured in the `ServicePricing` database table.
   - If a pricing key is missing or disabled in the database, the API fails fast with an explicit error (`SERVICE_UNCONFIGURED` / 503 Service Unavailable) to prevent incorrect or unexpected charges.

5. **Multi-Environment Isolation**:
   - **Test Mode (`lora_test_...`)**:
     - Deducts from the developer's virtual `sandboxBalance` (default ₦1,000,000).
     - Live wallet funds (`user.wallet.balance`) are never touched.
   - **Live Mode (`lora_live_...`)**:
     - Real wallet deductions are executed inside atomic database transactions (`prisma.$transaction`).
     - Live mode requires an approved `DeveloperProfile` (`status === "APPROVED"`).

6. **Zero-Risk Billing Policy**:
   - If a verification call fails due to invalid parameters (400), authentication failure (401), rate limits (429), or upstream provider downtime (502/503), the developer is charged **₦0.00**.
   - Charges only apply upon successful verification and slip generation (HTTP 200).

---

## 2. Authentication & Authorization

Developers authenticate using their API key via the HTTP `Authorization` header:

```http
Authorization: Bearer lora_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

### Dual-Mode Auth Parsing:
To ensure maximum compatibility (Postman, Scalar, cURL, scripts):
- `Authorization: Bearer <key>` (Standard RFC 6750)
- `Authorization: <key>` (Without "Bearer" prefix)
- `x-api-key: <key>` (Custom header)

### Verification Flow:
1. Strips any leading `"Bearer "` prefix.
2. Computes SHA-256 hash of the extracted raw key.
3. Fast Redis lookup (`apikey:<hash>`) completes in `< 3ms`.
4. If Redis misses or disconnects, falls back to a PostgreSQL query on `ApiKey`.
5. Checks user account suspension status (`user.isSuspended`).
6. If IP whitelisting is configured on the key, matches client IP against `apiKey.ipWhitelist`.

---

## 3. Rate Limiting & Sliding Windows

Rate limiting is enforced at the edge via Redis sliding window counters:

| Environment | Rate Limit | Window | Throttle Action |
| :--- | :--- | :--- | :--- |
| **Test Mode** | 60 requests | 60 seconds | Returns `429 Too Many Requests` |
| **Live Mode** | 600 requests | 60 seconds | Returns `429 Too Many Requests` |

Headers returned on all API calls:
- `X-RateLimit-Limit`: Maximum requests permitted per window.
- `X-RateLimit-Remaining`: Remaining request quota in current window.
- `X-RateLimit-Reset`: Time in seconds until quota resets.

---

## 4. Standardized Response Envelopes

### 4.1 Success Envelope (HTTP 200)

```json
{
  "status": "success",
  "message": "NIN verification slip generated successfully.",
  "data": {
    "nin": "23456789012",
    "firstname": "FATIMA",
    "middlename": "ZAHRA",
    "surname": "ABUBAKAR",
    "fullname": "FATIMA ZAHRA ABUBAKAR",
    "gender": "Female",
    "birthdate": "1996-08-14",
    "telephoneno": "08023456789",
    "photo": "/9j/4AAQSkZJRg...",
    "address": "Plot 42 Ahmadu Bello Way, Central Business District",
    "residence_lga": "Abuja Municipal",
    "residence_state": "FCT",
    "self_origin_lga": "Kano Municipal",
    "self_origin_state": "Kano",
    "tracking_id": "TRK-881920"
  },
  "slip": {
    "slip_type": "nin_standard",
    "display_name": "Standard Biometric Slip",
    "pdf_base64": "JVBERi0xLjQK..."
  },
  "transaction": {
    "reference": "NIN_PREMIUM_1725732104912",
    "amount_charged": 150.00,
    "currency": "NGN",
    "environment": "live",
    "balance_after": 45850.00
  }
}
```

### 4.2 Error Envelope (HTTP 4xx / 5xx)

```json
{
  "status": "error",
  "code": "INSUFFICIENT_BALANCE",
  "message": "Your wallet balance is insufficient for this slip type. Please fund your wallet.",
  "environment": "live"
}
```

---

## 5. Audit Logging & Real-Time Console Analytics

Every API request invokes asynchronous background logging via `recordApiRequestLog`:
- Writes to `ApiRequestLog` table.
- Strips sensitive authorization secrets before persisting headers.
- Emits real-time Server-Sent Events (SSE) to the developer's open console at `/dashboard/developer`.
