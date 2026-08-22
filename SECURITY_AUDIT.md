# Comprehensive Production Security & Architecture Audit Report

**Date:** August 22, 2026  
**Target:** Lorabiz Production Application  
**Scope:** Full-Stack Security, Auth/Session Handling, Access Control (BOLA/IDOR), Financial & Ledger Integrity, Upstream Gateways & Webhooks, Data Protection & PII Exposure.

---

## 1. Executive Summary & Vulnerability Matrix

| Vulnerability ID | Category | Severity | File(s) Affected | Impact |
|---|---|---|---|---|
| **VULN-01** | Auth / Session Fixation | **CRITICAL** | `src/app/api/auth/[...nextauth]/route.ts` | Complete 2FA/MFA bypass across User, Staff, and MDS Admin portals via client-triggered session mutations. |
| **VULN-02** | Broken Access Control | **CRITICAL** | `src/app/api/cac/delete/route.ts` | Unauthenticated, unrestricted arbitrary deletion of active Business Name and LLC registrations. |
| **VULN-03** | BOLA / IDOR / PII Leak | **CRITICAL** | `src/app/api/cac/register/business-name/details/[id]/route.ts`<br>`src/app/api/cac/register/llc/details/[id]/route.ts` | Unauthenticated/Unauthorized read access to confidential citizen PII (NINs, signatures, addresses, documents). |
| **VULN-04** | BOLA / Auth Flaw | **HIGH** | `src/app/api/cac/submit-query/route.ts`<br>`src/app/api/cac/substitute-name/route.ts` | Unauthenticated status manipulation & unauthorized tampering with corporate proposed names across foreign registrations. |
| **VULN-05** | Financial / Double-Spend | **HIGH** | `src/app/api/mds/pipeline/airtime/action/route.ts` | Double refund exploitation on failed telecom transactions. |
| **VULN-06** | Privilege Escalation | **HIGH** | `src/app/api/mds/settings/pricing/action/route.ts`<br>`src/app/api/mds/settings/providers/route.ts` | Staff role accounts permitted to alter master service pricing, maintenance toggles, and upstream identity routing. |
| **VULN-07** | Secret Misconfiguration | **MEDIUM** | `src/app/api/internal/verify-user/route.ts` | `undefined === undefined` vulnerability allowing unauthenticated verification if `INTERNAL_API_SECRET` is unset. |
| **VULN-08** | Sensitive Data Exposure | **MEDIUM** | `src/app/api/mds/clients/route.ts` | `passwordHash` (bcrypt) and `twoFactorSecret` (TOTP keys) exposed in admin client list API responses. |
| **VULN-09** | Resource Depletion / DoS | **MEDIUM** | `src/app/api/cac/name-check/route.ts` | Unauthenticated OpenAI token consumption and CAC registry gateway spamming. |

---

## 2. Detailed Technical Findings & Remediations

---

### [CRITICAL] VULN-01: Client-Side NextAuth Session Mutation 2FA Bypass

- **File:** `src/app/api/auth/[...nextauth]/route.ts` (Lines 225, 256–264)
- **Vulnerability Description:**  
  NextAuth exposes an internal endpoint (`/api/auth/session`) to mutate active session tokens. In the JWT callback:
  ```typescript
  if (trigger === "update" && session) {
    if (session.mfaVerified !== undefined) {
      token.mfaVerified = session.mfaVerified;
    }
  }
  ```
  The server blindly trusts client-provided payloads. Any client can issue an unverified POST request to `/api/auth/session` with `{ data: { mfaVerified: true } }`, upgrading their JWT to fully verified status without ever evaluating TOTP or email OTP codes.
- **Remediation:**  
  Remove client-supplied `session.mfaVerified` overrides. Only allow `mfaVerified` to be granted via a cryptographically signed verification challenge token or a verified server-side Redis key generated upon OTP/TOTP validation.

---

### [CRITICAL] VULN-02: Unauthenticated Deletion of CAC Filings

- **File:** `src/app/api/cac/delete/route.ts` (Lines 4–31)
- **Vulnerability Description:**  
  The endpoint lacks `getServerSession(authOptions)` and does not verify user identity or ownership.
  ```typescript
  export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await prisma.businessRegistration.delete({ where: { id } });
    await prisma.llcRegistration.delete({ where: { id } });
  }
  ```
- **Remediation:**  
  Enforce authentication, verify ownership (`registration.userId === session.user.id`), and disallow deletion of applications that have already been paid or submitted (`status !== "UNSUBMITTED"`).

---

### [CRITICAL] VULN-03: Broken Object Level Authorization (BOLA/IDOR) on CAC Details

- **Files:**  
  - `src/app/api/cac/register/business-name/details/[id]/route.ts`
  - `src/app/api/cac/register/llc/details/[id]/route.ts`
- **Vulnerability Description:**  
  Both endpoints authenticate that *a* user is logged in, but fail to check if the registration record actually belongs to that user:
  ```typescript
  const registration = await prisma.businessRegistration.findUnique({
    where: { id },
    include: { proprietors: true } 
  });
  return NextResponse.json({ success: true, data: registration });
  ```
  Any authenticated regular user can query any other client's application ID and retrieve full proprietor details, NIN slip documents, signature images, residential addresses, and corporate structures.
- **Remediation:**  
  Verify ownership or admin role:
  ```typescript
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || (registration.userId !== user.id && user.role !== "ADMIN" && user.role !== "STAFF")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  ```

---

### [HIGH] VULN-04: Missing Auth on CAC Query Submission & IDOR on Name Substitution

- **Files:**  
  - `src/app/api/cac/submit-query/route.ts`
  - `src/app/api/cac/substitute-name/route.ts`
- **Vulnerability Description:**  
  - `submit-query` has no authentication check whatsoever and allows arbitrary state changes to `PENDING` / `RESOLVED`.
  - `substitute-name` debits the authenticated user's wallet but mutates `businessRegistration` or `llcRegistration` purely by `id` without verifying that the registration belongs to the caller.
- **Remediation:**  
  Add `getServerSession` and ownership verification (`registration.userId === user.id`) to both routes.

---

### [HIGH] VULN-05: Double-Refund Exploitation in Admin Airtime Pipeline

- **File:** `src/app/api/mds/pipeline/airtime/action/route.ts` (Lines 27–40)
- **Vulnerability Description:**  
  The telecom vending routes automatically refund users and mark transactions as `"FAILED"` upon upstream timeouts or errors. In the admin action handler:
  ```typescript
  if (originalTx.status === "REVERSED") {
    return NextResponse.json({ error: "This transaction has already been refunded." }, { status: 400 });
  }
  ```
  It does not check `originalTx.status === "SUCCESS"` and `originalTx.type === "DEBIT"`. As a result, an admin or staff member triggering a manual refund on a `"FAILED"` transaction will refund the user a second time.
- **Remediation:**  
  Enforce:
  ```typescript
  if (originalTx.type !== "DEBIT" || originalTx.status !== "SUCCESS") {
    return NextResponse.json({ error: "Only successful debit transactions can be refunded." }, { status: 400 });
  }
  ```

---

### [HIGH] VULN-06: Privilege Escalation in Pricing and Identity Provider Settings

- **Files:**  
  - `src/app/api/mds/settings/pricing/action/route.ts`
  - `src/app/api/mds/settings/providers/route.ts`
- **Vulnerability Description:**  
  The action handlers only verify `staffUser.role !== "USER"`, allowing accounts with the `STAFF` role to modify pricing, activate/deactivate services, and switch provider routing (which should be restricted exclusively to `ADMIN`).
- **Remediation:**  
  Change the access gate to strictly require `staffUser.role === "ADMIN"`.

---

### [MEDIUM] VULN-07: Insecure Comparison on Unset Internal Secret

- **File:** `src/app/api/internal/verify-user/route.ts` (Line 10)
- **Vulnerability Description:**  
  ```typescript
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  ```
  If `INTERNAL_API_SECRET` is undefined in environment variables, passing `{ email: "...", secret: undefined }` causes `undefined !== undefined` to evaluate to `false`, granting unauthorized access.
- **Remediation:**  
  ```typescript
  const expectedSecret = process.env.INTERNAL_API_SECRET;
  if (!expectedSecret || !secret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  ```

---

### [MEDIUM] VULN-08: Credential Leakage in Admin Client Directory Query

- **File:** `src/app/api/mds/clients/route.ts` (Lines 39–53)
- **Vulnerability Description:**  
  `prisma.user.findMany({ where: { role: "USER" }, ... })` returns all model fields, transmitting `passwordHash` (bcrypt hashes) and `twoFactorSecret` (raw TOTP secrets) over the network.
- **Remediation:**  
  Specify an explicit `select` object that omits credentials, tokens, and secrets.

---

### [MEDIUM] VULN-09: Unauthenticated AI & CAC API Token Depletion

- **File:** `src/app/api/cac/name-check/route.ts` (Lines 78–265)
- **Vulnerability Description:**  
  The endpoint is publicly accessible and triggers OpenAI GPT-4o-mini completions and live CAC gateway checks without rate limiting or IP-level throttling.
- **Remediation:**  
  Enforce sliding-window rate limiting via Redis (e.g., 10 requests per minute per IP).

---

## 3. Verified Resilient Controls

1. **Webhook Signature Validation:** Korapay webhooks validate HMAC SHA-256 signatures over raw payload data.
2. **SSRF Protections:** Verification routes validate reference formats against strict alphanumeric regexes before upstream calls.
3. **Database Transaction Atomicity:** Financial debits, credits, and logs consistently use `prisma.$transaction` to guarantee consistency.
4. **Cloudinary Upload Security:** File size (5MB max) and MIME types (`image/jpeg`, `image/png`, `application/pdf`) are verified server-side with authenticated sessions.
5. **SQL Injection Resistance:** Standard Prisma ORM parameterized queries are used throughout, with no raw SQL execution.

---

## 4. Remediation Checklist for Next Session

- [ ] **Step 1:** Patch `src/app/api/auth/[...nextauth]/route.ts` to secure 2FA / MFA session updates.
- [ ] **Step 2:** Secure `src/app/api/cac/delete/route.ts` and `src/app/api/cac/register/**/details/[id]/route.ts` with ownership and authentication guards.
- [ ] **Step 3:** Fix `src/app/api/cac/submit-query/route.ts` and `src/app/api/cac/substitute-name/route.ts` access controls.
- [ ] **Step 4:** Add strict status validation in `src/app/api/mds/pipeline/airtime/action/route.ts` to prevent double refunds.
- [ ] **Step 5:** Restrict `src/app/api/mds/settings/pricing/action` and `providers` routes strictly to `role === "ADMIN"`.
- [ ] **Step 6:** Add explicit field exclusion in `src/app/api/mds/clients/route.ts` to stop leaking password hashes and TOTP secrets.
- [ ] **Step 7:** Patch `src/app/api/internal/verify-user/route.ts` against unset environment variables.
- [ ] **Step 8:** Introduce Redis rate limiting on `src/app/api/cac/name-check/route.ts`.
