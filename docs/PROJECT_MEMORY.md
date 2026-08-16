# LoraBiz Project Memory & Architecture Guide

This document serves as the persistent project memory for LoraBiz. It records the system architecture, security invariants, design patterns, database schemas, and implementation roadmap. All future service integrations must align with the standards documented here.

---

## 1. System Overview & Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16.3.0 (App Router), React 19.2.4, TypeScript 5 |
| **Styling** | Tailwind CSS v4, PostCSS, Radix UI Primitives, Phosphor Icons (`@phosphor-icons/react`), Lucide React |
| **Database & ORM** | PostgreSQL with Prisma ORM 5.14.0 |
| **Authentication** | NextAuth.js v4 (JWT Session Strategy, Email OTP, TOTP Authenticator for Staff/Admin, Cloudflare Turnstile) |
| **Cache & Rate Limiting** | Redis via `ioredis` (Auth lockouts, attempt counters) |
| **Background Queues** | BullMQ (`notificationQueue`, `campaignQueue`) |
| **Cloud Storage** | Cloudinary v2 (`lumebiz_documents`, `lumebiz_nin_slips`) |
| **Monitoring & Security** | Sentry Next.js SDK, CodeQL analysis guidelines |

---

## 2. Core Security Invariants (Non-Negotiable)

1. **Security First**: Security must never be sacrificed for convenience, speed, or UX.
2. **Server-Side Authorization & Session Scoping**:
   - Every API route and Server Action must authenticate the user via `getServerSession(authOptions)` or `getToken({ req, secret })`.
   - Queries must explicitly filter by `userId: session.user.id`. Never trust client-provided `userId` parameters.
3. **No Hardcoded Pricing**:
   - Service fees, slip costs, and charges must **always** be fetched dynamically from the `ServicePricing` database table on the server.
   - Client-submitted prices are strictly prohibited.
4. **Atomic Financial Transactions**:
   - All balance updates, wallet debits/credits, and ledger records must run inside `prisma.$transaction`.
   - Never update balances without creating a corresponding `Transaction` record.
5. **Sensitive Data Protection & Masking**:
   - Passwords, TOTP secrets, OTP codes, card details, or sensitive third-party tokens must **never** be logged in `UserActivityLog` or exposed in client responses.
   - National Identification Numbers (NIN) must always be masked when displayed or saved for logging (e.g., `123*****789`).
6. **Input Sanitization & Injection Defense**:
   - All user inputs must be strictly validated (type, length, regex pattern).
   - Dynamic HTML rendering must pass through `sanitizeEmailHtml` via `isomorphic-dompurify`.
7. **Cloudinary Upload Safety**:
   - MIME types must be strictly checked (`image/jpeg`, `image/png`, `application/pdf`).
   - File size must be capped (maximum 5MB per document).

---

## 3. Database Architecture & Key Models

### Core Identity & Access
- `User`: Handles identity, roles (`USER`, `STAFF`, `ADMIN`), 2FA configuration (`twoFactorEnabled`, `twoFactorMethod`, `twoFactorSecret`), suspension state, and referral tracking.
- `TwoFactorCode` & `OtpCode`: Time-limited verification codes with cooldown and brute-force lockouts.
- `SecurityAuditLog`: Records authentication attempts, CAPTCHA errors, brute-force lockouts, and cross-portal access blocks.

### Financials & Service Pricing
- `Wallet`: User balance tracking.
- `Transaction`: Immutable double-entry ledger tracking `amount`, `balanceBefore`, `balanceAfter`, `type` (`CREDIT`, `DEBIT`, `REFUND`), `status`, and unique `reference`.
- `ServicePricing`: Dynamic service catalog (`serviceKey`, `title`, `price`, `isActive`, `maintenanceMsg`). Contains keys such as:
  - `BUSINESS_NAME`, `LLC`, `LLC_EXTRA_MILLION`, `NGO`, `NAME_SUBSTITUTION`
  - `SCUML`
  - `TAX_ID_INDIVIDUAL`, `TAX_ID_CORPORATE`
  - `NIN_REGULAR`, `NIN_STANDARD`, `NIN_PREMIUM`

### Referral Ledger System
- `Referral`: Tracks the 12-month referral relationship.
- `ReferralCommission`: Immutable commission payout record with unique `serviceId` constraint to prevent double-payouts.
- `ReferralWithdrawal`: Bank transfer requests for affiliate earnings.

### Service Applications & Requests
- `BusinessRegistration` & `Proprietor`: CAC Business Name registration details and document URLs.
- `LlcRegistration` & `CompanyOfficer`: LLC incorporation data, share capital, and CAMA articles.
- `ScumlRegistration`: SCUML compliance application and certificates.
- `TaxIdRequest`: Individual & Corporate Tax ID generation.
- `NinRequestLog`: NIN query audit log (`ninMasked`, `slipType`, `amountCharged`, `status`, `reference`, `pdfUrl`).

---

## 4. Application Routing & Portals

### 1. Client User Portal (`/dashboard`)
Protected by NextAuth middleware (requires `role === "USER"`):
- `/dashboard`: Main Service Hub & Quick Actions Dock.
- `/dashboard/cac`: CAC Hub (New incorporation, registered businesses, LLCs).
- `/dashboard/scuml`: SCUML certificate application.
- `/dashboard/tax-id`: Individual and Corporate TIN processing.
- `/dashboard/airtime`: Airtime & data top-up gateway.
- `/dashboard/wallet`: Wallet funding (KoraPay gateway), balance overview.
- `/dashboard/transactions`: Complete transaction ledger.
- `/dashboard/referrals`: Partner Hub, commission stats, bank withdrawal requests.
- `/dashboard/activity`: Detailed user activity timeline.
- `/dashboard/pricing`: Transparent live pricing rates table.
- `/dashboard/settings`: Profile details, password reset, 2FA setup.

### 2. Administrator Portal (`/quadrox-lorabiz-team/mds`)
Protected by middleware & server session checks (requires `role === "ADMIN"` and `mfaVerified === true`):
- `/quadrox-lorabiz-team/mds/dashboard`: Orders, Client CRM, Financials, Campaign Manager, Settings & Service Kill Switches.

### 3. Staff Portal (`/quadrox-lorabiz-team/staff`)
Protected by middleware & server session checks (requires `role === "STAFF"` and `mfaVerified === true`):
- Application review, document verification, query resolution, and approval processing.

### 4. Public Marketing & Informational Pages
- `/`: Landing page.
- `/services/*`: Public service landing pages (`/services/cac`, `/services/nin`, `/services/scuml`, `/services/tax-id`, `/services/utilities`).
- `/pricing`, `/faq`, `/contact`, `/privacy`, `/terms`, `/acceptable-use`.

---

## 5. UI/UX Design System & Accessibility Standards

1. **Design Theme & Color Tokens**:
   - Light & Dark mode support via `next-themes` and CSS variables (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `bg-secondary`).
   - Primary Accent: `#ff3f7a` / `#c7365f` with smooth gradients and subtle glassmorphic effects.
2. **Component Conventions**:
   - Use existing UI components (`src/components/ui/`) and Phosphor Icons (`@phosphor-icons/react`).
   - Maintain uniform modal animations (`animate-in fade-in zoom-in-95`).
   - Maintain uniform feedback toasts and alert cards with loading, error, warning, and success states.
3. **Accessibility**:
   - Proper semantic HTML (`<main>`, `<nav>`, `<header>`, `<section>`, `<form>`).
   - Meaningful `aria-label` attributes on icon buttons.
   - Visible keyboard focus states (`focus-visible:ring-2 focus-visible:ring-primary`).
   - Full responsive design supporting 320px mobile to ultra-wide displays.

---

## 6. Service Integration Pattern (Standard Operating Procedure)

When a new service (e.g., IPE Clearance, NIN Personalization, NIN Validation) is introduced:

### Standard Integration Steps:
1. **Pricing**:
   - Add pricing key to `ServicePricing` in `prisma/seed.ts` (with fallback in `src/app/api/pricing/route.ts`).
   - Include the service in `src/app/dashboard/pricing/page.tsx` and admin settings.
2. **Backend API**:
   - Authenticate server-side session.
   - Validate input parameters strictly.
   - Check wallet balance atomically against `ServicePricing`.
   - Perform external API integration.
   - Execute debit, transaction logging, activity logging, and referral commission inside `prisma.$transaction`.
3. **Frontend UI**:
   - Build modular components inside `src/components/features/...`.
   - Provide clear input validation, attestation checkboxes (where legally required), confirmation modal with price display, loading spinner, and success/error modal.
   - Support download/history view.
4. **Audit & Activity**:
   - Record sanitized user action in `logUserActivity`.

---

## 7. NIN Services Architecture & Implementation Roadmap

### Architecture & Service Hub:
- **Central NIN Hub (`/dashboard/nin`)**:
  - The discovery and dispatch center for all National Identity Management Commission (NIMC) services.
  - Houses active services and waitlist/pipeline services (IPE Clearance, Personalization, Validation).
- **NIN Verification & Slip Printing (`/dashboard/nin/slips`)**:
  - Frontend: `src/app/dashboard/nin/slips/page.tsx`
  - Components: `src/components/features/nin/slips/` (`NinResultModal.tsx`, `NinHistorySection.tsx`)
  - Backend API: `src/app/api/nin/slips/route.ts` (Generates slips via DataVerify API, uploads to Cloudinary, executes atomic wallet transactions and referral ledger payouts)
  - History API: `src/app/api/nin/slips/history/route.ts` (Fetches user-scoped 24-hour slip print logs)
  - Legacy Redirections: `/dashboard/tools/nin-slip` redirects to `/dashboard/nin/slips`; `/api/tools/nin-slip` delegates to `/api/nin/slips`.

### Service Expansion Roadmap:
1. ✅ **NIN Verification & Slips**: Fully operational under `/dashboard/nin/slips` with dynamic pricing (`NIN_REGULAR`, `NIN_STANDARD`, `NIN_PREMIUM`). Instant official PDF download.
2. ⏳ **IPE Clearance**: Initial Processing Exception resolution on enrollment records, clearing tracking ID exceptions, resolving duplicate/held enrollment profiles, or retrieving/linking existing NIN profiles (TAT: 24–48 Hours). Next in queue.
3. ⏳ **NIN Validation**: Synchronizing recent profile modifications (e.g. name change, DOB correction) across NIMC and external verification portals (banks, immigration, CAC) (TAT: 1–24 Hours).
4. ⏳ **NIN Personalization**: Activating newly enrolled profiles using an enrollment Tracking ID to generate and release the official NIN record (TAT: 24–48 Hours).

---

*Last Updated: 2026-08-16 | Maintained continuously as project memory.*
