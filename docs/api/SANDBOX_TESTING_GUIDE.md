# Lorabiz Developer API — Sandbox Testing & Test Scenarios Guide

This guide details how to test the **Lorabiz Developer API** in **Sandbox / Test Mode** (`lora_test_...`).

Developers can thoroughly test both **happy paths (success)** and **unhappy paths (record not found, validation error, insufficient funds)** without spending real funds or pinging live government databases.

---

## 1. Sandbox Overview

- **API Key**: Any key starting with \`lora_test_\` (obtain from your [Developer Dashboard](https://lorabiz.com/dashboard/developer)).
- **Sandbox Balance**: Automatically credited with virtual **₦1,000,000.00**.
- **Real Funds**: Real wallet funds are **never** deducted in test mode.
- **Latency**: Near-instant responses (< 50ms) for fast CI/CD and integration unit tests.

---

## 2. Designated Sandbox Test Scenarios

To allow developers to test error handling on their frontends and backends, Lorabiz provides **deterministic test numbers**:

### 2.1 Scenario: Record Found (200 OK — Success)
| Identifier | Search Type | Gender | Simulated Full Name | Origin / Residence |
| :--- | :--- | :--- | :--- | :--- |
| **`23456789012`** | NIN | Female | `FATIMA ZAHRA ABUBAKAR` | Kano / FCT |
| **`12345678901`** | NIN | Male | `MUSA IBRAHIM BELLO` | Kano / Lagos |
| **`08023456789`** | Phone | Female | `FATIMA ZAHRA ABUBAKAR` | Kano / FCT |
| **`08012345678`** | Phone | Male | `MUSA IBRAHIM BELLO` | Kano / Lagos |
| *Any other valid 11-digit number* | NIN / Phone | Either | Standard simulated citizen record | — |

#### Success Response (`200 OK`)
```json
{
  "status": "success",
  "message": "[TEST SANDBOX] NIN verification slip generated successfully.",
  "data": {
    "nin": "23456789012",
    "firstname": "FATIMA",
    "middlename": "ZAHRA",
    "surname": "ABUBAKAR",
    "fullname": "FATIMA ZAHRA ABUBAKAR",
    "gender": "Female",
    "birthdate": "1996-08-14",
    "telephoneno": "08023456789",
    "photo": "/9j/4AAQSkZJRgABAQ...",
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
    "pdf_base64": "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoK..."
  },
  "transaction": {
    "reference": "NIN_NIN_STANDARD_1725732104912",
    "client_reference": "TXN_ORD_10928",
    "amount_charged": 150.0,
    "currency": "NGN",
    "environment": "test",
    "balance_after": 999850.0
  }
}
```

---

### 2.2 Scenario: Record Not Found (422 Unprocessable Entity)
When a citizen enters a non-existent NIN or an unlinked phone number:
- Send NIN: **`00000000000`**, **`00000000001`**, or **`99999999999`**
- Send Phone: **`00000000000`**, **`07000000000`**, or **`08000000000`**

#### Response (\`422 Unprocessable Entity\`)
```json
{
  "status": "error",
  "code": "RECORD_NOT_FOUND",
  "message": "No identity record was found matching the provided National Identification Number (NIN).",
  "environment": "test",
  "transaction": {
    "amount_charged": 0.0,
    "currency": "NGN"
  }
}
```
> **Zero Risk Billing**: In both test and live environments, if a record is not found (`422`), the fee charged is strictly **₦0.00**.

---

### 2.3 Scenario: Malformed Input (400 Validation Error)
If the NIN or Phone is not exactly 11 digits:
```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Please provide a valid 11-digit National Identification Number (NIN)."
}
```

---

### 2.4 Scenario: Insufficient Sandbox Balance (402 Payment Required)
If your virtual sandbox balance falls below the required fee (₦150.00):
```json
{
  "status": "error",
  "code": "INSUFFICIENT_BALANCE",
  "message": "Insufficient test balance. Service costs ₦150.00, but current balance is ₦0.00."
}
```

---

## 3. Quick cURL Test Examples

### Test Happy Path
```bash
curl -X POST https://api.lorabiz.com/v1/nin/by-nin \
  -H "Authorization: Bearer lora_test_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "nin": "23456789012",
    "slip_type": "nin_standard"
  }'
```

### Test "Record Not Found" Path
```bash
curl -X POST https://lorabiz.com/api/v1/nin/by-nin \
  -H "Authorization: Bearer lora_test_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "nin": "00000000000",
    "slip_type": "nin_standard"
  }'
```
