# NIMC IPE Clearance (Exception Resolution) Service Specification

The **NIMC IPE Clearance API** resolves biometric enrollment exceptions (such as biometric mismatch, suspension, duplicate biometric records, or unreleased NIN) flagged in the National Identity Management Commission (NIMC) database.

Upon successful resolution, NIMC issues a **new official Tracking ID** (`new_tracking_id`) and releases the cleared 11-digit **National Identification Number** (`resolved_nin`).

---

## 1. Core Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/nin/ipe` | Submit an IPE clearance application by NIMC Tracking ID. |
| `GET` | `/api/v1/nin/ipe/status` | Query real-time clearance status by `reference`, `tracking_id`, or `client_reference`. |

---

## 2. Authentication & Headers

Authenticate every request using your API key (Live or Test):

```http
Authorization: Bearer lora_live_xxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
Accept: application/json
```

---

## 3. Platform Identifier Standard

To ensure absolute consistency across all APIs, webhooks, and ledger transactions:

- **`reference`**: The authoritative Lorabiz transaction/order reference (e.g. `lora_ipe_1725934820123_xyz89`).
- **`client_reference`**: The developer's optional custom idempotency tracking string (max 128 characters).
- **`tracking_id`**: **Strictly reserved for the official NIMC Tracking ID** (e.g. `0TEB51VS5RES4ZZ`).
- **`new_tracking_id`**: The updated NIMC Tracking ID returned upon clearance completion (e.g. `0T448N2SR7OFAZC`).
- **`resolved_nin`**: The 11-digit cleared/extracted NIN released by NIMC (e.g. `44297896804`).
- **`refunded`**: Returned with `true` **strictly and only when `request_status === "failed"`**.

---

## 4. POST /api/v1/nin/ipe — Submit IPE Clearance

Submits a new IPE exception clearance request. If an active request is already processing for the same tracking ID, the API rejects duplicate submissions (HTTP 409). If submitted with an identical `client_reference`, it returns the existing ticket idempotently (HTTP 200).

### 4.1 Request Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `tracking_id` | `string` | **Yes** | 8 to 32 alphanumeric characters representing the official NIMC Tracking ID (e.g., `"0TEB51VS5RES4ZZ"`). |
| `client_reference` | `string` | No | Developer custom correlation ID for idempotency and external tracking (max 128 chars). |

#### Example Request Body
```json
{
  "tracking_id": "0TEB51VS5RES4ZZ",
  "client_reference": "kyc_ipe_order_10029"
}
```

---

### 4.2 Success Response (HTTP 201 Created)

```json
{
  "status": "success",
  "message": "NIMC IPE Clearance request submitted successfully.",
  "reference": "lora_ipe_1725934820123_xyz89",
  "tracking_id": "0TEB51VS5RES4ZZ",
  "client_reference": "kyc_ipe_order_10029",
  "request_status": "submitted",
  "amount_charged": 2500,
  "currency": "NGN",
  "environment": "live"
}
```

---

### 4.3 Idempotent Retrieval Response (HTTP 200 OK)
Returned when a request with the same `client_reference` has already been submitted:

```json
{
  "status": "success",
  "message": "Existing NIMC IPE Clearance request retrieved via client_reference.",
  "reference": "lora_ipe_1725934820123_xyz89",
  "tracking_id": "0TEB51VS5RES4ZZ",
  "client_reference": "kyc_ipe_order_10029",
  "request_status": "processing",
  "amount_charged": 2500,
  "currency": "NGN",
  "environment": "live"
}
```

---

### 4.4 Duplicate Request Conflict (HTTP 409 Conflict)
Returned if an active clearance request for this tracking ID is already in processing:

```json
{
  "status": "error",
  "code": "DUPLICATE_REQUEST",
  "message": "An active IPE clearance request is already in progress for Tracking ID 0TEB51VS5RES4ZZ. Duplicate submission rejected to prevent double debits.",
  "reference": "lora_ipe_1725934820123_xyz89",
  "tracking_id": "0TEB51VS5RES4ZZ",
  "client_reference": "kyc_ipe_order_10029",
  "transaction": {
    "amount_charged": 0.0,
    "currency": "NGN"
  }
}
```

---

### 4.5 Insufficient Funds (HTTP 402 Payment Required)

```json
{
  "status": "error",
  "code": "INSUFFICIENT_FUNDS",
  "message": "Insufficient wallet balance. Required: ₦2,500, Current Balance: ₦450. Please fund your developer wallet.",
  "transaction": {
    "amount_charged": 0.0,
    "currency": "NGN"
  }
}
```

---

## 5. GET /api/v1/nin/ipe/status — Check Clearance Status

Polls real-time clearance status. You must provide at least one identifier query parameter: `?reference=...`, `?tracking_id=...`, or `?client_reference=...`.

### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `reference` | `string` | Optional* | The Lorabiz platform reference token (e.g. `lora_ipe_...`). |
| `tracking_id` | `string` | Optional* | The applicant's official NIMC Tracking ID. |
| `client_reference` | `string` | Optional* | The developer's custom idempotency tracking string. |

*\*At least one parameter is required.*

#### Example Request
```http
GET /api/v1/nin/ipe/status?reference=lora_ipe_1725934820123_xyz89 HTTP/1.1
Host: api.lorabiz.com
Authorization: Bearer lora_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 5.1 Status: Processing (HTTP 200 OK)

```json
{
  "status": "success",
  "reference": "lora_ipe_1725934820123_xyz89",
  "tracking_id": "0TEB51VS5RES4ZZ",
  "client_reference": "kyc_ipe_order_10029",
  "request_status": "processing",
  "message": "Your IPE Clearance request is currently processing. Please check back later.",
  "completed_at": null,
  "amount_charged": 2500,
  "currency": "NGN",
  "environment": "live",
  "date": "2026-09-05T20:30:12.000Z"
}
```

---

### 5.2 Status: Completed (HTTP 200 OK)
Returned when NIMC clearance is complete, releasing the new tracking ID and 11-digit NIN:

```json
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
  "amount_charged": 2500,
  "currency": "NGN",
  "environment": "live",
  "date": "2026-09-05T20:30:12.000Z"
}
```

---

### 5.3 Status: Failed (HTTP 200 OK with Automatic Refund)
If the upstream identity gateway or NIMC rejects the application, the fee is automatically credited back to your developer wallet, and `refunded: true` is included:

```json
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
  "amount_charged": 0,
  "currency": "NGN",
  "environment": "live",
  "date": "2026-09-05T20:30:12.000Z"
}
```

---

## 6. Webhook Notifications

Configure your webhook URL at **Developer Dashboard &rarr; Webhooks**. Webhook payloads are signed using your Webhook Secret via HMAC-SHA256 in the `X-Lorabiz-Signature` header.

### 6.1 `nin_ipe.submitted`

```json
{
  "event": "nin_ipe.submitted",
  "environment": "live",
  "timestamp": "2026-09-05T20:30:12.105Z",
  "data": {
    "reference": "lora_ipe_1725934820123_xyz89",
    "tracking_id": "0TEB51VS5RES4ZZ",
    "client_reference": "kyc_ipe_order_10029",
    "request_status": "submitted",
    "message": "NIMC IPE Clearance request submitted successfully.",
    "amount_charged": 2500,
    "currency": "NGN"
  }
}
```

### 6.2 `nin_ipe.completed`

```json
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
    "amount_charged": 2500,
    "currency": "NGN"
  }
}
```

### 6.3 `nin_ipe.failed`

```json
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
    "refund_amount": 2500,
    "amount_charged": 0,
    "currency": "NGN"
  }
}
```

---

## 7. Sandbox Testing & Simulation Matrix

Test your integration safely in Sandbox Mode using your `lora_test_...` key. No live funds are deducted.

| Test Tracking ID | Simulated Outcome | Simulation Behavior |
| :--- | :--- | :--- |
| **`0TEB51VS5RES4ZZ`** | **Success** | Starts in `submitted`, transitions to `completed` after 5 seconds with `new_tracking_id: "0T448N2SR7OFAZC"` and `resolved_nin: "44297896804"`. Dispatches `nin_ipe.completed` webhook. |
| **`0TBH26SQHQCR9F`** | **Failure + Refund** | Starts in `submitted`, transitions to `failed` after 5 seconds with `refunded: true`. Sandbox balance is refunded. Dispatches `nin_ipe.failed` webhook. |
| **`0TDUPCONFLICT01`** | **Duplicate Conflict** | Immediately rejects with HTTP 409 `DUPLICATE_REQUEST`. |
