# Lorabiz Developer API — Pricing, Billing & Ledger Architecture

This document formalizes the billing engine, atomic wallet deduction rules, and pricing structure for the **Lorabiz Developer API**.

---

## 1. Core Rule: Strict Database Pricing (Zero Fallback Constants)

In accordance with strict financial integrity:
- **No Hardcoded Fallback Prices**: The API **never** falls back to hardcoded pricing constants in code.
- If a service price is missing or set to `isActive: false` in `ServicePricing`, the API terminates immediately with:
  ```json
  {
    "status": "error",
    "code": "SERVICE_UNCONFIGURED",
    "message": "Service pricing is not configured for this slip type. Please contact support.",
    "environment": "live"
  }
  ```
- This prevents billing discrepancies, accidental overcharging, or undercharging if keys mismatch.

---

## 2. Decoupled Pricing Matrix (Dashboard vs Developer API)

All pricing is fetched from the database table `ServicePricing`. API pricing keys are separate from Web Dashboard pricing keys:

| Service | Identifier Type | Slip Format | Dashboard Key | Dashboard Retail Price | API Service Key | API Wholesale Seed Price |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NIN Verification** | NIN (11 digits) | `nin_basic` | `NIN_BASIC` | ₦400.00 | `API_NIN_BASIC` | **₦150.00** |
| **NIN Verification** | NIN (11 digits) | `nin_vnin` | `NIN_VNIN` | ₦500.00 | `API_NIN_VNIN` | **₦150.00** |
| **NIN Verification** | NIN (11 digits) | `nin_regular` | `NIN_REGULAR` | ₦500.00 | `API_NIN_REGULAR` | **₦150.00** |
| **NIN Verification** | NIN (11 digits) | `nin_standard` | `NIN_STANDARD` | ₦700.00 | `API_NIN_STANDARD` | **₦150.00** |
| **NIN Verification** | NIN (11 digits) | `nin_premium` | `NIN_PREMIUM` | ₦1,000.00 | `API_NIN_PREMIUM` | **₦150.00** |
| **NIN Phone Lookup** | Phone (11 digits) | `nin_regular` | `NIN_PHONE_REGULAR` | ₦500.00 | `API_NIN_PHONE_REGULAR` | **₦150.00** |
| **NIN Phone Lookup** | Phone (11 digits) | `nin_standard` | `NIN_PHONE_STANDARD`| ₦700.00 | `API_NIN_PHONE_STANDARD`| **₦150.00** |
| **NIN Phone Lookup** | Phone (11 digits) | `nin_premium` | `NIN_PHONE_PREMIUM` | ₦1,000.00 | `API_NIN_PHONE_PREMIUM` | **₦150.00** |

> **Admin Control**: The default wholesale rate is seeded at **₦150.00 flat** across all slip formats. These rates are stored in PostgreSQL `ServicePricing` and editable dynamically via the Admin Portal (`/quadrox-lorabiz-team/mds`).

---

## 3. Environment Billing Modes

### 3.1 Test Mode (`lora_test_...`)
- **Virtual Balance**: Every developer account receives a virtual ₦1,000,000 test balance (`user.sandboxBalance`).
- **Zero Real Cost**: Deductions in test mode reduce only the `sandboxBalance`. Live wallet balance (`user.wallet.balance`) is untouched.
- **Top-Up Capability**: Developers can reset their virtual test balance directly from the Developer Console.

### 3.2 Live Mode (`lora_live_...`)
- **Real-time Atomic Debit**: Every successful 2xx verification deducts the exact wholesale rate from `user.wallet.balance`.
- **Concurrency & Race Condition Defense**: Deductions execute inside `prisma.$transaction`:
  ```typescript
  await tx.wallet.update({
    where: { id: user.wallet.id },
    data: { balance: { decrement: price } }
  });
  ```
- **Ledger Record**: Generates an immutable `Transaction` row:
  - `type`: `DEBIT`
  - `status`: `SUCCESS`
  - `serviceCategory`: `API_SERVICE`
  - `reference`: Generated unique reference (`NIN_...` or `TEL_...`)
  - `balanceBefore` and `balanceAfter` recorded for audit transparency.

---

## 4. Zero-Risk Billing Policy

1. **Pre-Execution Check**: Before calling the external identity gateway, the system checks whether the developer's balance is sufficient for the selected slip type. If insufficient, returns `402 Payment Required` with `₦0.00` charged.
2. **Provider Failures & Bad Requests**:
   - If the request fails validation (400) -> Charged `₦0.00`.
   - If the identity number is not found by NIMC (422) -> Charged `₦0.00`.
   - If the upstream provider experiences timeout or 503 maintenance -> Charged `₦0.00`.
3. **Atomic Execution**: Financial debits occur strictly after successful identity resolution and PDF generation.
