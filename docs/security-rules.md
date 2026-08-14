# LoraBiz Security Rules & Invariants

This document defines the core security requirements, architectural boundaries, and coding standards for LoraBiz. All code contributions must adhere strictly to these principles.

---

## 1. Authentication & Session Security

1. **Server-Side Session Verification**:
   - Always verify the user's session and identity server-side using `getServerSession(authOptions)`.
   - Never trust client-provided claims, user IDs in query parameters, or hidden form inputs as proof of identity.

2. **Strict Multi-Factor Authentication (MFA / 2FA)**:
   - For administrative and staff portals (`/quadrox-lorabiz-team/mds/` and `/quadrox-lorabiz-team/staff/`), 2FA verification status must be enforced server-side before granting access to sensitive data or actions.

3. **Brute-Force & Rate Limiting**:
   - Authentication endpoints must enforce rate limiting and temporary lockouts per email and per IP using Redis (`attempts:email:${email}`, `lockout:email:${email}`).
   - Generic error messages must be used during authentication failures to prevent user enumeration and timing attacks.

---

## 2. Authorization & Broken Object-Level Authorization (BOLA / IDOR)

1. **User Scoping**:
   - All user-facing data queries (wallet balances, transactions, CAC registrations, activity logs, profile details) must scope queries explicitly to `userId: session.user.id`.
   - Never allow client-provided parameters (e.g. `?userId=...` or body payload `userId`) to override the authenticated user ID.

2. **Role-Based Access Control (RBAC)**:
   - Admin routes (`/api/mds/*` and admin pages) must strictly enforce `session.user.role === "ADMIN"` on the server.
   - Staff routes must check `session.user.role === "STAFF" || session.user.role === "ADMIN"`.
   - Client-side navigation or UI visibility alone is never a security boundary.

---

## 3. Financial, Wallet & Payment Integrity

1. **Server-Side Price Calculation**:
   - Prices for services (CAC, SCUML, Tax ID, Airtime) must always be fetched and calculated from the database (`ServicePricing`) on the server.
   - Never accept client-submitted prices or amounts for service purchases.

2. **Atomic Database Transactions**:
   - All balance updates, credit/debit operations, and ledger insertions must execute inside `prisma.$transaction`.
   - Always use atomic operations (`balance: { increment: amount }`, `balance: { decrement: amount }`) to eliminate race conditions.

3. **Cryptographic Webhook Verification**:
   - Payment webhooks (e.g. KoraPay) must validate the HMAC-SHA256 signature using `process.env.KORAPAY_SECRET_KEY` before processing any payload.
   - Idempotency must be checked against existing transaction references (`existingTx.status === "SUCCESS"`) to prevent double-crediting.

4. **Reference Format & SSRF Defense**:
   - Transaction references must match strict regex patterns (`/^[a-zA-Z0-9_-]+$/`) and be validated before outbound server-to-server gateway verification calls.

---

## 4. Input Sanitization & XSS Prevention

1. **HTML Email Templates & Previews**:
   - Any HTML email content or user-provided markup rendered via `dangerouslySetInnerHTML` must pass through `sanitizeEmailHtml` (`src/lib/sanitize-email.ts` using `isomorphic-dompurify`).
   - Allowlist: legitimate styling, layout tables, headings, paragraphs, images, links, and merge tags.
   - Blocklist: `<script>`, `<iframe>`, `<form>`, `<input>`, event handlers (`onerror`, `onclick`, `onload`), and `javascript:` URIs.

2. **Multi-Layer Sanitization**:
   - Sanitize on client preview, on API write boundary (save/edit draft), and immediately prior to dispatch via the email transport.

---

## 5. Audit Logging & Sensitive Data Protection

1. **User Activity Logging**:
   - Meaningful user lifecycle events must be recorded in `UserActivityLog` (e.g., registration, draft started, wallet funded, service purchased).
   - **Zero Sensitive Data**: Passwords, OTP verification codes, TOTP Base32 secrets, KoraPay secret keys, card numbers, or full authorization headers must NEVER be logged or stored in `metadata`.

2. **Staff & Security Audit Trails**:
   - Administrative actions and sensitive security events must be recorded in `StaffActionLog` and `SecurityAuditLog`.

---

## 6. Background Queue & Email Automation

1. **Queue Isolation**:
   - Critical transactional notifications (2FA OTPs, login verification) run on `notificationQueue`.
   - Bulk broadcast campaigns run on `campaignQueue`.
   - Concurrency and rate throttling must be configured to prevent provider rate-limit rejections.

2. **Automated Email Dedup Guarantee**:
   - Automated emails (Welcome, First Wallet Funding, Abandoned CAC Reminder) must record dispatch in `AutomatedEmailLog` with unique constraints (`@@unique([userId, emailType, entityId])`) to prevent duplicate dispatches during retries or concurrent webhook events.
