"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MailCheck, ShieldAlert, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const isPreview = searchParams.get("preview") === "true";

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    isPreview ? "success" : "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const handleUnsubscribe = async () => {
    if (isPreview) {
      setStatus("success");
      return;
    }

    if (!uid || !email || !token) {
      setStatus("error");
      setErrorMessage("Invalid unsubscribe link. Parameters are missing.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, email, token }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Failed to unsubscribe.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("An unexpected network error occurred.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <MailCheck size={26} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Email Subscription Preferences</h1>
          <p className="text-sm text-zinc-400">
            Manage your marketing and announcement email preferences for LoraBiz.
          </p>
        </div>

        {/* State 1: Idle (Ask for confirmation) */}
        {status === "idle" && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-800/60 rounded-xl border border-zinc-750 text-sm space-y-1">
              <p className="text-zinc-300 font-medium">Email Address:</p>
              <p className="text-indigo-400 font-mono break-all">{email || "Your Account Email"}</p>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              By confirming, you will no longer receive promotional offers, newsletters, and marketing announcements. 
              <strong> You will still receive essential transactional emails</strong> (such as CAC filing status updates, 2FA codes, and receipt notices).
            </p>

            <button
              onClick={handleUnsubscribe}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 font-semibold rounded-xl text-white transition-colors duration-200 text-sm flex items-center justify-center gap-2"
            >
              Confirm Unsubscribe
            </button>
          </div>
        )}

        {/* State 2: Loading */}
        {status === "loading" && (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 className="animate-spin text-indigo-500" size={36} />
            <p className="text-sm text-zinc-300">Updating your email preferences...</p>
          </div>
        )}

        {/* State 3: Success */}
        {status === "success" && (
          <div className="space-y-4 text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-zinc-100">Unsubscribed Successfully</h2>
              <p className="text-sm text-zinc-400">
                {isPreview
                  ? "Preview Mode: In a live campaign, the recipient would now be unsubscribed."
                  : `We've removed ${email || "your email"} from our marketing mailing lists.`}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 py-2.5 px-5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium text-zinc-200 transition-colors"
              >
                <ArrowLeft size={16} /> Return to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* State 4: Error */}
        {status === "error" && (
          <div className="space-y-4 text-center">
            <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-zinc-100">Unable to Process</h2>
              <p className="text-sm text-rose-400">{errorMessage || "Link may be invalid or expired."}</p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleUnsubscribe}
                className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium text-zinc-200 transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/contact"
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors underline"
              >
                Contact Support
              </Link>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="border-t border-zinc-800/80 pt-4 text-center">
          <p className="text-[11px] text-zinc-500">
            &copy; {new Date().getFullYear()} Quadrox Technologies Limited &bull; LoraBiz Portal
          </p>
        </div>

      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-sm">
          Loading preferences...
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
