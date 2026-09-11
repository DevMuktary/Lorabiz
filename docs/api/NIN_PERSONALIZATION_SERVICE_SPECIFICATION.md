# NIMC NIN Personalization Service Specification

The **NIMC NIN Personalization API** resolves an applicant's official National Identity Management Commission (NIMC) enrollment Tracking ID to retrieve their verified 11-digit **National Identification Number (NIN)**, verified demographic information, and their personalized **National Identification Slip** in raw base64 PDF format (`pdf_base64`).

---

## 1. Core Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/nin/personalization` | Submit NIMC Tracking ID for NIN Personalization. |
| `GET` | `/api/v1/nin/personalization/status` | Query real-time personalization status by `reference` or `client_reference`. |

---

## 2. Authentication & Headers

Authenticate every request using your API key (Live or Test):

```http
Authorization: Bearer lora_live_xxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
Accept: application/json
```

Dual header authentication is supported:
- `Authorization: Bearer <api_key>`
- `x-api-key: <api_key>`

---

## 3. Platform Identifier Standard

To ensure absolute consistency across all APIs, webhooks, and ledger transactions:

- **`reference`**: The authoritative Lorabiz transaction/order reference (e.g. `lora_pzn_1725934820123_abc45`). Status queries are strictly keyed by this reference.
- **`client_reference`**: The developer's optional custom idempotency tracking string (max 128 characters).
- **`tracking_id`**: **Strictly reserved for the official NIMC Tracking ID** (e.g. `0TEB51VS5RES4ZZ`). It is accepted in POST submission bodies and returned in response payloads, but **never accepted as a query parameter for status lookups**.
- **`resolved_nin`**: The official 11-digit National Identification Number extracted upon personalization (e.g. `44297896804`).
- **`pdf_base64`**: The raw base64-encoded binary string of the official NIMC identification slip document, ready for immediate rendering, printing, or decoding into a PDF file.
- **`refunded`**: Returned as `false` on personalization failure (non-refundable service policy).

---

## 4. Refund Policy

NIMC NIN Personalization is strictly non-refundable once submitted. Failed or rejected requests retain the charged fee (`refunded: false`), as upstream query resources are consumed upon dispatch.

---

## 5. POST /api/v1/nin/personalization — Submit NIMC Tracking ID for NIN Personalization

Submits an applicant's NIMC Tracking ID for NIN Personalization.

### Sandbox Test Tracking IDs
Use test API keys (`lora_test_...`) to test deterministic lifecycle flows without spending real funds:

| Test Tracking ID | Simulated Outcome | Simulation Behavior |
| :--- | :--- | :--- |
| **`0TEB51VS5RES4ZZ`** | **Success** | Starts in `submitted`, transitions to `completed` after 5 seconds with `resolved_nin: "44297896804"`, raw `pdf_base64`, and demographics. Dispatches `nin_personalization.completed` webhook. |
| **`0TBH26SQHQCR9F`** | **Failure** | Starts in `submitted`, transitions to `failed` after 5 seconds with `error_detail`. Debited fee is retained (`refunded: false`). Dispatches `nin_personalization.failed` webhook. |
| **`0TDUPCONFLICT01`** | **Duplicate Conflict** | Immediately rejects with HTTP 409 `DUPLICATE_REQUEST`. |

### Duplicate Prevention Lifecycle:
- **Active In-Progress Rejection (HTTP 409)**: If an active request is currently in progress (`status: "PROCESSING"`) for the same Tracking ID, the API immediately rejects duplicate submissions with **HTTP 409 (`DUPLICATE_REQUEST`)** to protect developer balances from duplicate debits.
- **Resubmission After Terminal State**: If a previous personalization request ended in a terminal state (**`FAILED`** or **`COMPLETED`**), applicants can submit a new personalization request with that same Tracking ID. Each submission generates a fresh, distinct `reference`.
- **Idempotency**: Submitting an identical `client_reference` returns the existing ticket idempotently (**HTTP 200**) without charging your balance again.

### 5.1 Request Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `tracking_id` | `string` | **Yes** | Alphanumeric string representing the official NIMC Tracking ID (e.g., `"0TEB51VS5RES4ZZ"`). |
| `client_reference` | `string` | No | Developer custom correlation ID for idempotency and external tracking (max 128 chars). |

#### Example Request Body
```json
{
  "tracking_id": "0TEB51VS5RES4ZZ",
  "client_reference": "kyc_pzn_1001"
}
```

---

### 5.2 Success Response (HTTP 201 Created)

```json
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
```

---

### 5.3 Idempotent Retrieval Response (HTTP 200 OK)
Returned when a request with the same `client_reference` has already been submitted:

```json
{
  "status": "success",
  "message": "Existing NIN Personalization request retrieved via client_reference.",
  "reference": "lora_pzn_1725934820123_abc45",
  "tracking_id": "0TEB51VS5RES4ZZ",
  "client_reference": "kyc_pzn_1001",
  "request_status": "processing",
  "amount_charged": 1500.0,
  "currency": "NGN",
  "environment": "live"
}
```

---

### 5.4 Duplicate Request Conflict (HTTP 409 Conflict)
Returned if an active personalization request for this Tracking ID is already in processing:

```json
{
  "status": "error",
  "code": "DUPLICATE_REQUEST",
  "message": "An active personalization request is already in progress for Tracking ID 0TEB51VS5RES4ZZ. Duplicate submission rejected to prevent double debits.",
  "reference": "lora_pzn_1725934820123_abc45",
  "tracking_id": "0TEB51VS5RES4ZZ",
  "client_reference": "kyc_pzn_1001",
  "transaction": {
    "amount_charged": 0.0,
    "currency": "NGN"
  }
}
```

---

### 5.5 Insufficient Funds (HTTP 402 Payment Required)

```json
{
  "status": "error",
  "code": "INSUFFICIENT_FUNDS",
  "message": "Insufficient wallet balance. Please fund your developer wallet.",
  "transaction": {
    "amount_charged": 0.0,
    "currency": "NGN"
  }
}
```

---

## 6. GET /api/v1/nin/personalization/status — Check Personalization Status

Polls real-time personalization status. You must provide either `?reference=...` or `?client_reference=...`.

### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `reference` | `string` | Optional* | The Lorabiz platform reference token returned upon submission (e.g. `lora_pzn_...`). |
| `client_reference` | `string` | Optional* | The developer's custom idempotency tracking string. |

*\*Provide either `reference` or `client_reference` to look up status. Polling by `tracking_id` is strictly prohibited.*

#### Example Request
```http
GET /api/v1/nin/personalization/status?reference=lora_pzn_1725934820123_abc45 HTTP/1.1
Host: api.lorabiz.com
Authorization: Bearer lora_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 6.1 Status: Completed (HTTP 200 OK)
Returned when personalization completes successfully. Delivers the citizen's resolved 11-digit NIN, verified demographics, and the raw base64 PDF slip directly under `pdf_base64`:

```json
{
  "status": "success",
  "reference": "lora_pzn_1725934820123_abc45",
  "tracking_id": "0TEB51VS5RES4ZZ",
  "client_reference": "kyc_pzn_1001",
  "request_status": "completed",
  "message": "NIN Personalization completed successfully.",
  "resolved_nin": "44297896804",
  "pdf_base64": "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDM2OTAvRmlsdGVyL0ZsYXRlRGVjb2RlPj5zdHJlYW0KeJzsvQlgHMdVJ...",
  "data": {
    "nin": "44297896804",
    "firstname": "IBRAHIM",
    "surname": "MUSA",
    "middlename": "BELLO",
    "birthdate": "1995-04-12",
    "gender": "Male",
    "telephoneno": "08012345678",
    "residence_state": "Kano",
    "photo": "/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBD..."
  },
  "completed_at": "2026-09-10T14:50:00.000Z",
  "amount_charged": 1500.0,
  "currency": "NGN",
  "environment": "live",
  "date": "2026-09-10T14:45:00.000Z"
}
```

---

### 6.2 Status: Failed (HTTP 200 OK)
Returned if the upstream identity authority rejects the Tracking ID or cannot resolve it. Under the non-refundable service policy, the debited fee remains charged:

```json
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
```

---

### 6.3 Status: Processing (HTTP 200 OK)
Returned while the request is being processed by the upstream identity gateway:

```json
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
```

---

## 7. Webhook Event Notifications

Configure your webhook listener under Developer Settings to receive asynchronous notifications:

### 7.1 Event: `nin_personalization.completed`

```json
{
  "event": "nin_personalization.completed",
  "timestamp": "2026-09-10T14:50:00.000Z",
  "environment": "live",
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
      "photo": "/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBD..."
    },
    "request_status": "completed",
    "message": "NIN Personalization completed successfully.",
    "completed_at": "2026-09-10T14:50:00.000Z",
    "amount_charged": 1500.0,
    "currency": "NGN"
  }
}
```

---

### 7.2 Event: `nin_personalization.failed`

```json
{
  "event": "nin_personalization.failed",
  "timestamp": "2026-09-10T14:50:00.000Z",
  "environment": "live",
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
```

---

## 8. Error Reference Matrix

| HTTP Status | Code | Meaning & Solution |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Provided `tracking_id` is missing or invalid. Must be a valid alphanumeric NIMC Tracking ID. |
| `400 Bad Request` | `INVALID_QUERY` | Query parameter `reference` or `client_reference` is missing on status endpoint. Querying by `tracking_id` is rejected. |
| `401 Unauthorized` | `UNAUTHORIZED` | API key is missing, revoked, or invalid. |
| `402 Payment Required` | `INSUFFICIENT_FUNDS` | Wallet balance is below required service fee. |
| `404 Not Found` | `RECORD_NOT_FOUND` | No ticket exists with the provided reference under this account. |
| `409 Conflict` | `DUPLICATE_REQUEST` | An active personalization request is already in progress for this Tracking ID. |
| `429 Too Many Requests` | `RATE_LIMITED` | Exceeded per-minute request rate limit. |
| `500 Server Error` | `INTERNAL_ERROR` | Unexpected server error. In live mode, requests queue safely for manual fulfillment. |
