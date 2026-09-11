"use client";

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  User,
  ShieldCheck,
  Hash,
} from "lucide-react";
import { UnifiedApiRequestItem } from "@/app/api/developer/requests/route";
import { formatWATDateTime } from "@/lib/developer/format-wat";

interface ApiServiceOrderDrawerProps {
  order: UnifiedApiRequestItem | null;
  onClose: () => void;
}

export const ApiServiceOrderDrawer: React.FC<ApiServiceOrderDrawerProps> = ({
  order,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  if (!order) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case "COMPLETED":
      case "VALIDATED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {order.status === "VALIDATED" ? "Validated" : "Completed"}
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Clock className="h-3.5 w-3.5 animate-spin" />
            Processing
          </span>
        );
      case "FAILED":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400 border border-red-500/30">
            <AlertCircle className="h-3.5 w-3.5" />
            Failed
          </span>
        );
    }
  };

  const handleDownloadPdf = (base64OrUrl: string) => {
    if (base64OrUrl.startsWith("http")) {
      window.open(base64OrUrl, "_blank");
      return;
    }
    // Handle data URL / base64
    const link = document.createElement("a");
    link.href = base64OrUrl.startsWith("data:") ? base64OrUrl : `data:application/pdf;base64,${base64OrUrl}`;
    link.download = `NIN_Personalization_${order.reference}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const details = (order.details || {}) as Record<string, any>;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative h-full w-full max-w-xl border-l border-border bg-card p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                {order.serviceName}
              </span>
              {getStatusBadge()}
            </div>
            <h2 className="mt-2 text-lg font-bold text-foreground">
              Request Order Details
            </h2>
            <p className="text-xs text-muted-foreground">
              Live automated identity order submitted via Lorabiz API
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Close Drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Key Identifiers Card */}
          <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {order.inputLabel}:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-foreground bg-card px-2.5 py-1 rounded-md border border-border">
                  {order.inputIdentifier}
                </span>
                <button
                  onClick={() => copyToClipboard(order.inputIdentifier, "input")}
                  className="rounded p-1 hover:bg-muted text-muted-foreground transition-colors"
                  title="Copy Identifier"
                >
                  {copiedField === "input" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">API Reference:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-foreground bg-card px-2 py-0.5 rounded border border-border">
                  {order.reference}
                </span>
                <button
                  onClick={() => copyToClipboard(order.reference, "ref")}
                  className="rounded p-1 hover:bg-muted text-muted-foreground transition-colors"
                  title="Copy Reference"
                >
                  {copiedField === "ref" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {order.clientReference && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Client Reference:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-foreground bg-card px-2 py-0.5 rounded border border-border">
                    {order.clientReference}
                  </span>
                  <button
                    onClick={() => copyToClipboard(order.clientReference!, "clientRef")}
                    className="rounded p-1 hover:bg-muted text-muted-foreground transition-colors"
                    title="Copy Client Reference"
                  >
                    {copiedField === "clientRef" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Financials & WAT Timestamps */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Fee Debited
              </span>
              <div className="mt-1 text-sm font-bold text-foreground">
                ₦{Number(order.amountCharged || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {order.refunded ? "Refunded to wallet" : "Live wallet charge"}
              </span>
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Submitted (WAT)
              </span>
              <div className="mt-1 text-xs font-medium text-foreground">
                {formatWATDateTime(order.createdAt)}
              </div>
            </div>

            {order.completedAt && (
              <div className="col-span-2 rounded-xl border border-border bg-card p-3 shadow-xs flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Completed At (WAT):
                </span>
                <span className="font-mono text-xs font-semibold text-foreground">
                  {formatWATDateTime(order.completedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Failure Alert Box */}
          {order.status === "FAILED" && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wide">
                    Request Processing Failed
                  </h4>
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 leading-relaxed font-mono">
                    {order.failureReason || "The request could not be fulfilled by the identity provider."}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {order.refunded
                      ? "Your wallet balance was automatically refunded."
                      : "Check failure message above or retry with verified input details."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Service Output Details */}
          {order.serviceType === "NIN_PERSONALIZATION" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Personalization Output
              </h3>

              {details.resolvedNin ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        Resolved National Identification Number
                      </span>
                      <div className="mt-1 font-mono text-base font-bold text-emerald-900 dark:text-emerald-200">
                        {details.resolvedNin}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(details.resolvedNin, "nin")}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                    >
                      {copiedField === "nin" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedField === "nin" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Demographics */}
              {(details.fullName || details.dob || details.gender || details.phone) && (
                <div className="rounded-2xl border border-border bg-card p-4 divide-y divide-border/60 text-xs">
                  {details.fullName && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Full Name</span>
                      <span className="font-semibold text-foreground">{details.fullName}</span>
                    </div>
                  )}
                  {details.dob && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Date of Birth</span>
                      <span className="font-semibold text-foreground">{details.dob}</span>
                    </div>
                  )}
                  {details.gender && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Gender</span>
                      <span className="font-semibold text-foreground">{details.gender}</span>
                    </div>
                  )}
                  {details.phone && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-semibold text-foreground">{details.phone}</span>
                    </div>
                  )}
                  {details.residenceState && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Residence State</span>
                      <span className="font-semibold text-foreground">{details.residenceState}</span>
                    </div>
                  )}
                </div>
              )}

              {/* PDF Slip Download Button */}
              {details.pdfUrl && (
                <button
                  onClick={() => handleDownloadPdf(details.pdfUrl)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
                >
                  <Download className="h-4 w-4" />
                  <span>Download NIN Slip PDF</span>
                </button>
              )}
            </div>
          )}

          {/* IPE Clearance Specific Details */}
          {order.serviceType === "NIN_IPE" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                IPE Clearance Result
              </h3>

              {details.newTrackingId ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        New Tracking ID (Cleared)
                      </span>
                      <div className="mt-1 font-mono text-base font-bold text-emerald-900 dark:text-emerald-200">
                        {details.newTrackingId}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(details.newTrackingId, "newTrack")}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                    >
                      {copiedField === "newTrack" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedField === "newTrack" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {details.adminNotes && (
                <div className="rounded-xl border border-border bg-muted/20 p-3.5 text-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Operator Notes</span>
                  <p className="mt-1 text-foreground leading-relaxed">{details.adminNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Validation Specific Details */}
          {order.serviceType === "NIN_VALIDATION" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Validation Information
              </h3>
              <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Validation Type</span>
                  <span className="font-semibold text-foreground font-mono">
                    {String(details.validationType || "STANDARD_VALIDATION")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Raw JSON Toggle & Viewer */}
          <div className="pt-2">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {showRawJson ? "Hide Raw Order Payload" : "View Raw Order Payload (JSON)"}
            </button>

            {showRawJson && (
              <div className="relative mt-2">
                <button
                  onClick={() => copyToClipboard(JSON.stringify(order, null, 2), "raw")}
                  className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted/80 transition-colors"
                >
                  {copiedField === "raw" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedField === "raw" ? "Copied" : "Copy"}</span>
                </button>
                <pre className="max-h-[300px] overflow-auto rounded-xl border border-border bg-muted/40 p-4 font-mono text-[11px] text-foreground leading-relaxed">
                  {JSON.stringify(order, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
