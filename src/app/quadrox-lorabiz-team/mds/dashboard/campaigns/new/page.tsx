"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  ArrowLeft,
  Users,
  Send,
  Save,
  Sparkles,
  Eye,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Tag,
  HelpCircle,
  Check,
  Plus,
} from "lucide-react";
import { sanitizeEmailHtml } from "@/lib/sanitize-email";

const AUDIENCE_SEGMENTS = [
  {
    id: "ALL",
    title: "All Active Users",
    description: "Every registered user subscribed to promotional updates.",
    icon: "👥",
  },
  {
    id: "REGISTERED_ANY",
    title: "All Registered Clients",
    description: "Users who have submitted at least 1 CAC, SCUML, Tax ID, or NIN filing.",
    icon: "📄",
  },
  {
    id: "REGISTERED_BIZ",
    title: "Business Name Filers",
    description: "Sole proprietors who registered business names.",
    icon: "🏪",
  },
  {
    id: "REGISTERED_LLC",
    title: "LLC / Company Filers",
    description: "Corporate entity owners and directors.",
    icon: "🏢",
  },
  {
    id: "FUNDED_WALLET",
    title: "Funded Wallets (> ₦0)",
    description: "Users with positive wallet cash balance.",
    icon: "💳",
  },
  {
    id: "NO_ORDERS",
    title: "Inactive Leads (0 Filings)",
    description: "Signed up but have not started any registration.",
    icon: "🎯",
  },
  {
    id: "NEW_SIGNUPS_7D",
    title: "New Signups (Last 7 Days)",
    description: "Recent signups for onboarding or welcome follow-up.",
    icon: "⚡",
  },
  {
    id: "NEW_SIGNUPS_30D",
    title: "Signups (Last 30 Days)",
    description: "Users who joined within the past month.",
    icon: "📅",
  },
  {
    id: "SINGLE_USER",
    title: "Specific Client / Direct Email",
    description: "Send an official notice, dispute demand, or direct email to a single user.",
    icon: "🎯",
  },
];

const STARTER_TEMPLATES = [
  {
    name: "Strict Legal Demand (Deficit & Unlawful Gain)",
    subject: "LEGAL NOTICE: Demand for Immediate Restitution of Overdrawn Funds [REF: LB-SEC-01]",
    previewText: "URGENT NOTICE: Failure to settle outstanding deficit within 1 hour will trigger criminal reporting.",
    content: `<h2 style="color: #991b1b; margin: 0 0 16px; font-size: 20px; font-family: sans-serif; text-transform: uppercase;">
  ⚠️ FORMAL LEGAL DEMAND FOR IMMEDIATE RESTITUTION
</h2>
<p style="color: #475569; font-size: 13px; font-family: sans-serif; margin: 0 0 16px;">
  <strong>Notice Reference:</strong> LB-LEGAL/DISPUTE/2026<br />
  <strong>Recipient:</strong> {{firstName}} {{lastName}} ({{email}})<br />
  <strong>Status:</strong> Immediate Restitution Required<br />
  <strong>Time Limit:</strong> Strictly One (1) Hour from Delivery of This Notice
</p>

<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
  <p style="color: #991b1b; font-size: 14px; font-weight: 700; margin: 0 0 8px; font-family: sans-serif;">
    DEMAND TO REMIT UNLAWFULLY OBTAINED FUNDS
  </p>
  <p style="color: #7f1d1d; font-size: 13px; margin: 0; line-height: 1.6; font-family: sans-serif;">
    Our automated fraud and compliance audit has confirmed that your user account knowingly exploited a gateway anomaly to execute telecom recharge purchases totaling <strong>₦5,000.00</strong> against an actual available deposit of only <strong>₦1,250.00</strong>.
  </p>
</div>

<p style="color: #334155; font-size: 14px; line-height: 1.6; font-family: sans-serif; margin: 0 0 16px;">
  This exploitation resulted in an unauthorized and unlawful deficit balance of <strong>₦3,750.00</strong> that was drawn against company liquidity without lawful consideration.
</p>

<div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin-bottom: 20px; font-family: sans-serif;">
  <h3 style="margin: 0 0 12px; font-size: 14px; color: #0f172a; text-transform: uppercase;">Audit Summary & Breakdown</h3>
  <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
    <tr>
      <td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0;">Registered Account Name:</td>
      <td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-weight: 700; text-align: right;">{{firstName}} {{lastName}}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0;">Verified Identity / Trace:</td>
      <td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-weight: 700; text-align: right;">[ORIGINAL_NAME_FROM_FUNDING_TRACE]</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0;">Legitimate Deposit Amount:</td>
      <td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-weight: 700; text-align: right; color: #16a34a;">₦1,250.00</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0;">Airtime Delivered to Telecom:</td>
      <td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-weight: 700; text-align: right; color: #dc2626;">₦5,000.00</td>
    </tr>
    <tr style="font-weight: 800; font-size: 14px;">
      <td style="padding: 8px 0; color: #991b1b;">TOTAL RESTITUTION DUE:</td>
      <td style="padding: 8px 0; color: #991b1b; text-align: right;">₦3,750.00</td>
    </tr>
  </table>
</div>

<h3 style="color: #0f172a; font-size: 15px; margin: 0 0 10px; font-family: sans-serif;">PAYMENT INSTRUCTIONS (MANDATORY WITHIN 1 HOUR)</h3>
<p style="color: #334155; font-size: 13px; line-height: 1.6; font-family: sans-serif; margin: 0 0 16px;">
  You are hereby demanded to remit the deficit of <strong>₦3,750.00</strong> immediately via the secure payment link or designated account below:
</p>

<div style="text-align: center; margin: 24px 0;">
  <a href="[INSERT_KORAPAY_PAYMENT_LINK_HERE]" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 800; font-size: 15px; font-family: sans-serif; letter-spacing: 0.5px;">
    PAY ₦3,750.00 RESTITUTION NOW
  </a>
</div>

<p style="color: #64748b; font-size: 12px; font-family: sans-serif; margin: 0 0 20px; text-align: center;">
  <strong>Direct Bank Transfer Alternative:</strong><br />
  Account Details: [INSERT BANK NAME & ACCOUNT NUMBER]<br />
  Payment Reference: <code>RESTITUTION-{{email}}</code>
</p>

<div style="border-top: 2px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
  <h4 style="color: #991b1b; font-size: 13px; margin: 0 0 8px; font-family: sans-serif; text-transform: uppercase;">
    LEGAL CONSEQUENCES OF NON-COMPLIANCE:
  </h4>
  <p style="color: #475569; font-size: 12px; line-height: 1.6; font-family: sans-serif; margin: 0 0 8px;">
    Take note that retainment or conversion of funds and digital goods delivered through system anomaly constitutes an offense under <strong>Section 383 and 390 of the Criminal Code Act</strong> (Stealing and Fraudulent Conversion) and <strong>Section 14 & 18 of the Cybercrimes (Prohibition, Prevention, etc.) Act 2015</strong>.
  </p>
  <p style="color: #475569; font-size: 12px; line-height: 1.6; font-family: sans-serif; margin: 0;">
    If full payment is not confirmed within <strong>1 hour</strong> of this notice, LoraBiz Legal and Security will initiate:
  </p>
  <ol style="color: #475569; font-size: 12px; line-height: 1.6; font-family: sans-serif; margin: 8px 0 0; padding-left: 20px;">
    <li>Formal criminal petition to the Nigeria Police Force Cybercrime Directorate and EFCC.</li>
    <li>Direct BVN / NIN fraud watchlist submission to NIBSS (flagging your identity across all Nigerian financial institutions).</li>
    <li>Permanent account revocation and civil suit for recovery costs and exemplary damages.</li>
  </ol>
</div>`,
  },
  {
    name: "Promotional Discount Blast",
    subject: "Special Offer: 30% Off Your Next Business Registration 🚀",
    previewText: "Claim your limited-time discount on CAC and SCUML filings.",
    content: `<h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">Hello {{firstName}},</h2>
<p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
  Take your enterprise to the next level this season. For a limited time, enjoy exclusive discounted pricing on all business registrations, LLC incorporations, and compliance certifications on LoraBiz.
</p>
<div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
  <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; font-weight: 700; text-transform: uppercase;">Exclusive Promo Code</p>
  <p style="margin: 0; font-size: 28px; font-weight: 800; color: #4f46e5; letter-spacing: 4px; font-family: monospace;">GROWTH2026</p>
</div>
<div style="text-align: center;">
  <a href="https://lorabiz.com/dashboard/cac" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Start Your Filing Now</a>
</div>`,
  },
  {
    name: "Regulatory & Compliance Notice",
    subject: "Important Compliance Notice: Annual Filings & Tax Returns",
    previewText: "Keep your registered entity active and avoid regulatory penalties.",
    content: `<h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">Dear {{firstName}},</h2>
<p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
  This is a reminder regarding mandatory regulatory compliance for corporate entities registered in Nigeria. To prevent your business from being marked inactive or incurring CAC penalties, ensure your statutory filings are up to date.
</p>
<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
  <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5; font-family: sans-serif;">
    <strong>Quick Tip:</strong> Need help filing your annual returns or obtaining your SCUML certificate? Our compliance desk handles everything end-to-end.
  </p>
</div>
<div style="text-align: center;">
  <a href="https://lorabiz.com/dashboard" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Access Your Portal</a>
</div>`,
  },
  {
    name: "Platform Announcement",
    subject: "Exciting New Features Now Live on LoraBiz ✨",
    previewText: "Instant automated TIN generation and real-time CAC query wizard.",
    content: `<h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">Hello {{firstName}},</h2>
<p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
  We are delighted to introduce several major upgrades to the LoraBiz portal designed to make managing your business seamless and lightning fast:
</p>
<ul style="color: #475569; line-height: 1.8; margin: 0 0 24px; padding-left: 20px; font-size: 14px; font-family: sans-serif;">
  <li><strong>Instant Tax ID (TIN) Generation:</strong> Download official TIN certificates straight from your dashboard.</li>
  <li><strong>Interactive Query Wizard:</strong> Resolve CAC examiner notes in minutes with zero extra charges.</li>
  <li><strong>Enhanced Referral Program:</strong> Earn instant commissions when you refer friends with code <strong>{{referralCode}}</strong>.</li>
</ul>
<div style="text-align: center;">
  <a href="https://lorabiz.com/dashboard" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Explore New Features</a>
</div>`,
  },
];

function NewCampaignComposer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryTargetEmail = searchParams.get("targetEmail") || "";
  const queryTargetName = searchParams.get("targetName") || "";
  const queryTemplate = searchParams.get("template") || "";

  const isLegalDemand = queryTemplate === "LEGAL_DEMAND";
  const defaultTemplate = isLegalDemand ? STARTER_TEMPLATES[0] : STARTER_TEMPLATES[1];

  // Form State
  const [selectedSegment, setSelectedSegment] = useState(queryTargetEmail ? "SINGLE_USER" : "ALL");
  const [targetEmail, setTargetEmail] = useState(queryTargetEmail);

  const [title, setTitle] = useState(
    isLegalDemand
      ? `LEGAL DEMAND NOTICE: Deficit Restitution - ${queryTargetName || queryTargetEmail || "Incident"}`
      : ""
  );
  const [subject, setSubject] = useState(isLegalDemand ? STARTER_TEMPLATES[0].subject : "");
  const [previewText, setPreviewText] = useState(isLegalDemand ? STARTER_TEMPLATES[0].previewText : "");
  const [senderName, setSenderName] = useState(isLegalDemand ? "LoraBiz Legal & Fraud Desk" : "LoraBiz");
  const [content, setContent] = useState(defaultTemplate.content);

  // Audience Preview State
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [sampleUsers, setSampleUsers] = useState<any[]>([]);
  const [isAudienceLoading, setIsAudienceLoading] = useState(false);

  // UI State
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Test Email Modal
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState("");

  // Confirmation Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Fetch Audience Count when segment or targetEmail changes
  useEffect(() => {
    let isCancelled = false;

    const fetchAudience = async () => {
      if (selectedSegment === "SINGLE_USER" && !targetEmail.trim()) {
        setAudienceCount(0);
        setSampleUsers([]);
        return;
      }

      setIsAudienceLoading(true);
      try {
        const res = await fetch("/api/mds/campaigns/audience-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            segment: selectedSegment,
            targetEmail: selectedSegment === "SINGLE_USER" ? targetEmail.trim() : undefined,
          }),
        });
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setAudienceCount(data.totalCount);
          setSampleUsers(data.sampleUsers || []);
        }
      } catch (err) {
        console.error("Failed to load audience count:", err);
      } finally {
        if (!isCancelled) {
          setIsAudienceLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchAudience();
    }, selectedSegment === "SINGLE_USER" ? 350 : 0);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [selectedSegment, targetEmail]);

  const insertMergeTag = (tag: string) => {
    setContent((prev) => `${prev} {{${tag}}}`);
  };

  const handleApplyTemplate = (tpl: typeof STARTER_TEMPLATES[0]) => {
    if (!subject) setSubject(tpl.subject);
    if (!previewText) setPreviewText(tpl.previewText);
    setContent(tpl.content);
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!title || !subject || !content) {
      alert("Please provide a title, subject, and content.");
      return;
    }

    if (selectedSegment === "SINGLE_USER" && !targetEmail.trim()) {
      alert("Please enter the recipient email address for single-user delivery.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/mds/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          previewText,
          senderName,
          targetAudience: {
            segment: selectedSegment,
            ...(selectedSegment === "SINGLE_USER" ? { targetEmail: targetEmail.trim() } : {}),
          },
          content,
        }),
      });

      if (res.ok) {
        router.push("/quadrox-lorabiz-team/mds/dashboard/campaigns");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save draft.");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  // Send Test Email
  const handleSendTestEmail = async () => {
    if (!testEmail || !subject || !content) {
      alert("Please enter a test email address, subject, and content.");
      return;
    }

    setIsSendingTest(true);
    setTestSuccessMessage("");
    try {
      const res = await fetch("/api/mds/campaigns/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testEmail,
          subject,
          previewText,
          content,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTestSuccessMessage(data.message || `Sent successfully to ${testEmail}`);
      } else {
        alert(data.error || "Failed to send test email.");
      }
    } catch (err) {
      alert("Error dispatching test email.");
    } finally {
      setIsSendingTest(false);
    }
  };

  // Dispatch Broadcast
  const handleDispatchBroadcast = async () => {
    if (selectedSegment === "SINGLE_USER" && !targetEmail.trim()) {
      alert("Please enter the recipient email address for single-user delivery.");
      setIsConfirmModalOpen(false);
      return;
    }

    setIsSending(true);
    try {
      // 1. Create the campaign record first
      const createRes = await fetch("/api/mds/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          previewText,
          senderName,
          targetAudience: {
            segment: selectedSegment,
            ...(selectedSegment === "SINGLE_USER" ? { targetEmail: targetEmail.trim() } : {}),
          },
          content,
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.error || "Failed to initialize campaign");
      }

      const { campaign } = await createRes.json();

      // 2. Trigger asynchronous background dispatch
      const sendRes = await fetch(`/api/mds/campaigns/${campaign.id}/send`, {
        method: "POST",
      });

      if (!sendRes.ok) {
        const sendErr = await sendRes.json();
        throw new Error(sendErr.error || "Failed to enqueue broadcast jobs");
      }

      router.push(`/quadrox-lorabiz-team/mds/dashboard/campaigns/${campaign.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to dispatch campaign broadcast.");
      setIsSending(false);
      setIsConfirmModalOpen(false);
    }
  };

  // Render HTML preview with sample merge tags
  const renderPreviewHtml = () => {
    const sample = {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      referralCode: "LORA-8823",
    };

    let processed = content
      .replace(/\{\{\s*firstName\s*\}\}/gi, sample.firstName)
      .replace(/\{\{\s*first_name\s*\}\}/gi, sample.firstName)
      .replace(/\{\{\s*lastName\s*\}\}/gi, sample.lastName)
      .replace(/\{\{\s*fullName\s*\}\}/gi, `${sample.firstName} ${sample.lastName}`)
      .replace(/\{\{\s*email\s*\}\}/gi, sample.email)
      .replace(/\{\{\s*referralCode\s*\}\}/gi, sample.referralCode);

    const sanitizedBody = sanitizeEmailHtml(processed);

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f5f7; padding: 24px 12px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          <div style="background-color: #0f172a; padding: 20px; text-align: center;">
            <img src="https://lorabiz.com/logo.png" alt="LoraBiz" style="height: 28px; width: auto;" />
          </div>
          <div style="padding: 24px; color: #334155; line-height: 1.6; font-size: 14px;">
            ${sanitizedBody}
          </div>
          <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #64748b;">
            <p style="margin: 0 0 6px;">You are receiving this email as a registered user of LoraBiz.</p>
            <p style="margin: 0; text-decoration: underline; color: #94a3b8;">Unsubscribe from marketing emails</p>
          </div>
        </div>
      </div>
    `;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/campaigns"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Compose Email Broadcast</h1>
            <p className="text-xs text-zinc-500">Design your message, filter audience, and schedule or send.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
          >
            <Eye size={14} /> Send Test Email
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors flex items-center gap-1.5"
          >
            <Save size={14} /> {isSaving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={() => {
              if (!title || !subject || !content) {
                alert("Please fill in Campaign Title, Subject, and Email Content.");
                return;
              }
              setIsConfirmModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Send size={14} /> Launch Broadcast
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Composer Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Campaign Metadata */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">1. Campaign Details</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Internal Campaign Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 30% Easter CAC Filing Promo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    placeholder="LoraBiz"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Email Subject Line <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Special Announcement for {{firstName}}"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Inbox Preview Text (Preheader)
                </label>
                <input
                  type="text"
                  placeholder="Short snippet displayed in the recipient's inbox preview..."
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Target Audience */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">2. Target Audience</h2>
              <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full">
                <Users size={13} />
                {isAudienceLoading ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  `${audienceCount?.toLocaleString() ?? 0} Eligible Recipients`
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AUDIENCE_SEGMENTS.map((seg) => {
                const isSelected = selectedSegment === seg.id;
                return (
                  <div
                    key={seg.id}
                    onClick={() => setSelectedSegment(seg.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{seg.icon}</span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{seg.title}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                      {seg.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Direct Email Target Field when SINGLE_USER selected */}
            {selectedSegment === "SINGLE_USER" && (
              <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Mail size={13} /> Target Recipient Email Address <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wider">
                    Bypasses Marketing Opt-Out
                  </span>
                </div>
                <input
                  type="email"
                  placeholder="e.g. client@example.com"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-zinc-800 border border-amber-300 dark:border-amber-600/50 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  This direct legal or dispute notice will be delivered specifically to the client registered under this address, even if their account has been suspended or has opted out of marketing newsletters.
                </p>
              </div>
            )}

            {/* Sample Users Preview Pill list */}
            {sampleUsers.length > 0 && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
                <span className="text-zinc-500 font-semibold block mb-1.5">Sample Matching Recipients:</span>
                <div className="flex flex-wrap gap-1.5">
                  {sampleUsers.map((u) => (
                    <span
                      key={u.id}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-700 dark:text-zinc-300 font-mono"
                    >
                      {u.firstName || "Client"} ({u.email})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Body & Starter Templates */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">3. Email Message Body</h2>
              
              {/* Preset Templates Dropdown */}
              <div className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-500" />
                <span className="text-xs text-zinc-400">Presets:</span>
                {STARTER_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md text-[11px] font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    {tpl.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Merge Tag Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-zinc-500 font-medium mr-1 flex items-center gap-1">
                <Tag size={12} /> Merge Tags:
              </span>
              {["firstName", "lastName", "fullName", "email", "referralCode"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => insertMergeTag(tag)}
                  className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-md text-[11px] font-mono font-semibold transition-colors"
                  title={`Insert {{${tag}}}`}
                >
                  +{`{{${tag}}}`}
                </button>
              ))}
            </div>

            {/* HTML / Content Editor */}
            <div>
              <textarea
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your email body here. HTML formatting and inline CSS are supported..."
                className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
              <p className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1">
                <HelpCircle size={12} /> Supports raw HTML, paragraphs, buttons, and merge tokens.
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Live Interactive Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Live Email Preview
                  </span>
                </div>

                <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <button
                    onClick={() => setPreviewDevice("desktop")}
                    className={`p-1.5 rounded-md text-xs transition-colors ${
                      previewDevice === "desktop"
                        ? "bg-white dark:bg-zinc-900 text-indigo-500 shadow-xs"
                        : "text-zinc-400"
                    }`}
                    title="Desktop Preview"
                  >
                    <Monitor size={15} />
                  </button>
                  <button
                    onClick={() => setPreviewDevice("mobile")}
                    className={`p-1.5 rounded-md text-xs transition-colors ${
                      previewDevice === "mobile"
                        ? "bg-white dark:bg-zinc-900 text-indigo-500 shadow-xs"
                        : "text-zinc-400"
                    }`}
                    title="Mobile Preview"
                  >
                    <Smartphone size={15} />
                  </button>
                </div>
              </div>

              {/* Email Client Shell Simulation */}
              <div className="space-y-2 text-xs bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
                <div>
                  <span className="text-zinc-400">From:</span>{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">{senderName || "LoraBiz"}</strong>{" "}
                  <span className="text-zinc-400">&lt;support@lorabiz.com&gt;</span>
                </div>
                <div>
                  <span className="text-zinc-400">Subject:</span>{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {subject || "(No Subject Line)"}
                  </strong>
                </div>
                {previewText && (
                  <div className="text-zinc-500 dark:text-zinc-400 truncate">
                    <span className="text-zinc-400">Preview:</span> {previewText}
                  </div>
                )}
              </div>

              {/* Rendered Body Frame */}
              <div
                className={`mx-auto transition-all overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 ${
                  previewDevice === "mobile" ? "max-w-[340px]" : "w-full"
                }`}
              >
                <div
                  className="max-h-[520px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: renderPreviewHtml() }}
                />
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Test Email Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Mail size={18} className="text-indigo-500" /> Send Test Email
              </h3>
              <button
                onClick={() => {
                  setIsTestModalOpen(false);
                  setTestSuccessMessage("");
                }}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Verify how your subject line, layout, and styling render in your actual email client (Gmail, Outlook, Apple Mail).
            </p>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Recipient Email Address
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {testSuccessMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 size={16} /> {testSuccessMessage}
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  setIsTestModalOpen(false);
                  setTestSuccessMessage("");
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSendTestEmail}
                disabled={isSendingTest}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
              >
                {isSendingTest ? <RefreshCw size={14} className="animate-spin" /> : "Send Test"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Launch Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="h-12 w-12 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
              <Send size={24} />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Ready to Broadcast?</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                You are about to launch <strong>{title}</strong> to{" "}
                <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                  {audienceCount?.toLocaleString() ?? 0}
                </span>{" "}
                recipients via background workers.
              </p>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/60 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-400">Target Segment:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {AUDIENCE_SEGMENTS.find((s) => s.id === selectedSegment)?.title}
                </span>
              </div>
              {selectedSegment === "SINGLE_USER" && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Target Recipient:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono text-[11px] truncate max-w-[220px]">
                    {targetEmail || "No email entered"}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-400">Subject:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">
                  {subject}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSending}
                className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatchBroadcast}
                disabled={isSending}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
              >
                {isSending ? <RefreshCw size={14} className="animate-spin" /> : "Confirm & Send Now"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
          <RefreshCw size={20} className="animate-spin text-indigo-500" />
          <span>Loading email campaign composer...</span>
        </div>
      }
    >
      <NewCampaignComposer />
    </Suspense>
  );
}
