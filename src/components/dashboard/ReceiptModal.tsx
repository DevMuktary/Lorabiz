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
      // 1. Take a snapshot. We ignore custom CSS to bypass the Tailwind v4 "lab" error
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });

      // 2. Convert to JPEG (Faster and uses less memory on mobile)
      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      // 3. Create A4 PDF with proper margins
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const margin = 10; 
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
    // Clicking the dark background will trigger onClose
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#000000]/80 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose} 
    >
      <div 
        className="bg-[#f1f5f9] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()} // Prevents clicks inside the modal from closing it
      >
        
        {/* MODAL HEADER (Always visible) */}
        <div className="px-5 py-4 border-b border-[#e2e8f0] flex justify-between items-center bg-[#ffffff] shrink-0 z-50">
          <h3 className="font-black text-lg text-[#0f172a]">Transaction Receipt</h3>
          <button 
            onClick={onClose} 
            disabled={isDownloading} 
            className="p-2 hover:bg-[#f1f5f9] bg-[#f8fafc] rounded-full text-[#0f172a] transition-colors disabled:opacity-50 cursor-pointer border border-[#e2e8f0]"
          >
            <X weight="bold" size={20} />
          </button>
        </div>

        {/* RECEIPT CANVAS SCROLLABLE AREA */}
        <div className="p-4 md:p-8 flex justify-center overflow-y-auto custom-scrollbar">
          
          {/* THE ACTUAL RECEIPT DIV (Using STRICT HEX CODES to prevent html2canvas crashes) */}
          <div 
            ref={receiptRef} 
            className="bg-[#ffffff] w-full max-w-[450px] mx-auto p-6 md:p-8 relative overflow-hidden shadow-sm border border-[#e2e8f0] rounded-lg"
          >
             {/* FADED WATERMARK */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-30deg] select-none">
               <span className="text-[100px] md:text-[120px] font-black text-[#0f172a] tracking-tighter">PAID</span>
             </div>

             {/* RECEIPT HEADER */}
             <div className="flex justify-between items-start mb-6 border-b border-[#f1f5f9] pb-6 relative z-10">
                <div>
                  <h1 className="text-2xl font-black text-[#ff3f7a] tracking-tighter">LumeBiz<span className="text-[#0f172a]">.</span></h1>
                  <p className="text-[10px] md:text-xs font-medium text-[#64748b] mt-1">Fast & Secure Business Registrations</p>
                </div>
                <div className="text-right">
                  <h2 className="text-lg md:text-xl font-black text-[#1e293b] uppercase tracking-widest">Receipt</h2>
                  <p className="text-[10px] font-bold text-[#94a3b8] mt-1">#{reference}</p>
                </div>
             </div>

             {/* CUSTOMER & DATE INFO */}
             <div className="flex flex-col gap-4 mb-6 relative z-10">
                <div>
                  <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-1">Entity Name</p>
                  <p className="font-bold text-sm md:text-base text-[#0f172a] leading-tight">{businessName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-1">Date</p>
                  <p className="font-bold text-sm text-[#0f172a]">{date}</p>
                </div>
             </div>

             {/* ITEM TABLE */}
             <div className="mb-6 relative z-10">
               <div className="flex justify-between border-b-2 border-[#0f172a] pb-2 mb-3">
                 <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">Description</p>
                 <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">Amount</p>
               </div>
               
               <div className="flex justify-between items-center py-3 border-b border-[#f1f5f9]">
                 <div className="pr-4">
                   {/* DYNAMIC SERVICE NAME EXACTLY AS REQUESTED */}
                   <p className="font-bold text-sm text-[#1e293b] leading-tight">
                     Processing Fee and {serviceName} Registration
                   </p>
                 </div>
                 <p className="font-black text-sm md:text-base text-[#0f172a] whitespace-nowrap">₦{amount.toLocaleString()}</p>
               </div>
             </div>

             {/* TOTALS */}
             <div className="flex justify-end relative z-10 mb-8">
               <div className="w-[180px]">
                 <div className="flex justify-between py-3 border-t-2 border-b-4 border-t-[#e2e8f0] border-b-[#ff3f7a]">
                   <p className="text-sm font-black text-[#0f172a] uppercase">Total</p>
                   <p className="text-base font-black text-[#ff3f7a]">₦{amount.toLocaleString()}</p>
                 </div>
               </div>
             </div>

             {/* FOOTER */}
             <div className="text-center relative z-10 bg-[#f8fafc] p-3 rounded-lg border border-[#f1f5f9]">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle weight="fill" color="#10b981" className="h-4 w-4" />
                  <span className="font-bold text-[#334155] text-xs">Payment Verified</span>
                </div>
                <p className="text-[9px] font-medium text-[#94a3b8]">Thank you for choosing LumeBiz. Support: hello@lumebiz.com</p>
             </div>

          </div>
        </div>

        {/* ACTION FOOTER */}
        <div className="px-5 py-4 bg-[#ffffff] border-t border-[#e2e8f0] flex justify-end shrink-0 z-50">
          <Button 
            onClick={handleDownloadPDF} 
            disabled={isDownloading}
            className="w-full md:w-auto h-12 px-8 bg-[#0f172a] hover:bg-[#1e293b] text-[#ffffff] font-bold rounded-xl shadow-md flex items-center justify-center"
          >
            {isDownloading ? "Processing..." : <><DownloadSimple weight="bold" className="mr-2 h-5 w-5" /> Download PDF</>}
          </Button>
        </div>

      </div>
    </div>
  );
}
