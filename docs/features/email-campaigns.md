# Admin Email Campaign & Broadcast System

## Overview
The **Admin Email Campaign & Broadcast** feature provides the Managing Director and Administrators (`ADMIN` role) in the Quadrox MDS portal (`/quadrox-lorabiz-team/mds/dashboard/campaigns`) with a robust control plane to draft, preview, schedule, and execute high-volume email announcements and marketing campaigns to registered users.

---

## 🏗️ Architecture & Isolation Strategy

```
+-----------------------------------------------------------------------+
|                       Admin MDS Dashboard                             |
|               (/quadrox-lorabiz-team/mds/dashboard/campaigns)         |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                         Next.js API Layer                             |
|               (/api/mds/campaigns, /api/mds/campaigns/[id]/send)      |
+-----------------+-----------------------------------+-----------------+
                  |                                   |
                  v                                   v
+-----------------------------------+   +-------------------------------+
|     PostgreSQL (Prisma ORM)       |   |       BullMQ Queue            |
|  - EmailCampaign                  |   |    ("email-campaigns")        |
|  - EmailCampaignLog (Audit)       |   +---------------+---------------+
|  - User (isSubscribedToMarketing) |                   |
+-----------------------------------+                   v
                                        +-------------------------------+
                                        |       campaignWorker          |
                                        |  (Concurrency: 4, Rate limit) |
                                        +---------------+---------------+
                                                        |
                                                        v
                                        +-------------------------------+
                                        |         ZeptoMail API         |
                                        +-------------------------------+
```

### Critical Queue Separation
- **Transactional Emails** (2FA login OTPs, CAC queries, CAC approval certificates) run on `notificationQueue` (`"notifications"`).
- **Broadcast Campaigns** run exclusively on a dedicated `campaignQueue` (`"email-campaigns"`) with background batching (`campaignWorker`).
- **Benefit**: Bulk blasts to thousands of users will **never** block or delay time-sensitive security and order OTPs.

---

## 📊 Database Models & Ledger

### `EmailCampaign`
Stores master campaign configuration, filter definitions, and aggregate delivery metrics:
- `title`: Internal campaign name.
- `subject`: Public email subject.
- `previewText`: Email preheader text.
- `content`: HTML / styled body template.
- `senderName`: Branded sender label (default `"LoraBiz"`).
- `targetAudience`: JSON filter configuration (e.g. `{ segment: "REGISTERED_ANY" }`).
- `status`: `DRAFT` | `SCHEDULED` | `SENDING` | `COMPLETED` | `FAILED` | `CANCELLED`.
- `totalRecipients`, `sentCount`, `failedCount`: Real-time delivery counters.

### `EmailCampaignLog`
Individual recipient delivery ledger:
- `campaignId`: References `EmailCampaign`.
- `userId`: References `User` (if registered account).
- `email`: Recipient email address.
- `status`: `PENDING` | `SENT` | `FAILED`.
- `errorMessage`: Captured API error payload if bounce or provider rejection occurs.
- `sentAt`: Timestamp when ZeptoMail acknowledged delivery.

---

## 🎯 Target Audience Segmentation

The system supports granular filtering via `buildAudienceWhereClause`:
1. **All Active Users (`ALL`)**: Every registered user with `role: "USER"`, `isSuspended: false`, and `isSubscribedToMarketing: true`.
2. **All Registered Clients (`REGISTERED_ANY`)**: Users with at least 1 CAC Business Name, LLC, SCUML, Tax ID, or NIN filing.
3. **Business Name Filers (`REGISTERED_BIZ`)**: Proprietors who submitted a Business Name registration.
4. **LLC / Company Filers (`REGISTERED_LLC`)**: Users who registered an LLC.
5. **Funded Wallets (`FUNDED_WALLET`)**: Users with a positive wallet balance (`balance > 0`).
6. **Inactive Leads (`NO_ORDERS`)**: Registered users with zero completed or draft filings.
7. **New Signups 7D / 30D (`NEW_SIGNUPS_7D`, `NEW_SIGNUPS_30D`)**: Onboarding cohorts.

---

## 🏷️ Personalization Merge Tags

The template compiler automatically substitutes the following merge tokens:
- `{{firstName}}` / `{{first_name}}` -> User's first name (fallback: `"Valued Client"`).
- `{{lastName}}` / `{{last_name}}` -> User's last name.
- `{{fullName}}` / `{{full_name}}` -> User's full name.
- `{{email}}` -> Recipient's email address.
- `{{referralCode}}` -> User's unique referral code.

---

## 🛡️ Security & Compliance (NDPR / CAN-SPAM)

1. **Role-Based Authorization**:
   - Every campaign endpoint (`/api/mds/campaigns/*`) enforces `session.user.role === "ADMIN"`.
2. **Audit Logging**:
   - Campaign creation, test dispatch, updates, and launches are logged in `StaffActionLog`.
3. **Cryptographic Unsubscribe Links**:
   - Marketing emails include a footer link to `/unsubscribe`.
   - The link contains an HMAC-SHA256 signature (`uid`, `email`, `token`) to prevent unauthorized unsubscriptions.
   - Unsubscribed users (`isSubscribedToMarketing: false`) are automatically excluded from subsequent marketing broadcasts while retaining critical transactional notifications.
4. **HTML Sanitization & Defense-in-Depth XSS Prevention**:
   - Uses a centralized sanitizer (`src/lib/sanitize-email.ts`) powered by `isomorphic-dompurify`.
   - **Allowed Elements**: Preserves all legitimate email markup including layout tables (`table`, `tr`, `td`, `th`), inline styling (`style`), typography (`h1`-`h6`, `p`, `strong`, `em`), images (`img`), links (`a`), and merge tags (`{{firstName}}`).
   - **Strictly Stripped**: Malicious scripts (`<script>`), iframes, form elements, event handlers (`onerror`, `onclick`, `onload`), and dangerous URI schemes (`javascript:`, `data:text/html`).
   - **Multi-Layer Enforcement**: Sanitization runs both on the client (during live preview in the Campaign Composer) and on the server boundary (`POST /api/mds/campaigns`, `PATCH /api/mds/campaigns/[id]`, `POST /api/mds/campaigns/test`, and inside `sendCampaignBroadcastEmail`).
5. **Deliverability & Test Mode**:
   - Admins can dispatch an instant single-recipient test email to any address with sample merge data before launching to the entire user base.
