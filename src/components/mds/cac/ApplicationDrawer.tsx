"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import { 
  X, CheckCircle, FileText, UserPlus, File, Briefcase, Building2, Download
} from 'lucide-react';
import { TabButton } from './CacShared';

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
  const [activeTab, setActiveTab] = useState("INFO");

  if (!ticket) return null;

  const isLlc = ticket.type === "LLC";
  const statusColor = 
    ticket.status === "APPROVED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
    ticket.status === "QUERIED" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" :
    ticket.status === "FAILED" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" :
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

  // =======================================================================
  // HYPER-DETAILED PDF EXPORT LOGIC
  // =======================================================================
  const handleExportPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;
    const margin = 15;
    const lineHeight = 6;
    const pageHeight = doc.internal.pageSize.height;

    const checkPageBreak = (neededHeight = lineHeight) => {
      if (yPos + neededHeight >= pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
    };

    const addHeader = (text: string, isMain = false) => {
      checkPageBreak(12);
      yPos += 6;
      doc.setFontSize(isMain ? 13 : 11);
      doc.setFont("helvetica", "bold");
      doc.text(text, margin, yPos);
      yPos += lineHeight + 1;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
    };

    const addField = (label: string, value: any, isLink = false) => {
      if (value === undefined || value === null || value === "") return;
      checkPageBreak();
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin, yPos);
      doc.setFont("helvetica", "normal");
      
      const textX = margin + 55;
      const maxLineWidth = doc.internal.pageSize.width - margin - textX;
      
      if (isLink) {
         doc.setTextColor(37, 99, 235);
         doc.textWithLink("View/Download File", textX, yPos, { url: String(value) });
         doc.setTextColor(0, 0, 0);
         yPos += lineHeight;
      } else {
         const strValue = String(value);
         const lines = doc.splitTextToSize(strValue, maxLineWidth);
         doc.text(lines, textX, yPos);
         yPos += (lines.length * lineHeight);
      }
    };

    // ==========================================
    // THE FIX: Recursive Object Unroller
    // ==========================================
    const printJsonObject = (title: string, obj: any) => {
      if (!obj) return;
      let parsed = obj;
      if (typeof obj === 'string') {
        try { parsed = JSON.parse(obj); } catch (e) { return; }
      }
      
      // If it parsed into a primitive, just print it directly
      if (typeof parsed !== 'object') {
        addField(title, parsed);
        return;
      }
      
      if (Object.keys(parsed).length === 0) return;
      
      addHeader(`--- ${title} ---`);

      // Recursive dive function
      const traverseAndPrint = (prefix: string, node: any) => {
        if (node === null || node === undefined || node === "") return;
        
        if (Array.isArray(node)) {
          // It's an Array (e.g. Multiple Share Classes)
          node.forEach((item, index) => {
            const newPrefix = prefix ? `${prefix} (Item ${index + 1})` : `Item ${index + 1}`;
            traverseAndPrint(newPrefix, item);
          });
        } else if (typeof node === 'object') {
          // It's an Object (e.g. { units: 100, class: 'Ordinary' })
          Object.entries(node).forEach(([k, v]) => {
            // Convert camelCase to Spaced Words
            const formattedKey = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const newPrefix = prefix ? `${prefix} - ${formattedKey}` : formattedKey;
            traverseAndPrint(newPrefix, v);
          });
        } else {
          // It is finally a flat value (String, Number, Boolean)
          addField(prefix, node);
        }
      };

      traverseAndPrint("", parsed);
    };
    // ==========================================

    // 1. Core Metadata
    addHeader(`LORABIZ FULL APPLICATION RECORD - REF: ${ticket.trackingId}`, true);
    addField("Service Type", isLlc ? "LLC Formation (Adopted Articles)" : "Business Name Registration");
    addField("System Status", ticket.status);
    addField("Client Name", ticket.clientName);
    addField("Client Email", ticket.clientEmail);
    addField("Timestamp", format(new Date(ticket.createdAt), "PPP 'at' p"));

    // 2. Exact Business Details
    addHeader("NAME & BUSINESS DETAILS", true);
    addField("Proposed Name 1", ticket.proposedName);
    addField("Alternative Name 1", ticket.altName1);
    addField("Alternative Name 2", ticket.altName2);
    
    if (!isLlc) {
       addField("Ownership Type", ticket.ownershipType);
       addField("Entity Type", ticket.entityType);
       addField("General Category", ticket.category);
       addField("Business Type", ticket.businessType);
       addField("Specific Nature of Business", ticket.specificNature);
       addField("Company Email", ticket.companyEmail);
       addField("Commencement Date", ticket.commencementDate);
       
       addHeader("--- Business Address ---");
       addField("State", ticket.companyState);
       addField("City/Town", ticket.companyCity);
       addField("Street Number", ticket.companyStreetNo);
       addField("Street Name", ticket.companyAddress);
    } else {
       addField("Company Email", ticket.email);
       addField("Principal Activity", ticket.principalActivity);
       addField("Specific Activity", ticket.specificActivity);
       addField("Full Description", ticket.description);
       addField("Company Type", ticket.companyType);
       addField("Total Share Capital", ticket.totalShareCapital);
       addField("Articles of Association", ticket.useDefaultArticles ? "Adopted Auto/Default Articles" : "Standard");
       
       printJsonObject("Registered Office Address", ticket.registeredAddress);
       printJsonObject("Head Office Address", ticket.headOfficeAddress);
       
       // This will now perfectly unroll all Share arrays without errors
       printJsonObject("Share Classes Breakdown", ticket.shareClasses);
       
       if (ticket.memorandumObjects && Array.isArray(ticket.memorandumObjects)) {
         addHeader("--- Memorandum Objects ---");
         ticket.memorandumObjects.forEach((obj: string, i: number) => {
           addField(`Object ${i + 1}`, obj);
         });
       }

       printJsonObject("Witness Details", ticket.witnessDetails);
       printJsonObject("Declarant Details", ticket.declarantDetails);
    }

    // 3. Personnel / People Loop
    if (ticket.people && ticket.people.length > 0) {
       addHeader(isLlc ? "COMPANY OFFICERS & SHAREHOLDERS" : "PROPRIETOR DETAILS", true);
       
       ticket.people.forEach((person: any, idx: number) => {
          const personName = `${person.surname || ''} ${person.firstName || ''} ${person.otherName || ''}`.trim();
          addHeader(`PERSON ${idx + 1}: ${personName}`);
          
          if (person.roles) addField("Assigned Roles", person.roles.join(', '));
          
          addField("Surname", person.surname);
          addField("First Name", person.firstName);
          addField("Other Name", person.otherName);
          addField("Email Address", person.email);
          addField("Phone Code", person.phoneCode);
          addField("Phone Number", person.phone);
          addField("Gender", person.gender);
          addField("Date of Birth", person.dob);
          addField("Nationality", person.nationality);
          addField("Former Name", person.formerName);
          addField("Former Nationality", person.formerNationality);
          addField("Occupation", person.occupation);
          
          addField("Identification Type", person.idType || "NIN");
          addField("Identification Number", person.idNumber || person.nin);
          addField("Tax Residency", person.taxResidency);
          addField("TIN", person.tin);

          if (isLlc) {
             if (person.sharesAllotted) addField("Shares Allotted", person.sharesAllotted);
             // These will also successfully unpack
             printJsonObject("Residential Address", person.residentialAddress);
             printJsonObject("Service Address", person.serviceAddress);
             printJsonObject("PSC Details", person.pscDetails);
          } else {
             addHeader("--- Proprietor Address ---");
             addField("State", person.state);
             addField("LGA", person.lga);
             addField("City/Town", person.city);
             addField("Street Number", person.streetNo);
             addField("Service Address / Street Name", person.serviceAddress);
          }

          addHeader(`--- Documents for ${personName} ---`);
          addField("ID Document (NIN)", person.idDocumentUrl || person.ninUrl, true);
          addField("Passport Photograph", person.passportUrl, true);
          addField("Signature", person.signatureUrl, true);
       });
    }

    // 4. Extra LLC Documents
    if (isLlc && (ticket.witnessSignatureUrl || ticket.declarantSignatureUrl || ticket.reasonRestrictionUrl || ticket.otherDocumentsUrl)) {
      addHeader("ADDITIONAL LLC DOCUMENTS", true);
      addField("Witness Signature", ticket.witnessSignatureUrl, true);
      addField("Declarant Signature", ticket.declarantSignatureUrl, true);
      addField("Reason for Restriction", ticket.reasonRestrictionUrl, true);
      addField("Other Documents", ticket.otherDocumentsUrl, true);
    }

    const cleanFileName = ticket.proposedName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`${ticket.trackingId}_${cleanFileName}_FULL_EXPORT.pdf`);
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
            <button 
              onClick={handleExportPDF}
              title="Download Full Form Data as PDF"
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Download size={16} /> <span className="hidden sm:inline">Export Form Details</span>
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
          {activeTab === "INFO" && <CacInfoTab ticket={ticket} isLlc={isLlc} />}
          {activeTab === "PEOPLE" && <CacPeopleTab ticket={ticket} isLlc={isLlc} />}
          {activeTab === "DOCS" && <CacDocsTab ticket={ticket} isLlc={isLlc} />}
          {activeTab === "ACTION" && <CacActionTab ticket={ticket} staffList={staffList} onUpdateSuccess={onUpdateSuccess} />}
        </div>
      </div>
    </div>
  );
}
