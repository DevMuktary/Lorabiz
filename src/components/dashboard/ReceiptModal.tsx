"use client";

import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { X, DownloadSimple, CheckCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ReceiptModalProps {
  serviceName?: string;
  businessName: string;
  reference: string;
  date: string;
  amount: number;
  onClose: () => void;
}

export default function ReceiptModal({ serviceName = "Business", businessName, reference, date, amount, onClose }: ReceiptModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);

    try {
      // Because we used inline styles, html2canvas will completely ignore Tailwind v4's lab() colors.
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const margin = 10; 
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const usableWidth = pdfWidth - (margin * 2);
      const pdfHeight = (canvas.height * usableWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", margin, margin, usableWidth, pdfHeight);
      pdf.save(`LumeBiz_Receipt_${reference}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again or take a screenshot.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose} 
    >
      <div 
        className="bg-slate-100 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* MODAL HEADER (Tailwind colors are fine here because it's OUTSIDE the PDF capture zone) */}
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0 z-50">
          <h3 className="font-black text-lg text-slate-900">Transaction Receipt</h3>
          <button 
            onClick={onClose} 
            disabled={isDownloading} 
            className="p-2 hover:bg-slate-100 bg-slate-50 rounded-full text-slate-900 transition-colors disabled:opacity-50 cursor-pointer border border-slate-200"
          >
            <X weight="bold" size={20} />
          </button>
        </div>

        {/* RECEIPT CANVAS SCROLLABLE AREA */}
        <div className="p-4 md:p-8 flex justify-center overflow-y-auto custom-scrollbar">
          
          {/* THE ACTUAL RECEIPT DIV (STRICT INLINE STYLES TO BYPASS TAILWIND 'LAB' BUG) */}
          <div 
            ref={receiptRef} 
            className="w-full max-w-[450px] mx-auto p-6 md:p-8 relative overflow-hidden rounded-lg"
            style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderWidth: "1px", borderStyle: "solid" }}
          >
             {/* FADED WATERMARK */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none rotate-[-30deg] select-none">
               <span className="text-[100px] md:text-[120px] font-black tracking-tighter" style={{ color: "rgba(15, 23, 42, 0.03)" }}>PAID</span>
             </div>

             {/* RECEIPT HEADER */}
             <div className="flex justify-between items-start mb-6 pb-6 relative z-10" style={{ borderBottomColor: "#f1f5f9", borderBottomWidth: "1px", borderBottomStyle: "solid" }}>
                <div>
                  <h1 className="text-2xl font-black tracking-tighter" style={{ color: "#ff3f7a" }}>LumeBiz<span style={{ color: "#0f172a" }}>.</span></h1>
                  <p className="text-[10px] md:text-xs font-medium mt-1" style={{ color: "#64748b" }}>Fast & Secure Business Registrations</p>
                </div>
                <div className="text-right">
                  <h2 className="text-lg md:text-xl font-black uppercase tracking-widest" style={{ color: "#1e293b" }}>Receipt</h2>
                  <p className="text-[10px] font-bold mt-1" style={{ color: "#94a3b8" }}>#{reference}</p>
                </div>
             </div>

             {/* CUSTOMER & DATE INFO */}
             <div className="flex flex-col gap-4 mb-6 relative z-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Entity Name</p>
                  <p className="font-bold text-sm md:text-base leading-tight" style={{ color: "#0f172a" }}>{businessName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Date</p>
                  <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{date}</p>
                </div>
             </div>

             {/* ITEM TABLE */}
             <div className="mb-6 relative z-10">
               <div className="flex justify-between pb-2 mb-3" style={{ borderBottomColor: "#0f172a", borderBottomWidth: "2px", borderBottomStyle: "solid" }}>
                 <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#0f172a" }}>Description</p>
                 <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#0f172a" }}>Amount</p>
               </div>
               
               <div className="flex justify-between items-center py-3" style={{ borderBottomColor: "#f1f5f9", borderBottomWidth: "1px", borderBottomStyle: "solid" }}>
                 <div className="pr-4">
                   <p className="font-bold text-sm leading-tight" style={{ color: "#1e293b" }}>
                     Processing Fee and {serviceName} Registration
                   </p>
                 </div>
                 <p className="font-black text-sm md:text-base whitespace-nowrap" style={{ color: "#0f172a" }}>₦{amount.toLocaleString()}</p>
               </div>
             </div>

             {/* TOTALS */}
             <div className="flex justify-end relative z-10 mb-8">
               <div className="w-[180px]">
                 <div className="flex justify-between py-3" style={{ borderTopColor: "#e2e8f0", borderTopWidth: "2px", borderTopStyle: "solid", borderBottomColor: "#ff3f7a", borderBottomWidth: "4px", borderBottomStyle: "solid" }}>
                   <p className="text-sm font-black uppercase" style={{ color: "#0f172a" }}>Total</p>
                   <p className="text-base font-black" style={{ color: "#ff3f7a" }}>₦{amount.toLocaleString()}</p>
                 </div>
               </div>
             </div>

             {/* FOOTER */}
             <div className="text-center relative z-10 p-3 rounded-lg" style={{ backgroundColor: "#f8fafc", borderColor: "#f1f5f9", borderWidth: "1px", borderStyle: "solid" }}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle weight="fill" color="#10b981" className="h-4 w-4" />
                  <span className="font-bold text-xs" style={{ color: "#334155" }}>Payment Verified</span>
                </div>
                <p className="text-[9px] font-medium" style={{ color: "#94a3b8" }}>Thank you for choosing LumeBiz. Support: hello@lumebiz.com</p>
             </div>

          </div>
        </div>

        {/* ACTION FOOTER */}
        <div className="px-5 py-4 bg-white border-t border-slate-200 flex justify-end shrink-0 z-50">
          <Button 
            onClick={handleDownloadPDF} 
            disabled={isDownloading}
            className="w-full md:w-auto h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md flex items-center justify-center"
          >
            {isDownloading ? "Processing..." : <><DownloadSimple weight="bold" className="mr-2 h-5 w-5" /> Download PDF</>}
          </Button>
        </div>

      </div>
    </div>
  );
}
