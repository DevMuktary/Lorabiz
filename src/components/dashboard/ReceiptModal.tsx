"use client";

import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { X, DownloadSimple, CheckCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ReceiptModalProps {
  businessName: string;
  reference: string;
  date: string;
  amount: number;
  onClose: () => void;
}

export default function ReceiptModal({ businessName, reference, date, amount, onClose }: ReceiptModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);

    try {
      // 1. Take a snapshot (Optimized for mobile memory limits)
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false // Prevents console overload/crashes on older phones
      });

      // 2. Convert to JPEG instead of PNG (Massive memory savings on mobile)
      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      // 3. Create A4 PDF with proper margins
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      
      const margin = 10; // 10mm padding on all sides
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const usableWidth = pdfWidth - (margin * 2);
      const pdfHeight = (canvas.height * usableWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", margin, margin, usableWidth, pdfHeight);
      
      // 4. Trigger the download
      pdf.save(`LumeBiz_Receipt_${reference}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again or take a screenshot.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300 overflow-y-auto">
      
      <div className="bg-slate-100 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-auto relative flex flex-col max-h-[90vh]">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
          <h3 className="font-black text-lg text-slate-900">Transaction Receipt</h3>
          <button onClick={onClose} disabled={isDownloading} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors disabled:opacity-50">
            <X weight="bold" />
          </button>
        </div>

        {/* RECEIPT CANVAS SCROLLABLE AREA */}
        <div className="p-4 md:p-8 flex justify-center overflow-y-auto custom-scrollbar">
          
          {/* THE ACTUAL RECEIPT DIV */}
          <div 
            ref={receiptRef} 
            className="bg-white w-full max-w-[450px] mx-auto p-6 md:p-8 relative overflow-hidden shadow-sm border border-slate-200 rounded-lg"
          >
             {/* FADED WATERMARK */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-30deg] select-none">
               <span className="text-[100px] md:text-[120px] font-black text-slate-900 tracking-tighter">PAID</span>
             </div>

             {/* RECEIPT HEADER */}
             <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-6 relative z-10">
                <div>
                  <h1 className="text-2xl font-black text-[#ff3f7a] tracking-tighter">LumeBiz<span className="text-slate-900">.</span></h1>
                  <p className="text-[10px] md:text-xs font-medium text-slate-500 mt-1">Fast & Secure Business Registrations</p>
                </div>
                <div className="text-right">
                  <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-widest">Receipt</h2>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">#{reference}</p>
                </div>
             </div>

             {/* CUSTOMER & DATE INFO */}
             <div className="flex flex-col gap-4 mb-6 relative z-10">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Billed To / Entity</p>
                  <p className="font-bold text-sm md:text-base text-slate-900 leading-tight">{businessName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Paid</p>
                  <p className="font-bold text-sm text-slate-900">{date}</p>
                </div>
             </div>

             {/* ITEM TABLE */}
             <div className="mb-6 relative z-10">
               <div className="flex justify-between border-b-2 border-slate-900 pb-2 mb-3">
                 <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Description</p>
                 <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Amount</p>
               </div>
               
               <div className="flex justify-between items-center py-3 border-b border-slate-100">
                 <div className="pr-4">
                   <p className="font-bold text-sm text-slate-800 leading-tight">Business Name Registration</p>
                   <p className="text-[10px] font-medium text-slate-500 mt-1">Official CAC Fee & Processing</p>
                 </div>
                 <p className="font-black text-sm md:text-base text-slate-900 whitespace-nowrap">₦{amount.toLocaleString()}</p>
               </div>
             </div>

             {/* TOTALS */}
             <div className="flex justify-end relative z-10 mb-8">
               <div className="w-[180px]">
                 <div className="flex justify-between py-2 border-b border-slate-100">
                   <p className="font-bold text-xs text-slate-500">Subtotal</p>
                   <p className="font-bold text-xs text-slate-900">₦{amount.toLocaleString()}</p>
                 </div>
                 <div className="flex justify-between py-3 border-b-4 border-[#ff3f7a]">
                   <p className="text-sm font-black text-slate-900 uppercase">Total</p>
                   <p className="text-base font-black text-[#ff3f7a]">₦{amount.toLocaleString()}</p>
                 </div>
               </div>
             </div>

             {/* FOOTER */}
             <div className="text-center relative z-10 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle weight="fill" className="text-emerald-500 h-4 w-4" />
                  <span className="font-bold text-slate-700 text-xs">Payment Verified</span>
                </div>
                <p className="text-[9px] font-medium text-slate-400">Thank you for choosing LumeBiz. Support: hello@lumebiz.com</p>
             </div>

          </div>
        </div>

        {/* ACTION FOOTER */}
        <div className="px-5 py-4 bg-white border-t border-slate-200 flex justify-end shrink-0">
          <Button 
            onClick={handleDownloadPDF} 
            disabled={isDownloading}
            className="w-full md:w-auto h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md flex items-center justify-center"
          >
            {isDownloading ? "Saving..." : <><DownloadSimple weight="bold" className="mr-2 h-5 w-5" /> Download PDF</>}
          </Button>
        </div>

      </div>
    </div>
  );
}
