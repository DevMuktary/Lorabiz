# NIN Verification & Slip Printing API Specification

This document defines the technical specification for the **NIN Verification and Slip Printing API**, covering NIN and Phone search modes, the supported slip tiers, provider payload normalization, and data contracts.

---

## 1. Supported Search Modes & Slip Formats

### 1.1 Search Mode: By National Identification Number (NIN)
- **Canonical Endpoint**: `POST /api/v1/nin/by-nin`
- **Identifier**: 11-digit National Identification Number (numeric string).
- **Supported Slip Types (5 Formats)**:
  1. `nin_basic`: Basic demographic slip. Contains core personal details without extended address/tracking.
  2. `nin_vnin`: Virtual NIN (vNIN) verification slip format.
     > **Note**: **VNIN is NOT a separate service**; it is a slip layout format.
  3. `nin_regular`: Standard NIMC Regular slip layout.
  4. `nin_standard`: Standard Biometric KYC slip featuring applicant photo and full demographics.
  5. `nin_premium`: Premium ID card layout (wallet-sized front & back).

### 1.2 Search Mode: By Phone Number (MSISDN)
- **Canonical Endpoint**: `POST /api/v1/nin/by-phone`
- **Identifier**: 11-digit Nigerian registered mobile phone number (e.g., `08012345678`, `09047073004`).
- **Supported Slip Types (3 Formats)**:
  1. `nin_regular`: Standard NIMC Regular slip layout.
  2. `nin_standard`: Standard Biometric KYC slip.
  3. `nin_premium`: Premium ID card layout.

---

## 2. High-Performance PDF Delivery (Direct Base64)

To ensure maximum throughput, minimal latency, and zero Cloudinary costs:
- The PDF slip is returned directly in the response as `pdf_base64`.
- API consumers can directly decode or render this base64 string, stream it to users, or store it in their own document vaults.

---

## 3. Normalized Clean Lowercase Data Contract

The Lorabiz API standardizes all demographic fields into a single, clean, straightforward **lowercase / snake_case** format:

| Standard Field Key | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `nin` | string | 11-digit National Identification Number | `"23456789012"` |
| `firstname` | string | First Name | `"FATIMA"` |
| `middlename` | string \| null | Middle Name | `"ZAHRA"` |
| `surname` | string | Surname / Family Name | `"ABUBAKAR"` |
| `fullname` | string | Full Concatenated Name | `"FATIMA ZAHRA ABUBAKAR"` |
| `gender` | string | Gender ("Male" / "Female") | `"Female"` |
| `birthdate` | string | Date of Birth (YYYY-MM-DD) | `"1996-08-14"` |
| `telephoneno` | string \| null | Verified Mobile Phone Number | `"08023456789"` |
| `photo` | string | Base64 encoded JPEG photo | `"/9j/4AAQSkZJRg..."` |
| `address` | string \| null | Residential Street Address | `"Plot 42 Ahmadu Bello Way"` |
| `residence_lga` | string \| null | Local Government Area of residence | `"Abuja Municipal"` |
| `residence_state` | string \| null | State of residence | `"FCT"` |
| `self_origin_lga` | string \| null | Local Government Area of origin | `"Kano Municipal"` |
| `self_origin_state`| string \| null | State of origin | `"Kano"` |
| `tracking_id` | string \| null | NIMC Enrollment Tracking Reference | `"TRK-881920"` |

---

## 4. Complete Request & Response Contracts

### PART 1: Search by NIN (`POST /api/v1/nin/by-nin`)

#### (A) Example Request (Premium Slip)
```http
POST /api/v1/nin/by-nin HTTP/1.1
Host: api.lorabiz.com
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "nin": "23456789012",
  "slip_type": "nin_premium",
  "client_reference": "TXN_ORD_9812401"
}
```

#### (B) Example Successful Response (HTTP 200 OK)
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
    "photo": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEB...",
    "address": "Plot 42 Ahmadu Bello Way",
    "residence_lga": "Abuja Municipal",
    "residence_state": "FCT",
    "self_origin_lga": "Kano Municipal",
    "self_origin_state": "Kano",
    "tracking_id": "TRK-881920"
  },
  "slip": {
    "slip_type": "nin_premium",
    "display_name": "Premium Card Slip",
    "pdf_base64": "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDM..."
  },
  "transaction": {
    "reference": "NIN_PREMIUM_1725732104912",
    "client_reference": "TXN_ORD_9812401",
    "amount_charged": 150.00,
    "currency": "NGN",
    "environment": "live",
    "balance_after": 45850.00
  }
}
```

#### (C) Response If No Record Found (HTTP 422 Unprocessable Entity)
> *Zero-Risk Billing: Charged ₦0.00*
```json
{
  "status": "error",
  "code": "RECORD_NOT_FOUND",
  "message": "No identity record was found matching the provided NIN (00000000000). Please check the digits and try again.",
  "environment": "live",
  "transaction": {
    "amount_charged": 0.00,
    "currency": "NGN"
  }
}
```

#### (D) Response If Insufficient Balance (HTTP 402 Payment Required)
> *Fails before calling provider: Charged ₦0.00*
```json
{
  "status": "error",
  "code": "INSUFFICIENT_BALANCE",
  "message": "Insufficient wallet balance. This service costs ₦150.00, but your current balance is ₦50.00. Please fund your wallet to continue.",
  "environment": "live",
  "transaction": {
    "required_amount": 150.00,
    "current_balance": 50.00,
    "amount_charged": 0.00,
    "currency": "NGN"
  }
}
```

#### (E) Response If Invalid or Missing Key (HTTP 401 Unauthorized)
```json
{
  "status": "error",
  "code": "UNAUTHORIZED",
  "message": "Invalid or missing API key. Please provide a valid active API key in the Authorization header (e.g., 'Authorization: Bearer lora_live_...')."
}
```

---

### PART 2: Search by Phone (`POST /api/v1/nin/by-phone`)

#### (A) Example Request (Premium Slip)
```http
POST /api/v1/nin/by-phone HTTP/1.1
Host: api.lorabiz.com
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "phone": "08023456789",
  "slip_type": "nin_premium",
  "client_reference": "TXN_PHONE_9812402"
}
```

#### (B) Example Successful Response (HTTP 200 OK)
```json
{
  "status": "success",
  "message": "NIN verification slip generated successfully via phone lookup.",
  "data": {
    "nin": "23456789012",
    "firstname": "FATIMA",
    "middlename": "ZAHRA",
    "surname": "ABUBAKAR",
    "fullname": "FATIMA ZAHRA ABUBAKAR",
    "gender": "Female",
    "birthdate": "1996-08-14",
    "telephoneno": "08023456789",
    "photo": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEB...",
    "address": "Plot 42 Ahmadu Bello Way",
    "residence_lga": "Abuja Municipal",
    "residence_state": "FCT",
    "self_origin_lga": "Kano Municipal",
    "self_origin_state": "Kano",
    "tracking_id": "TRK-881920"
  },
  "slip": {
    "slip_type": "nin_premium",
    "display_name": "Premium Card Slip",
    "pdf_base64": "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDM..."
  },
  "transaction": {
    "reference": "TEL_PREMIUM_1725732104913",
    "client_reference": "TXN_PHONE_9812402",
    "amount_charged": 150.00,
    "currency": "NGN",
    "environment": "live",
    "balance_after": 45700.00
  }
}
```

#### (C) Response If No Record Found for Phone (HTTP 422 Unprocessable Entity)
> *Zero-Risk Billing: Charged ₦0.00*
```json
{
  "status": "error",
  "code": "RECORD_NOT_FOUND",
  "message": "No NIN profile was found linked to this phone number (08000000000). Please verify that the SIM registration is linked to a valid NIN.",
  "environment": "live",
  "transaction": {
    "amount_charged": 0.00,
    "currency": "NGN"
  }
}
```

#### (D) Response If Insufficient Balance for Phone (HTTP 402 Payment Required)
> *Fails before calling provider: Charged ₦0.00*
```json
{
  "status": "error",
  "code": "INSUFFICIENT_BALANCE",
  "message": "Insufficient wallet balance. This service costs ₦150.00, but your current balance is ₦80.00. Please fund your wallet to continue.",
  "environment": "live",
  "transaction": {
    "required_amount": 150.00,
    "current_balance": 80.00,
    "amount_charged": 0.00,
    "currency": "NGN"
  }
}
```

#### (E) Response If Invalid or Missing Key (HTTP 401 Unauthorized)
```json
{
  "status": "error",
  "code": "UNAUTHORIZED",
  "message": "Invalid or missing API key. Please provide a valid active API key in the Authorization header (e.g., 'Authorization: Bearer lora_live_...')."
}
```
