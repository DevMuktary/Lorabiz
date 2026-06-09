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
      // 1. Take a high-quality snapshot of the receipt div
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // Increases quality/sharpness
        useCORS: true,
        backgroundColor: "#ffffff"
      });

      // 2. Convert to an image
      const imgData = canvas.toDataURL("image/png");

      // 3. Create an A4 PDF and size the image perfectly to fit
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      
      // 4. Trigger the download
      pdf.save(`LumeBiz_Receipt_${reference}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to download receipt. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300 overflow-y-auto">
      
      <div className="bg-slate-100 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 relative">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-black text-lg text-slate-900">Transaction Receipt</h3>
          <button onClick={onClose} disabled={isDownloading} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors disabled:opacity-50">
            <X weight="bold" />
          </button>
        </div>

        {/* RECEIPT CANVAS (This exact div is what gets converted to PDF) */}
        <div className="p-6 md:p-10 flex justify-center overflow-x-auto">
          <div 
            ref={receiptRef} 
            className="bg-white w-full max-w-[600px] p-8 md:p-12 relative overflow-hidden shadow-sm border border-slate-200"
            style={{ minHeight: '700px' }} // Ensures a nice A4-like proportion
          >
             {/* FADED WATERMARK */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-30deg] select-none">
               <span className="text-[150px] font-black text-slate-900 tracking-tighter">PAID</span>
             </div>

             {/* RECEIPT HEADER */}
             <div className="flex justify-between items-start mb-12 border-b border-slate-100 pb-8 relative z-10">
                <div>
                  <h1 className="text-3xl font-black text-[#ff3f7a] tracking-tighter">LumeBiz<span className="text-slate-900">.</span></h1>
                  <p className="text-sm font-medium text-slate-500 mt-1">Fast & Secure Business Registrations</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Receipt</h2>
                  <p className="text-sm font-bold text-slate-400 mt-1"># {reference}</p>
                </div>
             </div>

             {/* CUSTOMER & DATE INFO */}
             <div className="flex justify-between mb-12 relative z-10">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Billed To / Entity</p>
                  <p className="font-bold text-lg text-slate-900">{businessName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Paid</p>
                  <p className="font-bold text-slate-900">{date}</p>
                </div>
             </div>

             {/* ITEM TABLE */}
             <div className="mb-12 relative z-10">
               <div className="flex justify-between border-b-2 border-slate-900 pb-3 mb-4">
                 <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Description</p>
                 <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Amount</p>
               </div>
               
               <div className="flex justify-between items-center py-4 border-b border-slate-100">
                 <div>
                   <p className="font-bold text-slate-800">Business Name Registration</p>
                   <p className="text-xs font-medium text-slate-500 mt-1">Official CAC Fee & Agency Processing</p>
                 </div>
                 <p className="font-black text-slate-900">₦{amount.toLocaleString()}</p>
               </div>
             </div>

             {/* TOTALS */}
             <div className="flex justify-end relative z-10 mb-16">
               <div className="w-1/2">
                 <div className="flex justify-between py-3 border-b border-slate-100">
                   <p className="font-bold text-slate-500">Subtotal</p>
                   <p className="font-bold text-slate-900">₦{amount.toLocaleString()}</p>
                 </div>
                 <div className="flex justify-between py-4 border-b-4 border-[#ff3f7a]">
                   <p className="text-lg font-black text-slate-900 uppercase">Total Paid</p>
                   <p className="text-xl font-black text-[#ff3f7a]">₦{amount.toLocaleString()}</p>
                 </div>
               </div>
             </div>

             {/* FOOTER */}
             <div className="text-center mt-auto relative z-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle weight="fill" className="text-emerald-500 h-5 w-5" />
                  <span className="font-bold text-slate-700 text-sm">Payment Successful & Verified</span>
                </div>
                <p className="text-xs font-medium text-slate-400">Thank you for choosing LumeBiz. For support, contact hello@lumebiz.com.</p>
             </div>

          </div>
        </div>

        {/* ACTION FOOTER */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end sticky bottom-0 z-10">
          <Button 
            onClick={handleDownloadPDF} 
            disabled={isDownloading}
            className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md flex items-center"
          >
            {isDownloading ? "Generating PDF..." : <><DownloadSimple weight="bold" className="mr-2 h-5 w-5" /> Download PDF</>}
          </Button>
        </div>

      </div>
    </div>
  );
}
