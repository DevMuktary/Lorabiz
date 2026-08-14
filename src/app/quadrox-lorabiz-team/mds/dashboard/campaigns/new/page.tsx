"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
];

const STARTER_TEMPLATES = [
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

export default function NewCampaignPage() {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [senderName, setSenderName] = useState("LoraBiz");
  const [selectedSegment, setSelectedSegment] = useState("ALL");
  const [content, setContent] = useState(STARTER_TEMPLATES[0].content);

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

  // Fetch Audience Count when segment changes
  useEffect(() => {
    const fetchAudience = async () => {
      setIsAudienceLoading(true);
      try {
        const res = await fetch("/api/mds/campaigns/audience-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segment: selectedSegment }),
        });
        if (res.ok) {
          const data = await res.json();
          setAudienceCount(data.totalCount);
          setSampleUsers(data.sampleUsers || []);
        }
      } catch (err) {
        console.error("Failed to load audience count:", err);
      } finally {
        setIsAudienceLoading(false);
      }
    };

    fetchAudience();
  }, [selectedSegment]);

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
          targetAudience: { segment: selectedSegment },
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
          targetAudience: { segment: selectedSegment },
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
