"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import { X, DownloadSimple, CheckCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ReceiptModalProps {
  reg: any; // We now accept the entire registration object
  onClose: () => void;
}

export default function ReceiptModal({ reg, onClose }: ReceiptModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!reg) return null;

  // Extract variables safely from the registration object
  const businessName = reg.proposedName || "Unnamed Registration";
  const reference = reg.transactionRef || `SRV_${reg.id.slice(0,8).toUpperCase()}`;
  const date = new Date(reg.updatedAt).toLocaleDateString();
  const safeAmount = Number(reg.amountPaid) || 0;
  const formattedAmount = safeAmount.toLocaleString();
  
  // Determine the service name based on our backend _appType
  let serviceName = "Business";
  if (reg._appType === "BUSINESS_NAME") serviceName = "Business Name";
  if (reg._appType === "LLC") serviceName = "Company (LLC)";
  if (reg._appType === "NGO") serviceName = "Incorporated Trustees";

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // Watermark
      doc.setTextColor(241, 245, 249);
      doc.setFontSize(100);
      doc.setFont("helvetica", "bold");
      doc.text("PAID", 40, 150, { angle: 45 });

      // Header
      doc.setTextColor(199, 45, 118); // #c72d76
      doc.setFontSize(28);
      doc.text("Lorabiz.", 20, 30);

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Fast & Secure Business Registrations", 20, 37);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      // Align Right
      doc.text("RECEIPT", 190, 30, { align: "right" });

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(10);
      doc.text(`#${reference}`, 190, 37, { align: "right" });

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(20, 45, 190, 45);

      // Customer Info
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "bold");
      doc.text("ENTITY NAME", 20, 60);
      doc.text("DATE", 190, 60, { align: "right" });

      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(businessName, 20, 67);
      doc.text(date, 190, 67, { align: "right" });

      // Table Header
      doc.setDrawColor(15, 23, 42);
      doc.line(20, 85, 190, 85);
      doc.setFontSize(9);
      doc.text("DESCRIPTION", 20, 82);
      doc.text("AMOUNT", 190, 82, { align: "right" });

      // Table Body
      doc.setDrawColor(241, 245, 249);
      doc.line(20, 105, 190, 105);
      doc.setFontSize(12);
      doc.text(`Processing Fee and ${serviceName} Registration`, 20, 95);
      doc.text(`NGN ${formattedAmount}`, 190, 95, { align: "right" });

      // Totals
      doc.setDrawColor(226, 232, 240);
      doc.line(110, 120, 190, 120);
      doc.setDrawColor(199, 45, 118); // #c72d76
      doc.setLineWidth(1);
      doc.line(110, 135, 190, 135);

      doc.setFontSize(14);
      doc.text("TOTAL", 110, 130);
      doc.setTextColor(199, 45, 118); // #c72d76
      doc.text(`NGN ${formattedAmount}`, 190, 130, { align: "right" });

      // Footer
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Payment Verified Successfully", 105, 250, { align: "center" });
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Thank you for choosing Lorabiz. Support: hello@lorabiz.com", 105, 256, { align: "center" });

      doc.save(`Lorabiz_Receipt_${reference}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#000000]/80 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-[#f1f5f9] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        <div className="px-5 py-4 border-b border-[#e2e8f0] flex justify-between items-center bg-[#ffffff] shrink-0 z-50">
          <h3 className="font-black text-lg text-[#0f172a]">Transaction Receipt</h3>
          <button onClick={onClose} disabled={isDownloading} className="p-2 hover:bg-[#f1f5f9] bg-[#f8fafc] rounded-full text-[#0f172a] transition-colors disabled:opacity-50 cursor-pointer border border-[#e2e8f0]">
            <X weight="bold" size={20} />
          </button>
        </div>

        <div className="p-4 md:p-8 flex justify-center overflow-y-auto custom-scrollbar">
          <div className="bg-[#ffffff] w-full max-w-[450px] mx-auto p-6 md:p-8 relative overflow-hidden shadow-sm border border-[#e2e8f0] rounded-lg">
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none rotate-[-30deg] select-none">
               <span className="text-[100px] md:text-[120px] font-black tracking-tighter" style={{ color: "rgba(15, 23, 42, 0.03)" }}>PAID</span>
             </div>

             <div className="flex justify-between items-start mb-6 pb-6 relative z-10" style={{ borderBottomColor: "#f1f5f9", borderBottomWidth: "1px", borderBottomStyle: "solid" }}>
                <div>
                  <h1 className="text-2xl font-black tracking-tighter" style={{ color: "#c72d76" }}>Lorabiz<span style={{ color: "#0f172a" }}>.</span></h1>
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
                   <p className="font-bold text-sm leading-tight" style={{ color: "#1e293b" }}>Processing Fee and {serviceName} Registration</p>
                 </div>
                 <p className="font-black text-sm md:text-base whitespace-nowrap" style={{ color: "#0f172a" }}>₦{formattedAmount}</p>
               </div>
             </div>

             <div className="flex justify-end relative z-10 mb-8">
               <div className="w-[180px]">
                 <div className="flex justify-between py-3" style={{ borderTopColor: "#e2e8f0", borderTopWidth: "2px", borderTopStyle: "solid", borderBottomColor: "#c72d76", borderBottomWidth: "4px", borderBottomStyle: "solid" }}>
                   <p className="text-sm font-black uppercase" style={{ color: "#0f172a" }}>Total</p>
                   <p className="text-base font-black" style={{ color: "#c72d76" }}>₦{formattedAmount}</p>
                 </div>
               </div>
             </div>

             <div className="text-center relative z-10 p-3 rounded-lg" style={{ backgroundColor: "#f8fafc", borderColor: "#f1f5f9", borderWidth: "1px", borderStyle: "solid" }}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle weight="fill" color="#10b981" className="h-4 w-4" />
                  <span className="font-bold text-xs" style={{ color: "#334155" }}>Payment Verified</span>
                </div>
                <p className="text-[9px] font-medium" style={{ color: "#94a3b8" }}>Thank you for choosing Lorabiz. Support: hello@lorabiz.com</p>
             </div>
          </div>
        </div>

        <div className="px-5 py-4 bg-[#ffffff] border-t border-[#e2e8f0] flex justify-end shrink-0 z-50">
          <Button onClick={handleDownloadPDF} disabled={isDownloading} className="w-full md:w-auto h-12 px-8 bg-[#0f172a] hover:bg-[#1e293b] text-[#ffffff] font-bold rounded-xl shadow-md flex items-center justify-center cursor-pointer">
            {isDownloading ? "Generating..." : <><DownloadSimple weight="bold" className="mr-2 h-5 w-5" /> Download PDF</>}
          </Button>
        </div>

      </div>
    </div>
  );
}
