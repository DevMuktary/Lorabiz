"use client";

import { useState } from "react";
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

export default function ReceiptModal({ serviceName = "Business Name", businessName, reference, date, amount, onClose }: ReceiptModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  // NATIVE VECTOR PDF GENERATOR (Crash-proof, ignores Tailwind v4 completely)
  const handleDownloadPDF = () => {
    setIsDownloading(true);
    
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // 1. Watermark (Faded 'PAID' in the background)
      doc.setTextColor(241, 245, 249); // Ultra light slate
      doc.setFontSize(100);
      doc.setFont("helvetica", "bold");
      doc.text("PAID", 40, 150, { angle: 45 });

      // 2. Header
      doc.setTextColor(255, 63, 122); // #ff3f7a (LumeBiz Pink)
      doc.setFontSize(28);
      doc.text("LumeBiz.", 20, 30);

      doc.setTextColor(100, 116, 139); // Slate 500
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Fast & Secure Business Registrations", 20, 37);

      doc.setTextColor(30, 41, 59); // Slate 800
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("RECEIPT", 150, 30);

      doc.setTextColor(148, 163, 184); // Slate 400
      doc.setFontSize(10);
      doc.text(`#${reference}`, 150, 37);

      // 3. Top Divider
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.5);
      doc.line(20, 45, 190, 45);

      // 4. Customer & Date Info
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "bold");
      doc.text("ENTITY NAME", 20, 60);
      doc.text("DATE", 150, 60);

      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text(businessName, 20, 67);
      doc.text(date, 150, 67);

      // 5. Table Header
      doc.setDrawColor(15, 23, 42);
      doc.line(20, 85, 190, 85);

      doc.setFontSize(9);
      doc.text("DESCRIPTION", 20, 82);
      doc.text("AMOUNT", 160, 82);

      // 6. Table Body
      doc.setDrawColor(241, 245, 249);
      doc.line(20, 105, 190, 105);

      doc.setFontSize(12);
      doc.text(`Processing Fee and ${serviceName} Registration`, 20, 95);
      doc.text(`NGN ${amount.toLocaleString()}`, 160, 95);

      // 7. Totals Area
      doc.setDrawColor(226, 232, 240);
      doc.line(110, 120, 190, 120);
      
      doc.setDrawColor(255, 63, 122);
      doc.setLineWidth(1);
      doc.line(110, 135, 190, 135);

      doc.setFontSize(14);
      doc.text("TOTAL", 110, 130);
      doc.setTextColor(255, 63, 122);
      doc.text(`NGN ${amount.toLocaleString()}`, 160, 130);

      // 8. Footer
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Payment Verified Successfully", 105, 250, { align: "center" });
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Thank you for choosing LumeBiz. Support: hello@lumebiz.com", 105, 256, { align: "center" });

      // Save the native PDF
      doc.save(`LumeBiz_Receipt_${reference}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#000000]/80 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose} 
    >
      <div 
        className="bg-[#f1f5f9] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()} 
      >
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

        <div className="p-4 md:p-8 flex justify-center overflow-y-auto custom-scrollbar">
          {/* This is just a visual HTML preview for the user. It is NOT what gets downloaded. */}
          <div className="bg-[#ffffff] w-full max-w-[450px] mx-auto p-6 md:p-8 relative overflow-hidden shadow-sm border border-[#e2e8f0] rounded-lg">
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none rotate-[-30deg] select-none">
               <span className="text-[100px] md:text-[120px] font-black tracking-tighter" style={{ color: "rgba(15, 23, 42, 0.03)" }}>PAID</span>
             </div>

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

             <div className="flex justify-end relative z-10 mb-8">
               <div className="w-[180px]">
                 <div className="flex justify-between py-3" style={{ borderTopColor: "#e2e8f0", borderTopWidth: "2px", borderTopStyle: "solid", borderBottomColor: "#ff3f7a", borderBottomWidth: "4px", borderBottomStyle: "solid" }}>
                   <p className="text-sm font-black uppercase" style={{ color: "#0f172a" }}>Total</p>
                   <p className="text-base font-black" style={{ color: "#ff3f7a" }}>₦{amount.toLocaleString()}</p>
                 </div>
               </div>
             </div>

             <div className="text-center relative z-10 p-3 rounded-lg" style={{ backgroundColor: "#f8fafc", borderColor: "#f1f5f9", borderWidth: "1px", borderStyle: "solid" }}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle weight="fill" color="#10b981" className="h-4 w-4" />
                  <span className="font-bold text-xs" style={{ color: "#334155" }}>Payment Verified</span>
                </div>
                <p className="text-[9px] font-medium" style={{ color: "#94a3b8" }}>Thank you for choosing LumeBiz. Support: hello@lumebiz.com</p>
             </div>
          </div>
        </div>

        <div className="px-5 py-4 bg-[#ffffff] border-t border-[#e2e8f0] flex justify-end shrink-0 z-50">
          <Button 
            onClick={handleDownloadPDF} 
            disabled={isDownloading}
            className="w-full md:w-auto h-12 px-8 bg-[#0f172a] hover:bg-[#1e293b] text-[#ffffff] font-bold rounded-xl shadow-md flex items-center justify-center"
          >
            {isDownloading ? "Generating..." : <><DownloadSimple weight="bold" className="mr-2 h-5 w-5" /> Download PDF</>}
          </Button>
        </div>

      </div>
    </div>
  );
}
