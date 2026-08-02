"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import { 
  X, CheckCircle, FileText, UserPlus, File, Briefcase, Building2, Download
} from 'lucide-react';
import { TabButton } from './CacShared';

// Imported modular tabs
import CacInfoTab from './CacInfoTab';
import CacPeopleTab from './CacPeopleTab';
import CacDocsTab from './CacDocsTab';
import CacActionTab from './CacActionTab';

export default function ApplicationDrawer({ 
  ticket, 
  staffList, 
  onClose, 
  onUpdateSuccess 
}: { 
  ticket: any | null, 
  staffList: any[],
  onClose: () => void,
  onUpdateSuccess: () => void
}) {
  const [activeTab, setActiveTab] = useState("INFO"); // INFO, PEOPLE, DOCS, ACTION

  if (!ticket) return null;

  const isLlc = ticket.type === "LLC";
  const statusColor = 
    ticket.status === "APPROVED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
    ticket.status === "QUERIED" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" :
    ticket.status === "FAILED" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" :
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

  // =======================================================================
  // PDF EXPORT LOGIC
  // =======================================================================
  const handleExportPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;
    const margin = 20;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;

    // Helper: Add new page if text exceeds boundaries
    const checkPageBreak = (neededHeight = lineHeight) => {
      if (yPos + neededHeight >= pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
    };

    // Helper: Add section headers
    const addHeader = (text: string, isMain = false) => {
      checkPageBreak(15);
      yPos += 5;
      doc.setFontSize(isMain ? 14 : 12);
      doc.setFont("helvetica", "bold");
      doc.text(text, margin, yPos);
      yPos += lineHeight + 2;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
    };

    // Helper: Add Field Key-Value pair
    const addField = (label: string, value: any, isLink = false) => {
      if (value === undefined || value === null || value === "") return;
      
      checkPageBreak();
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin, yPos);
      doc.setFont("helvetica", "normal");
      
      const textX = margin + 45;
      const maxLineWidth = doc.internal.pageSize.width - margin - textX;
      
      if (isLink) {
         doc.setTextColor(37, 99, 235); // Classic Link Blue
         doc.textWithLink("Click to View / Download File", textX, yPos, { url: String(value) });
         doc.setTextColor(0, 0, 0); // Reset to black
         yPos += lineHeight;
      } else {
         const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
         const lines = doc.splitTextToSize(strValue, maxLineWidth);
         doc.text(lines, textX, yPos);
         yPos += (lines.length * lineHeight);
      }
    };

    // Helper: Safely parse nested JSON addresses
    const formatAddress = (addr: any) => {
      if (!addr) return null;
      let parsed = addr;
      if (typeof addr === 'string') {
        try { parsed = JSON.parse(addr); } catch (e) { return addr; }
      }
      if (typeof parsed === 'object') {
         const parts = [parsed.streetNo, parsed.streetNumber, parsed.streetName, parsed.street, parsed.city, parsed.lga, parsed.state, parsed.country].filter(Boolean);
         return parts.join(', ');
      }
      return addr;
    };

    // 1. Title Block
    addHeader(`Lorabiz Application Export - Ref: ${ticket.trackingId}`, true);
    
    // 2. Core Metadata
    addField("Application Type", isLlc ? "LLC Formation" : "Business Name");
    addField("Status", ticket.status);
    addField("Client Name", ticket.clientName);
    addField("Client Email", ticket.clientEmail);
    addField("Date Submitted", format(new Date(ticket.createdAt), "PPP 'at' p"));

    // 3. Business Details
    addHeader("Entity Details");
    addField("Proposed Name", ticket.proposedName);
    addField("Alternative Name 1", ticket.altName1);
    addField("Alternative Name 2", ticket.altName2);
    
    if (!isLlc) {
       addField("Ownership Type", ticket.ownershipType);
       addField("Entity Type", ticket.entityType);
       addField("Category", ticket.category);
       addField("Nature of Business", ticket.specificNature);
       addField("Company Email", ticket.companyEmail);
       const bnAddr = [ticket.companyStreetNo, ticket.companyAddress, ticket.companyCity, ticket.companyState].filter(Boolean).join(', ');
       addField("Company Address", bnAddr);
    } else {
       addField("Principal Activity", ticket.principalActivity);
       addField("Specific Activity", ticket.specificActivity);
       addField("Description", ticket.description);
       addField("Company Email", ticket.email);
       addField("Registered Address", formatAddress(ticket.registeredAddress));
       addField("Head Office Address", formatAddress(ticket.headOfficeAddress));
       addField("Total Share Capital", ticket.totalShareCapital);
    }

    // 4. Personnel Details (Loop through Proprietors/Officers)
    if (ticket.people && ticket.people.length > 0) {
       addHeader(isLlc ? "Officers & Shareholders" : "Proprietors", true);
       
       ticket.people.forEach((person: any, idx: number) => {
          addHeader(`Person ${idx + 1}: ${person.firstName} ${person.surname || person.lastName || ''}`);
          addField("Roles", person.roles ? person.roles.join(', ') : 'Proprietor');
          addField("Email", person.email);
          addField("Phone", person.phone);
          addField("Gender", person.gender);
          addField("Date of Birth", person.dob);
          addField("Nationality", person.nationality);
          if (person.occupation) addField("Occupation", person.occupation);
          addField("ID Type", person.idType || "NIN");
          addField("ID Number", person.idNumber || person.nin);
          
          const personAddr = formatAddress(person.residentialAddress) || formatAddress(person.serviceAddress) || [person.streetNo, person.street, person.city, person.lga, person.state].filter(Boolean).join(', ');
          addField("Address", personAddr);

          // Document Links
          addField("ID Document / NIN", person.idDocumentUrl || person.ninUrl, true);
          addField("Passport Photo", person.passportUrl, true);
          addField("Signature", person.signatureUrl, true);
       });
    }

    // Execute Download
    const cleanFileName = ticket.proposedName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`${ticket.trackingId}_${cleanFileName}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans">
      <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl h-full bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header Ribbon */}
        <div className="px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-white dark:bg-zinc-900 shrink-0 shadow-sm z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-1 text-xs font-black uppercase tracking-widest rounded-md ${statusColor}`}>
                {ticket.status}
              </span>
              <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700">
                Ref: {ticket.trackingId}
              </span>
              {isLlc ? (
                <span className="flex items-center text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 px-2 py-1 rounded">
                  <Building2 size={12} className="mr-1.5" /> LLC Formation
                </span>
              ) : (
                <span className="flex items-center text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 px-2 py-1 rounded">
                  <Briefcase size={12} className="mr-1.5" /> Business Name
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{ticket.proposedName}</h2>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">Submitted: {format(new Date(ticket.createdAt), "PPP 'at' p")}</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* NEW EXPORT BUTTON */}
            <button 
              onClick={handleExportPDF}
              title="Download Application Details as PDF"
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Download size={16} /> <span className="hidden sm:inline">Export Form</span>
            </button>
            
            <button 
              onClick={onClose} 
              className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-8 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 overflow-x-auto scrollbar-hide z-10 shadow-sm">
          <TabButton active={activeTab === "INFO"} onClick={() => setActiveTab("INFO")} label="Application Info" icon={<FileText size={16} />} />
          <TabButton active={activeTab === "PEOPLE"} onClick={() => setActiveTab("PEOPLE")} label="Personnel & Roles" icon={<UserPlus size={16} />} />
          <TabButton active={activeTab === "DOCS"} onClick={() => setActiveTab("DOCS")} label="Client Documents" icon={<File size={16} />} />
          <TabButton active={activeTab === "ACTION"} onClick={() => setActiveTab("ACTION")} label="Admin Action Hub" icon={<CheckCircle size={16} />} alert={ticket.status === "PENDING"} />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {activeTab === "INFO" && (
             <CacInfoTab ticket={ticket} isLlc={isLlc} />
          )}

          {activeTab === "PEOPLE" && (
             <CacPeopleTab ticket={ticket} isLlc={isLlc} />
          )}

          {activeTab === "DOCS" && (
             <CacDocsTab ticket={ticket} isLlc={isLlc} />
          )}

          {activeTab === "ACTION" && (
             <CacActionTab ticket={ticket} staffList={staffList} onUpdateSuccess={onUpdateSuccess} />
          )}

        </div>
      </div>
    </div>
  );
}
