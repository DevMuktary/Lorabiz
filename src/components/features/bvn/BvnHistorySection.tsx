"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  ClockCounterClockwise, FilePdf, DownloadSimple, SpinnerGap, CheckCircle, 
  Eye, User, Phone, MapPin, Calendar, IdentificationBadge, X, Trash,
  CaretLeft, CaretRight
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { parseDemographics } from "@/lib/demographics-parser";

export interface BvnHistoryItem {
  id: string;
  bvnMasked: string;
  rawSlipType?: string;
  slipType: string;
  amountCharged?: number;
  reference?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  gender?: string;
  dob?: string;
  phone?: string;
  address?: string;
  userData?: any;
  providerUsed?: string;
  createdAt: string;
  createdAtFull?: string;
  pdfBase64?: string;
  pdfUrl?: string;
}

interface BvnHistorySectionProps {
  history: BvnHistoryItem[];
  title?: string;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function BvnHistorySection({ history, title = "72-Hour BVN Print History", isLoading = false }: BvnHistorySectionProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<BvnHistoryItem | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedDetails) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [selectedDetails]);

  // Reset or clamp current page when history length changes
  const totalPages = Math.max(1, Math.ceil((history?.length || 0) / ITEMS_PER_PAGE));
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [history?.length, totalPages, currentPage]);

  // Silent Blob Downloader
  const handleDirectDownload = async (item: BvnHistoryItem) => {
    try {
      setDownloadingId(item.id);
      setDownloadToast(`Download started for ${item.fullName || item.bvnMasked}! Check your downloads.`);
      setTimeout(() => setDownloadToast(null), 5000);

      const fileName = `NIBSS_${item.slipType.replace(/\s+/g, "_")}_${item.bvnMasked.replace(/\*/g, "X")}.pdf`;

      let blob: Blob;

      if (item.pdfBase64) {
        const cleanBase64 = item.pdfBase64.replace(/^data:application\/pdf;base64,/, "");
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: "application/pdf" });
      } else if (item.pdfUrl) {
        if (item.pdfUrl.startsWith("data:")) {
          const parts = item.pdfUrl.split(",");
          const cleanBase64 = parts[1] || parts[0];
          const byteCharacters = atob(cleanBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: "application/pdf" });
        } else {
          const response = await fetch(item.pdfUrl);
          if (!response.ok) throw new Error("Network response was not ok");
          blob = await response.blob();
        }
      } else {
        throw new Error("No file source available");
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.style.display = "none";
      downloadLink.href = blobUrl;
      downloadLink.download = fileName;
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(downloadLink);

      setDownloadingId(null);
      setSuccessId(item.id);
      setTimeout(() => setSuccessId(null), 3000);

    } catch (error) {
      console.error("Download failed:", error);
      alert("Could not download slip. Please check your connection and try again.");
      setDownloadingId(null);
    }
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = (history || []).slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (!isLoading && (!history || history.length === 0)) {
    return null;
  }

  return (
    <div className="pt-8 border-t border-border space-y-4">
      {/* DOWNLOAD STARTED BANNER */}
      {downloadToast && (
        <div className="bg-emerald-500 text-white text-xs font-black py-2.5 px-4 rounded-2xl shadow-lg flex items-center justify-between gap-2 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} weight="bold" />
            <span>{downloadToast}</span>
          </div>
          <button onClick={() => setDownloadToast(null)} className="text-white/80 hover:text-white cursor-pointer">
            <X size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* SECTION HEADER - CLEAN NATURAL FLOW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClockCounterClockwise size={20} className="text-emerald-600 dark:text-emerald-400" weight="bold" />
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            {title}
            {!isLoading && (history?.length || 0) > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                {history.length} {history.length === 1 ? "Record" : "Records"}
              </span>
            )}
          </h2>
        </div>
        <span className="text-[11px] font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border w-fit">
          72-Hour Purge Window
        </span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-1.5 py-2">
            <span className="w-1.5 h-4 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.4s]" />
            <span className="w-1.5 h-7 bg-emerald-500/90 rounded-full animate-bounce [animation-delay:-0.2s]" />
            <span className="w-1.5 h-10 bg-emerald-600 rounded-full animate-bounce" />
            <span className="w-1.5 h-7 bg-emerald-500/90 rounded-full animate-bounce [animation-delay:-0.2s]" />
            <span className="w-1.5 h-4 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.4s]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-foreground tracking-tight">Loading your verification history...</p>
            <p className="text-xs text-muted-foreground">Retrieving recent 72-hour BVN records from secure storage</p>
          </div>
        </div>
      ) : !history || history.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm font-bold text-muted-foreground">No slips generated within the last 72 hours.</p>
          <p className="text-xs text-muted-foreground/70">Generated slips appear here for 72 hours.</p>
        </div>
      ) : (
        /* CLEAN TABLE STANDING DIRECTLY ON PAGE WITHOUT OUTER BOX/CARD WRAPPER */
        <div className="w-full space-y-3">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm font-medium whitespace-nowrap">
              <thead className="border-b border-border text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-2 sm:px-4">Account Holder</th>
                  <th className="py-3 px-2 sm:px-4">BVN Identifier</th>
                  <th className="py-3 px-2 sm:px-4">Slip Format</th>
                  <th className="py-3 px-2 sm:px-4">Generated Time</th>
                  <th className="py-3 px-2 sm:px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {currentData.map((item) => {
                  const isDownloading = downloadingId === item.id;
                  const isSuccess = successId === item.id;
                  const itemDemo = parseDemographics(item.userData, item.fullName);
                  const displayFullName = itemDemo.fullName || item.fullName || "Verified Account Holder";

                  return (
                    <tr key={item.id} className="hover:bg-secondary/30 transition-colors group">
                      <td className="py-3.5 px-2 sm:px-4">
                        <div className="flex items-center gap-3">
                          {itemDemo.photo ? (
                            <img 
                              src={itemDemo.photo} 
                              alt={displayFullName} 
                              className="w-9 h-10 object-cover rounded-xl border border-emerald-500/30 shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                              <User size={18} weight="bold" />
                            </div>
                          )}
                          <div className="min-w-0 max-w-[200px] sm:max-w-[240px]">
                            <p className="font-black text-foreground truncate text-xs sm:text-sm">
                              {displayFullName}
                            </p>
                            <span className="text-[10px] text-muted-foreground block truncate">
                              Ref: {item.reference || item.id.slice(0, 12)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-2 sm:px-4">
                        <span className="font-mono font-bold text-foreground bg-secondary/80 px-2 py-0.5 rounded border border-border text-xs">
                          {item.bvnMasked}
                        </span>
                      </td>

                      <td className="py-3.5 px-2 sm:px-4">
                        <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {item.slipType}
                        </span>
                      </td>

                      <td className="py-3.5 px-2 sm:px-4">
                        <span className="text-xs font-bold text-muted-foreground">
                          {item.createdAt}
                        </span>
                      </td>

                      <td className="py-3.5 px-2 sm:px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDetails(item)}
                            className="h-8 px-2.5 sm:px-3 text-xs font-bold border-border bg-background hover:bg-secondary text-foreground rounded-xl cursor-pointer"
                          >
                            <Eye size={13} className="mr-1" weight="bold" />
                            <span>Details</span>
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleDirectDownload(item)}
                            disabled={isDownloading}
                            className={`h-8 px-2.5 sm:px-3.5 text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm ${
                              isSuccess
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                          >
                            {isDownloading ? (
                              <>
                                <SpinnerGap size={13} className="mr-1 animate-spin" weight="bold" />
                                <span>Preparing...</span>
                              </>
                            ) : isSuccess ? (
                              <>
                                <CheckCircle size={13} className="mr-1" weight="fill" />
                                <span>Downloaded</span>
                              </>
                            ) : (
                              <>
                                <DownloadSimple size={13} className="mr-1" weight="bold" />
                                <span>Download PDF</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 📄 PAGINATION FOOTER */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-border gap-3 text-xs">
              <span className="text-muted-foreground font-medium">
                Showing <span className="font-bold text-foreground">{startIndex + 1}</span> to <span className="font-bold text-foreground">{Math.min(startIndex + ITEMS_PER_PAGE, history.length)}</span> of <span className="font-bold text-foreground">{history.length}</span> entries
              </span>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-background border border-border rounded-xl font-bold text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <CaretLeft weight="bold" className="h-3.5 w-3.5" />
                  <span>Prev</span>
                </button>
                
                <div className="px-3 py-1 bg-secondary/60 rounded-xl border border-border font-black text-foreground min-w-[60px] text-center">
                  {currentPage} / {totalPages}
                </div>

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-background border border-border rounded-xl font-bold text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <CaretRight weight="bold" className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* DETAILS MODAL - FULL OPAQUE TAKE OVER */}
      {mounted && selectedDetails && typeof document !== "undefined" && createPortal(
        (() => {
          const selectedDemo = parseDemographics(selectedDetails.userData, selectedDetails.fullName);
          const detailsFullName = selectedDemo.fullName || selectedDetails.fullName || "Verified BVN Record";
          const detailsPhoto = selectedDemo.photo;
          const detailsDob = selectedDemo.dob || selectedDetails.dob;
          const detailsGender = selectedDemo.gender || selectedDetails.gender;
          const detailsPhone = selectedDemo.phone || selectedDetails.phone;
          const detailsBvn = selectedDemo.bvn || selectedDetails.bvnMasked;
          const detailsAddress = selectedDemo.address || selectedDetails.address;

          return (
            <div 
              className="fixed inset-0 min-h-screen w-screen bg-background/95 dark:bg-background/95 backdrop-blur-2xl z-[99999] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
              onClick={() => setSelectedDetails(null)}
            >
              <div 
                className="fixed inset-0 min-h-screen w-screen" 
                onClick={() => setSelectedDetails(null)} 
              />

              <div 
                className="relative w-full max-w-md bg-card text-card-foreground border border-border rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 text-left p-6 space-y-5 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <IdentificationBadge size={18} weight="bold" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-foreground">Verified BVN Record</h4>
                      <p className="text-[10px] text-muted-foreground">Authenticated NIBSS Identity Data</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDetails(null)}
                    className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X size={14} weight="bold" />
                  </button>
                </div>

                <div className="space-y-3 bg-secondary/40 p-4 rounded-2xl border border-border text-xs">
                  <div className="flex items-center gap-3">
                    {detailsPhoto ? (
                      <img
                        src={detailsPhoto}
                        alt={detailsFullName}
                        className="w-12 h-14 object-cover rounded-xl border border-emerald-500/30 shadow bg-secondary shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                        <User size={20} weight="bold" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Full Name</span>
                      <p className="font-black text-foreground text-sm break-words">{detailsFullName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/40">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                        <User size={11} /> BVN
                      </span>
                      <p className="font-mono font-bold text-foreground mt-0.5">{detailsBvn}</p>
                    </div>

                    {detailsDob && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          <Calendar size={11} /> Date of Birth
                        </span>
                        <p className="font-bold text-foreground mt-0.5">{detailsDob}</p>
                      </div>
                    )}

                    {detailsGender && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Gender</span>
                        <p className="font-bold text-foreground mt-0.5 uppercase">{detailsGender}</p>
                      </div>
                    )}

                    {detailsPhone && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          <Phone size={11} /> Phone
                        </span>
                        <p className="font-mono font-bold text-foreground mt-0.5">{detailsPhone}</p>
                      </div>
                    )}
                  </div>

                  {detailsAddress && (
                    <div className="pt-2 border-t border-border/40">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                        <MapPin size={11} /> Address
                      </span>
                      <p className="text-foreground mt-0.5 leading-relaxed">{detailsAddress}</p>
                    </div>
                  )}
                </div>

                {/* Retention Alert */}
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2.5">
                  <Trash size={16} className="text-amber-500 shrink-0 mt-0.5" weight="fill" />
                  <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    This verification record will be automatically deleted from our servers 72 hours after generation.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      handleDirectDownload(selectedDetails);
                      setSelectedDetails(null);
                    }}
                    className="flex-1 h-11 font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs cursor-pointer shadow-md"
                  >
                    <DownloadSimple size={16} className="mr-1.5" weight="bold" /> Download PDF Slip
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDetails(null)}
                    className="h-11 px-4 font-bold border-border rounded-xl text-xs cursor-pointer"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          );
        })(),
        document.body
      )}
    </div>
  );
}
