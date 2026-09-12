# Lorabiz Mobile App — Master Tracker & Living Agreement

This document tracks all agreed architectural decisions, feature specifications, active progress, and pending tasks for the **Lorabiz Mobile Application** on branch `Mobile-app`.

---

## 1. Core Agreements & Clarifications

| Decision Point | Agreed Strategy | Notes |
| :--- | :--- | :--- |
| **Framework** | **React Native with Expo** | Native 60/120fps UI, cross-platform (Android & iOS) from a single codebase. |
| **Project Location** | `/mobile` in Lorabiz repo | Keeps web and mobile unified, sharing types and backend APIs. |
| **Existing Web App** | **100% Untouched & Unbroken** | The web dashboard and pages in `src/app/` remain active with zero regressions. |
| **Distribution Strategy** | **$0 Zero-Cost Direct Distribution First** | • **Android:** Compile standalone `.apk` for direct download, testing, and sharing.<br/>• **iOS:** Sideload standalone `.ipa` via Sideloadly / AltStore on iPhone.<br/>• **Google Play ($25) & App Store ($99):** Once revenue and traction are established. |
| **Payment Gateway** | **KoraPay & Internal Wallet** | **Not Paystack.** Lorabiz uses **KoraPay** (`/api/payment/checkout`) and internal wallet debit transactions. |
| **Feature Flags** | **Deferred for later** | Keep initial development simple and rock-solid. No feature-flag overhead until the app is stable. |
| **Core High-Volume Service** | **Slips Generation (NIN & BVN)** | **Top Priority alongside Wallet & Services:**<br/>• Basic, Regular, Standard, Premium, and VNIN slips.<br/>• Demographic lookups via NIN / Phone.<br/>• Real-time slip preview, PDF download to device, and WhatsApp share.<br/>• Search history and reprint. |
| **Other Core Services** | **Full Suite Included** | Wallet funding & transactions, Utilities (Airtime, Data, Electricity, Cable), CAC Business Name & LLC, SCUML, Tax ID, Referrals & Rewards. |
| **Compliance & Disclaimers** | **In-App Disclaimer + Existing Terms/Privacy** | Prominent disclaimer that Lorabiz is a private corporate facilitation platform, not an agency of the CAC or Federal Government. |
| **Account Deletion / Data Policy** | **Soft-Delete / Deactivation ONLY (ZERO Data Deletion)** | **Never delete any data.** All user data, name, email, transactions, audit logs, and filings are retained 100% in the database. Account closure only deactivates access on the surface (`isSuspended: true`), logs the user out, and blocks re-entry. |


---

## 2. Progress Tracker

### Phase 1: Backend Mobile Authentication (Next.js)
- [x] Create `src/lib/mobile-auth.ts` (JWT session generator/verifier using NextAuth secret)
- [x] Create `src/app/api/auth/mobile/login/route.ts` (Email/password + 2FA OTP verification returning mobile session token)
- [x] Create `src/app/api/auth/mobile/session/route.ts` (Session validation and wallet balance refresh)
- [x] Test mobile auth with existing API routes (verify cookie/Bearer header compatibility & 0 TypeScript errors)

### Phase 2: Mobile Scaffolding (`/mobile`)
- [x] Initialize Expo SDK project with TypeScript in `/mobile`
- [x] Configure `app.json` (Package: `com.lorabiz.app`, brand icons, splash screen, permissions)
- [x] Configure `eas.json` (Preview profile for standalone `.apk` and `.ipa`)
- [x] Configure theme and color palette matching Lorabiz brand (`colors`, `spacing`, `typography`)
- [x] Configure API client with secure storage (`expo-secure-store`) and TanStack Query

### Phase 3: Mobile Authentication & Biometrics
- [x] Branded Welcome / Splash screen (`mobile/app/index.tsx`)
- [x] Login screen (Email + Password with error handling) (`mobile/app/(auth)/login.tsx`)
- [x] 6-digit auto-advancing OTP verification screen
- [x] Biometric prompt (Face ID / Fingerprint enable for instant future logins)
- [x] Registration flow (`mobile/app/(auth)/register.tsx`)

### Phase 4: Core Slips Generation (NIN & BVN)
- [x] NIN Slips screen (Search by NIN or Search by Phone) (`mobile/app/(tabs)/slips.tsx`)
- [x] Slip Type selector (Basic ₦400, Regular ₦500, Standard ₦700, Premium ₦1,000, VNIN ₦500)
- [x] Demographics preview modal (Photo, NIN, Full Name, DOB, Gender, Address)
- [x] Wallet debit confirmation
- [x] PDF generation, direct device download, and WhatsApp share (`expo-file-system` / `expo-sharing`)
- [x] Slips search & reprint history tab

### Phase 5: Wallet & KoraPay Online Funding
- [x] Wallet dashboard card with balance privacy toggle (hide/show balance) (`mobile/app/(tabs)/index.tsx`)
- [x] Quick-fund screen with KoraPay secure checkout (`mobile/app/wallet/fund.tsx`)
- [x] Background balance refresh upon returning from payment (no manual reload)
- [x] Transaction history feed with debit/credit badges

### Phase 6: Utilities & Value-Added Services
- [x] Airtime & Data bundle top-up (MTN, Airtel, Glo, 9mobile) with auto-network detection (`mobile/app/(tabs)/bills.tsx`)
- [x] Electricity token purchase & Cable TV selector
- [x] Direct wallet debit with confirmation

### Phase 7: CAC & Corporate Registrations
- [x] Corporate services catalog (Business Name, LLC, SCUML, Tax ID, Affidavit) (`mobile/app/(tabs)/services.tsx`)
- [x] Application tracking list (Pending, Approved, Queried)
- [x] Regulatory notice banner

### Phase 8: Profile, Settings & App Hardening
- [x] Profile management & referral badge (`mobile/app/(tabs)/profile.tsx`)
- [x] 2FA security status & Biometric toggle
- [x] Legal disclaimer, Terms & Privacy policy links
- [x] In-app account closure/deactivation (Soft-delete only: sets `isSuspended: true`, locks user out, retains 100% data and transaction history in database)
- [ ] Compile standalone `.apk` for Android
- [ ] Compile standalone `.ipa` for Sideloadly on iPhone
