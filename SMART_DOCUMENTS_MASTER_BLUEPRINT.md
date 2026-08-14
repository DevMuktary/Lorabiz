# Lorabiz Smart Legal Documents: Master Blueprint & System Architecture

> **Document Version:** 2.0.0  
> **Last Updated:** August 2026  
> **Scope:** Smart Legal Documents Hub, Corporate Governance Vault, Board Resolution Generator, AI Engine, Unsubmitted Drafts, and Payment Verification Architecture.

---

## 1. Executive Overview & Product Vision

### 1.1 What is the Smart Legal Documents Hub?
The **Smart Legal Documents Hub** (`/dashboard/documents`) is Lorabiz's automated legal document generation and management suite. It enables Nigerian entrepreneurs, SMEs, startups, fintechs, and corporate secretaries to instantly draft, customize, digitally execute, pay for, and download **legally watertight, CAMA 2020-compliant legal documents** in minutes.

### 1.2 Core Value Proposition
- **Zero Legal Jargon Friction:** Users fill out an intuitive, step-by-step corporate form; the system automatically formats statutory clauses, recitals, and mandate authorities.
- **Corporate Readiness:** Direct compliance with **Central Bank of Nigeria (CBN)** corporate banking KYC mandates, **Corporate Affairs Commission (CAC)** guidelines, and Nigerian fintech onboarding standards (Paystack, Flutterwave, Monnify, Squad, etc.).
- **Multi-Tier AI + Zero-Failure Guarantee:** Generates tailored, dynamic legal clauses using state-of-the-art AI (`claude-opus-4-8` via AgentRouter / OpenAI) with an immediate, deterministic **CAMA 2020 legal fallback engine** that ensures 100% uptime and zero broken generations.
- **Corporate Branding:** Custom letterhead logos, official company seals/stamps, director digital signatures (canvas drawing or upload), and brand accent color palettes.
- **Decoupled Document Vaults:** Each legal document category has its own dedicated history vault (`/history`), unsubmitted draft auto-saving, resume-by-URL capability, and instant PDF/PNG export.

---

## 2. Legal Documents Suite Roadmap

| Document Name | Route | Target Purpose | Status |
| :--- | :--- | :--- | :--- |
| **Board Resolution Extract** | `/dashboard/documents/board-resolution` | Corporate bank account opening, Payment gateway KYC, loan facilities, and general corporate authority. | **ACTIVE (PROD)** |
| **Shareholder EGM Minutes & Resolution** | `/dashboard/documents/shareholder-resolution` | Statutory changes, capital increases, share transfers, director appointments (CAC Form 7A). | *Phase 2* |
| **Power of Attorney (Corporate & Personal)** | `/dashboard/documents/power-of-attorney` | Appointing legal attorneys to act on behalf of company or individual in property, banking, or CAC matters. | *Phase 2* |
| **Non-Disclosure Agreement (NDA)** | `/dashboard/documents/nda` | Mutual and unilateral confidentiality agreements for commercial partnerships and hiring. | *Phase 2* |
| **Founders / Shareholders Agreement** | `/dashboard/documents/founders-agreement` | Equity splits, vesting schedules, IP assignments, dispute resolution for Nigerian startups. | *Phase 3* |
| **Commercial & Residential Tenancy** | `/dashboard/documents/tenancy-agreement` | Tenancy contracts with rent schedules, covenants, and quit notice rules under Nigerian state tenancy laws. | *Phase 3* |
| **Employment Contract & Offer Letter** | `/dashboard/documents/employment-contract` | Full-time/part-time employment contracts compliant with the Nigerian Labour Act. | *Phase 3* |

---

## 3. Board Resolution Architecture & CAMA 2020 Compliance

The **Board Resolution Generator** is the flagship legal service. It generates an **Extract of the Minutes of the Meeting of the Board of Directors**.

```
   ┌─────────────────────────────────────────────────────────┐
   │                    USER INPUT WIZARD                     │
   │  Step 1: Company, Bank/Gateway, Logo, Seal, Color       │
   │  Step 2: Directors, Designations, Mandates, Signatures   │
   │  Step 3: Live Preview & CAMA 2020 Structured Extraction │
   └────────────────────────────┬────────────────────────────┘
                                │
                                ▼
   ┌─────────────────────────────────────────────────────────┐
   │                UNSUBMITTED DRAFT ENGINE                  │
   │  • Auto-save on Step Change (POST /api/.../draft)       │
   │  • Resume by URL (?draftId=...)                         │
   │  • Dedicated History Vault (/board-resolution/history)  │
   └────────────────────────────┬────────────────────────────┘
                                │
                                ▼
   ┌─────────────────────────────────────────────────────────┐
   │                MULTI-TIER AI RESOLVER                   │
   │  1. AgentRouter (Claude Opus 4.8 / 4.6)                 │
   │  2. OpenAI (GPT-4o / GPT-4o-mini)                        │
   │  3. CAMA 2020 Deterministic Template Engine (Fallback)   │
   └────────────────────────────┬────────────────────────────┘
                                │
                                ▼
   ┌─────────────────────────────────────────────────────────┐
   │             PAYMENT & DOCUMENT CERTIFICATION             │
   │  • Dedicated Modal: Wallet (1-Click) / Korapay (Card/Tx)│
   │  • Atomic Debit (₦3,500 or Promo Discount)              │
   │  • Watermark Removal + Base64 PDF / PNG Generation      │
   │  • Email Dispatch with PDF Attachment                   │
   └─────────────────────────────────────────────────────────┘
```

### 3.1 Statutory Legal Compliance
- **Governing Law:** Nigerian Companies and Allied Matters Act (**CAMA 2020**), Sections 288–315 (Directors' Powers, Resolutions, and Meetings).
- **Banking Mandate Compliance:** Central Bank of Nigeria (CBN) Anti-Money Laundering & KYC Regulations.
- **Fintech Onboarding KYC:** Format verified for Paystack, Flutterwave, Monnify, Squad (GTCO), Interswitch, Remita, Payaza, Korapay, and Kuda.
- **Privacy & Data Protection:** Masking of BVN/NIN according to the Nigeria Data Protection Act (NDPA 2023).

### 3.2 The 3-Step Wizard Workflow

#### Step 1: Company & Institution Details
1. **Registered Company Name:** e.g., `ABC GLOBAL VENTURES LIMITED`.
2. **RC / BN Number:** e.g., `RC 1928374` or `BN 482910` (Optional).
3. **Registered Office Address:** Official physical address for corporate letterhead.
4. **Meeting Date & Venue:** Date of the board meeting and location (defaults to registered address).
5. **Purpose Category:**
   - `BANK_ACCOUNT`: Corporate account opening with commercial / microfinance banks.
   - `PAYMENT_GATEWAY`: Merchant onboarding with payment aggregators.
   - `OTHER`: Specific corporate directives, borrowing powers, or regulatory compliance.
6. **Target Institution:**
   - Integrated search dropdown of **25+ Nigerian commercial banks** (Access, GTB, Zenith, UBA, First Bank, Moniepoint, OPay, Kuda, Providus, Wema, etc.).
   - Fast-select buttons for **10+ Nigerian payment gateways** (Paystack, Flutterwave, Monnify, Squad, Remita, Korapay, etc.).
7. **Account Currency:** `NGN (Nigerian Naira / ₦)`, `USD`, `GBP`, `EUR`, `GHS (Ghanaian Cedi / GH₵)`, or `Multi-Currency`.
8. **Company Branding & Logo Upload:**
   - **XHR Progress Percentage (`0%` to `100%`):** Real-time progress bar and percentage text during upload.
   - Max 5MB, PNG/JPG/SVG. Renders at the top letterhead.
9. **Company Stamp / Official Seal:**
   - Upload official seal image with percentage indicator. Renders alongside director signature certifications.
10. **Letterhead Brand Accent Color:**
    - Circular Canva-style preset palette (Navy, Indigo, Emerald, Burgundy, Slate, Gold, Purple, Crimson, Teal).
    - Custom color picker with **persistent active HEX swatch** (`#2563EB`) and live display preview.

#### Step 2: Board of Directors & Signing Mandates
1. **Signing Mandate Rules:**
   - `ANY_ONE`: Sole signatory mandate (Managing Director or any designated Director alone).
   - `ANY_TWO`: Category A + Category B dual authorization (Standard Nigerian corporate banking requirement).
   - `CHAIRMAN_AND_SECRETARY`: Secretarial dual mandate.
   - `ALL_DIRECTORS`: Unanimous board authorization.
   - `CUSTOM`: Bespoke operational financial limits (e.g. *Up to ₦5,000,000 sole; above ₦5,000,000 joint*).
2. **Dynamic Directors & Officers List:**
   - Add/remove unlimited directors.
   - Full legal name and statutory designation (`Managing Director / CEO`, `Director`, `Company Secretary`, `Chairman`, `Executive Director`, `Other`).
   - Authorized Signatory toggle (`isSignatory: boolean`).
   - **Dual Digital Signature Input:**
     - **Draw Signature:** Full HTML5 Canvas signature pad with smoothing, clearing, and instant PNG data URL capture.
     - **Upload Signature File:** File input with live percentage upload progress bar.

#### Step 3: Real-Time Preview & Certification Checkout
1. **Dynamic CAMA 2020 Canvas Preview:** Renders recitals, operative clauses, mandate rules, certification paragraph, and signature blocks.
2. **Watermarked Draft Mode:** Watermarked with `UNVERIFIED DRAFT - PREVIEW ONLY` prior to payment.
3. **Payment Checkout Card:** Displays standard fee (`₦3,500`), promo code input, and triggers `DocumentPaymentModal`.

---

## 4. Multi-Tier AI Provider Pipeline

### 4.1 Key Architecture & Fallback Hierarchy
To prevent single-point-of-failure issues and separate document AI costs from background categorization AI, the system uses a strict 3-tier resolution pipeline in `src/lib/board-resolution-generator.ts` and `src/lib/ai-client.ts`:

```
   ┌─────────────────────────────────────────────────────────────┐
   │                  AI PROVIDER HIERARCHY                      │
   │                                                             │
   │  [TIER 1] AgentRouter Claude Opus 4.8                       │
   │  • Key: DOC_OPEN_AI_KEY or ANTHROPIC_AUTH_TOKEN             │
   │  • BaseURL: https://agentrouter.org                         │
   │  • Model: claude-opus-4-8 / claude-opus-4-6                 │
   │  • Protocol: Anthropic Messages API / HTTP                  │
   │                           │ (If 401 / Exhausted / Network) │
   │                           ▼                                 │
   │  [TIER 2] Direct OpenAI API                                 │
   │  • Key: OPENAI_API_KEY                                      │
   │  • BaseURL: https://api.openai.com/v1                       │
   │  • Model: gpt-4o-mini / gpt-4o                              │
   │                           │ (If 401 / Exhausted / Network) │
   │                           ▼                                 │
   │  [TIER 3] CAMA 2020 Deterministic Template Engine           │
   │  • 100% In-Memory Local Generation                         │
   │  • Statutory Operative Clauses, Mandates, Recitals          │
   │  • Guaranteed 0ms Zero-Failure Execution                    │
   └─────────────────────────────────────────────────────────────┘
```

### 4.2 System Prompt & Output Schema
The AI engine is prompted as a Senior Nigerian Corporate Lawyer and Company Secretary and returns strictly structured JSON:

```json
{
  "title": "EXTRACT OF THE MINUTES OF THE MEETING OF THE BOARD OF DIRECTORS OF...",
  "letterhead": {
    "companyName": "ACME HOLDINGS LIMITED",
    "rcNumber": "RC 1234567",
    "registeredAddress": "12 Commercial Avenue, Victoria Island, Lagos"
  },
  "meetingMetadata": {
    "date": "2026-08-15",
    "venue": "Registered Office",
    "commencementText": "At a meeting of the Board of Directors duly convened and held..."
  },
  "recitals": [
    "WHEREAS the Company has resolved to establish corporate banking operations...",
    "WHEREAS the Board has reviewed the operating mandate and authorized signatories..."
  ],
  "operativeClauses": [
    {
      "heading": "1. OPENING OF BANKING & FINANCIAL OPERATIONS",
      "text": "RESOLVED THAT the Company opens a corporate bank account with Access Bank Plc..."
    },
    {
      "heading": "2. APPOINTMENT OF AUTHORIZED SIGNATORIES",
      "text": "FURTHER RESOLVED THAT the designated Directors be and are hereby empowered..."
    }
  ],
  "mandateClause": "The Bank is hereby authorized to honor all cheques, orders, and payment mandates signed by Any Two (2) Directors Jointly...",
  "certificationText": "We hereby certify that the foregoing is a true and correct extract from the minutes...",
  "signatories": [
    { "name": "John Doe", "role": "Managing Director / CEO", "isSignatory": true },
    { "name": "Jane Smith", "role": "Company Secretary", "isSignatory": false }
  ]
}
```

---

## 5. Dedicated History Vault & Unsubmitted Drafts Architecture

### 5.1 Why Dedicated History?
In Lorabiz, services do **not** use a single monolithic history page. Board Resolutions have a dedicated vault at:
`/dashboard/documents/board-resolution/history`

### 5.2 History Features
- **Summary Metrics Bar:**
  - `Completed Documents` (Certified CAMA 2020 extracts).
  - `Unsubmitted Drafts` (Incomplete applications saved).
  - `Total Vault Records`.
- **Search & Filtering:**
  - Status tabs: `All Records`, `Completed`, `Drafts`.
  - Real-time text search by company name, bank, or gateway.
- **Draft Management:**
  - Displays last saved timestamp and active step badge (e.g. *Step 2 of 3*).
  - **Resume Resolution:** Links directly to `/dashboard/documents/board-resolution?draftId=[id]`, restoring all fields and director records.
  - **Discard Draft:** Modal with atomic deletion from PostgreSQL.
- **Completed Resolution Actions:**
  - **Download PDF:** Instant download of high-resolution, un-watermarked document.
  - **View Document:** Full modal document viewer with print/export options.

### 5.3 Draft API Endpoints (`/api/documents/board-resolution/draft`)
- `POST`: Upserts draft in `GeneratedDocument` (status: `DRAFT`, `amountPaid: 0`, `transactionRef: DRAFT_BR_...`).
- `GET ?id=[id]`: Fetches full draft payload for resumption.
- `DELETE ?id=[id]`: Permanently removes draft record.

---

## 6. Payment, Checkout, Verification & Webhook Pipeline

### 6.1 Dedicated Payment Component: `DocumentPaymentModal.tsx`
- **Location:** `src/components/features/documents/DocumentPaymentModal.tsx`
- **Decoupled Architecture:** Operates completely independently of `FundWalletModal`.
- **Pricing & Promo Codes:** Dynamically queries `/api/pricing` (defaults to ₦3,500) and supports promo validation via `/api/payment/promo/validate`.

```
                        ┌──────────────────────────────┐
                        │   DocumentPaymentModal.tsx   │
                        └──────────────┬───────────────┘
                                       │
                  ┌────────────────────┴────────────────────┐
                  │                                         │
                  ▼                                         ▼
        [1-CLICK WALLET DEBIT]                     [ONLINE KORAPAY GATEWAY]
  • POST /api/payment/checkout             • POST /api/payment/checkout
    (paymentMethod: "WALLET")                (paymentMethod: "ONLINE")
  • Atomic debit in prisma.$transaction    • Generates ref ONL_DOC_[draftId]_[time]
  • Updates draft to COMPLETED             • Obtains authorizationUrl
  • Generates high-res PDF & Base64        • Redirects user to Korapay
  • Sends email with attachment                            │
  • Redirects to /history?success=true                     ▼
                                            [RETURN REDIRECT: ?verifying=true]
                                           • GET /api/payment/verify
                                           • Sanitizes URL via history.replaceState
                                           • Credits Wallet -> Debits Wallet
                                           • Updates draft to COMPLETED
                                           • Sends email with attachment
                                           • Redirects to /history?success=true
                                                           │
                                                           ▼ (If user closed tab)
                                            [STATELESS WEBHOOK: /api/payment/webhook]
                                           • HMAC-SHA256 Signature Verification
                                           • Idempotency Check
                                           • Fulfills & updates GeneratedDocument
```

### 6.2 Post-Payment Actions
1. **Document Record Status:** Transitions from `DRAFT` to `COMPLETED`.
2. **Watermark Stripping:** `UNVERIFIED DRAFT` watermark removed from the live view and PDF export.
3. **Automated Email Dispatch:** `sendDocumentGeneratedEmail()` attaches the official PDF and sends it to the user's verified account email.
4. **Audit Logging:** Logs `SMART_DOCUMENT_PURCHASED` to `UserActivityLog`.

---

## 7. Database Schema Reference (Prisma)

### 7.1 `GeneratedDocument` Model
```prisma
model GeneratedDocument {
  id              String               @id @default(cuid())
  userId          String
  user            User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  documentType    DocumentServiceType  @default(BOARD_RESOLUTION)
  title           String
  companyName     String
  status          DocumentStatus       @default(DRAFT)
  accentColor     String?              @default("#0f172a")
  logoUrl         String?
  formData        Json                 // Full form state, directors, step metadata
  structuredData  Json?                // AI / CAMA 2020 structured legal extract
  pdfUrl          String?              // Base64 or cloud storage link
  imageUrl        String?              // PNG preview
  amountPaid      Decimal              @default(0) @db.Decimal(12, 2)
  transactionRef  String               @unique
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt

  @@index([userId])
  @@index([documentType])
  @@index([status])
}

enum DocumentServiceType {
  BOARD_RESOLUTION
  SHAREHOLDER_RESOLUTION
  NDA
  POWER_OF_ATTORNEY
  TENANCY_AGREEMENT
  EMPLOYMENT_CONTRACT
}

enum DocumentStatus {
  DRAFT
  GENERATING
  COMPLETED
  FAILED
}
```

---

## 8. File Structure & Code Inventory

```
c:\Users\USER\Lorabiz\
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── documents/
│   │   │   │   ├── banks/route.ts                     # Nigerian banks list API
│   │   │   │   └── board-resolution/
│   │   │   │       ├── draft/route.ts                 # Draft CRUD (POST, GET, DELETE)
│   │   │   │       ├── generate/route.ts              # Final generation & PDF attachment email
│   │   │   │       ├── history/route.ts               # User resolution vault history API
│   │   │   │       └── preview/route.ts               # Live preview AI / CAMA resolver
│   │   │   └── payment/
│   │   │       ├── checkout/route.ts                  # Wallet & Korapay checkout handler
│   │   │       ├── verify/route.ts                    # Return redirect verification
│   │   │       └── webhook/route.ts                   # Stateless Korapay webhook
│   │   └── dashboard/
│   │       └── documents/
│   │           ├── page.tsx                           # Smart Documents Main Hub
│   │           └── board-resolution/
│   │               ├── page.tsx                       # 3-Step Resolution Generator Wizard
│   │               └── history/
│   │                   └── page.tsx                   # Dedicated History & Drafts Vault
│   ├── components/
│   │   └── features/
│   │       └── documents/
│   │           ├── CanvasSignatureModal.tsx           # Digital signature drawing pad
│   │           ├── DocumentPaymentModal.tsx           # Standalone Wallet & Online modal
│   │           └── ResolutionDocumentView.tsx         # CAMA 2020 legal document canvas
│   └── lib/
│       ├── ai-client.ts                               # Multi-tier AI client (AgentRouter / OpenAI)
│       ├── board-resolution-generator.ts              # Resolution builder & CAMA 2020 fallback
│       └── email-service.ts                           # Automated document delivery emails
└── SMART_DOCUMENTS_MASTER_BLUEPRINT.md                # Master Blueprint & System Architecture
```

---

## 9. Key Rules & Invariants for Future Agents & Developers

1. **Do NOT Create Monolithic History:** Every legal document type (Board Resolution, NDA, Shareholder Resolution) MUST maintain its own dedicated history vault at `/dashboard/documents/[document-type]/history`.
2. **Never Break on AI Failures:** All AI calls must wrap in try-catch blocks and fall back through the multi-tier hierarchy (`AgentRouter Claude` ➔ `OpenAI` ➔ `Deterministic CAMA 2020 Generator`).
3. **Always Verify Prices Server-Side:** Never trust prices submitted by the client. Document generation fees are calculated and debited atomically inside `prisma.$transaction`.
4. **Draft Resumption Integrity:** When resuming a draft with `?draftId=...`, preserve all directors, logo URLs, seals, and the user's active step.
5. **Clear Navigation Separation:** Always keep top header hub breadcrumbs distinct from bottom step wizard navigation buttons.
6. **Live Upload Feedback:** Always use `XMLHttpRequest` with `progress` event tracking (`0%` to `100%`) for all uploaded media (logos, seals, signature scans).
