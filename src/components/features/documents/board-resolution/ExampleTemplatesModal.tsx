"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  CaretLeft, 
  CaretRight, 
  Sparkle, 
  Crown, 
  Lightning, 
  Scroll, 
  Certificate, 
  TerminalWindow, 
  Bank, 
  Buildings, 
  Gavel, 
  Globe, 
  Medal,
  Check
} from "@phosphor-icons/react";
import { ResolutionDesignTheme, StructuredResolutionOutput } from "@/lib/board-resolution-generator";

interface ExampleTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEMPLATE_PREVIEWS: Array<{
  id: ResolutionDesignTheme;
  name: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string; weight?: any }>;
  accentColor: string;
  sampleData: StructuredResolutionOutput;
}> = [
  {
    id: "classic-royal",
    name: "Corporate Standard",
    badge: "Most Popular",
    description: "Official Nigerian corporate letterhead with clean numbered resolution clauses and structured signature docket.",
    icon: Crown,
    accentColor: "#1e3a8a",
    sampleData: {
      title: "BOARD RESOLUTION",
      subtitle: "AUTHORIZING COMMERCIAL BANKING SERVICES & ACCOUNT OPERATIONS",
      theme: "classic-royal",
      accentColor: "#1e3a8a",
      letterhead: {
        companyName: "PRIME HORIZON VENTURES LIMITED",
        rcNumber: "RC 1894720",
        registeredAddress: "Plot 14B, Adeola Odeku Street, Victoria Island, Lagos State, Nigeria",
        email: "corporate@primehorizon.ng",
        phone: "+234 802 345 6789"
      },
      meetingMetadata: {
        date: "15th August 2026",
        venue: "The Boardroom, Victoria Island, Lagos",
        commencementText: "At a meeting of the Board of Directors of PRIME HORIZON VENTURES LIMITED duly convened and held on 15th August 2026, the following resolutions were unanimously passed:"
      },
      preambleText: "This resolution was duly passed by the Board of Directors of PRIME HORIZON VENTURES LIMITED in accordance with the provisions of the Companies and Allied Matters Act (CAMA 2020) and the Company's Articles of Association.",
      resolutionLeadIn: "It is hereby resolved that the Company is authorized to open and operate corporate accounts with Access Bank Plc and utilize its digital banking infrastructure.\n\nThe Board hereby approves the Company to:",
      numberedClauses: [
        "Open and maintain Corporate Current and Domiciilary accounts with Access Bank Plc across all designated currency tiers.",
        "Enroll the Company into corporate internet banking, mobile banking platforms, and designated debit/credit card solutions.",
        "Authorize the designated authorized signatories to execute all mandates, indemnity bonds, and account agreements.",
        "Process customer payments, vendor disbursements, and treasury management transactions through approved banking channels.",
        "Empower the executive management to obtain credit facilities, letters of credit, and bank guarantees as required for operations."
      ],
      validityClause: "This resolution shall remain in full force and effect until formal written notice of revocation or amendment is received and acknowledged by the Bank.",
      recitals: ["WHEREAS the Company desires to expand commercial operations..."],
      operativeClauses: [],
      mandateClause: "Any One (1) Director Alone is authorized to sign.",
      certificationText: "I hereby certify that the above is a true and correct extract from the minutes of the meeting of the Board of Directors of PRIME HORIZON VENTURES LIMITED.",
      signatories: [
        { name: "Chukwuemeka N. Obi", role: "Managing Director / CEO", isSignatory: true },
        { name: "Amina Bello Garba", role: "Company Secretary / Legal Director", isSignatory: true }
      ],
      corporateMotto: "Excellence in Enterprise & African Commerce"
    }
  },
  {
    id: "modern-executive",
    name: "Modern Executive",
    badge: "Tech & Venture",
    description: "Contemporary tech letterhead with RC & Date top box, clean modern typography and accent divider rule.",
    icon: Lightning,
    accentColor: "#0f172a",
    sampleData: {
      title: "BOARD RESOLUTION",
      subtitle: "AUTHORIZING PAYMENT SETTLEMENT & FINTECH INTEGRATION",
      theme: "modern-executive",
      accentColor: "#0f172a",
      letterhead: {
        companyName: "NEXUS PAY TECHNOLOGIES LTD",
        rcNumber: "RC 2049182",
        registeredAddress: "Level 4, Heritage Tech Park, Lekki Phase 1, Lagos, Nigeria",
        email: "legal@nexuspay.io",
        phone: "+234 1 888 2000"
      },
      meetingMetadata: {
        date: "12th August 2026",
        venue: "Virtual Board Session via Secure Teleconference",
        commencementText: "At an extraordinary session of the Board of Directors held on 12th August 2026, the following resolutions were resolved and executed:"
      },
      preambleText: "In accordance with Section 88 of CAMA 2020, the Board resolved to authorize fintech gateway integrations.",
      resolutionLeadIn: "Resolved that the Company integrate with Paystack Payments Limited for automated online payment acceptance and collection:\n\nThe Board approves:",
      numberedClauses: [
        "Integrate Paystack APIs for checkout, payment links, and dedicated virtual account collection channels.",
        "Authorize daily settlement sweep into the Company's nominated commercial bank treasury account.",
        "Authorize the Chief Technology Officer and Finance Director to administer merchant dashboard permissions.",
        "Execute the master merchant agreement and compliance certifications required by the payment processor."
      ],
      validityClause: "This resolution remains valid until modified by a subsequent board decision.",
      recitals: [],
      operativeClauses: [],
      mandateClause: "Any One (1) Director Alone.",
      certificationText: "Certified as a true resolution passed by the Board of Directors.",
      signatories: [
        { name: "Adeyemi O. Johnson", role: "Chief Executive Officer", isSignatory: true },
        { name: "Fatima Al-Hassan", role: "Executive Director, Operations", isSignatory: true }
      ],
      corporateMotto: "Powering Next-Generation African Digital Commerce"
    }
  },
  {
    id: "continental-banking",
    name: "Continental Banking",
    badge: "Tier-1 Commercial",
    description: "Tier-1 Nigerian commercial banking format with structured statutory compliance headers and KYC mandate docket.",
    icon: Bank,
    accentColor: "#0f766e",
    sampleData: {
      title: "EXTRACT OF BOARD RESOLUTION",
      subtitle: "CBN REGULATORY MANDATE & CORPORATE ACCOUNT OPENING",
      theme: "continental-banking",
      accentColor: "#0f766e",
      letterhead: {
        companyName: "SAHARA LOGISTICS & MARITIME SERVICES LTD",
        rcNumber: "RC 1629401",
        registeredAddress: "22 Commercial Avenue, Apapa Sea Port Road, Lagos, Nigeria",
        email: "compliance@saharalogistics.ng",
        phone: "+234 1 270 4500"
      },
      meetingMetadata: {
        date: "10th August 2026",
        venue: "Head Office Executive Boardroom, Apapa, Lagos",
        commencementText: "At a formal meeting of the Board of Directors of SAHARA LOGISTICS & MARITIME SERVICES LTD, it was resolved:"
      },
      preambleText: "Pursuant to the Companies and Allied Matters Act 2020 and Central Bank of Nigeria (CBN) KYC Guidelines.",
      resolutionLeadIn: "The Board hereby resolves to open multi-currency corporate trading accounts with Zenith Bank Plc:",
      numberedClauses: [
        "Open NGN, USD, and GBP corporate trade accounts with Zenith Bank Plc Apapa Commercial Branch.",
        "Appoint the designated officers as Class 'A' and Class 'B' authorized signatories for all transactions.",
        "Execute Form CAC 1.1 extracts, Tax Identification compliance documents, and signature specimen cards.",
        "Authorize trade financing, FX swap facilities, and customs duty electronic payment portal access."
      ],
      validityClause: "This resolution is binding upon the Company and may be relied upon by the Bank until written revocation.",
      recitals: [],
      operativeClauses: [],
      mandateClause: "Any Two (2) Directors Jointly.",
      certificationText: "Certified true extract of board minutes signed by the Chairman and Company Secretary.",
      signatories: [
        { name: "Alhaji Ibrahim Danladi", role: "Chairman of the Board", isSignatory: true },
        { name: "Barrister Kenneth Okoro", role: "Company Secretary", isSignatory: true }
      ],
      corporateMotto: "Integrity, Reliability & Global Logistics Excellence"
    }
  },
  {
    id: "gazette-formal",
    name: "Official Gazette",
    badge: "CAMA Statutory",
    description: "Statutory CAMA 2020 legal gazette extract layout with double security border and classical legal drafting structure.",
    icon: Scroll,
    accentColor: "#334155",
    sampleData: {
      title: "SPECIAL RESOLUTION OF THE BOARD",
      subtitle: "PASSED PURSUANT TO THE PROVISIONS OF CAMA 2020",
      theme: "gazette-formal",
      accentColor: "#334155",
      letterhead: {
        companyName: "CRESTVIEW HOLDINGS PLC",
        rcNumber: "RC 982140",
        registeredAddress: "Plot 8 Central Business District, Abuja, FCT, Nigeria",
        email: "secretariat@crestviewplc.com",
        phone: "+234 9 461 8000"
      },
      meetingMetadata: {
        date: "8th August 2026",
        venue: "Abuja Corporate Headquarters",
        commencementText: "BE IT RESOLVED that at a statutory meeting of the Board of Directors held on 8th August 2026:"
      },
      preambleText: "IN THE MATTER OF THE COMPANIES AND ALLIED MATTERS ACT 2020 AND IN THE MATTER OF CRESTVIEW HOLDINGS PLC.",
      resolutionLeadIn: "IT IS HEREBY RESOLVED AS FOLLOWS:",
      numberedClauses: [
        "THAT the Company be and is hereby authorized to establish specialized treasury collection services.",
        "THAT the Managing Director and Secretary be authorized to affix the Common Seal of the Company.",
        "THAT all acts previously executed by executive officers in furtherance of this mandate are ratified and confirmed.",
        "THAT a certified copy of this Resolution be transmitted to regulatory authorities and partner financial institutions."
      ],
      validityClause: "DATED this 8th day of August 2026 and enacted under the statutory powers of the Board.",
      recitals: [],
      operativeClauses: [],
      mandateClause: "Chairman and Company Secretary Jointly.",
      certificationText: "We certify that the foregoing is a true extract from the Minute Book of the Company.",
      signatories: [
        { name: "Dr. Oladipo Adeleke, CON", role: "Chairman", isSignatory: true },
        { name: "Mrs. Folashade Adeleke, FCIS", role: "Company Secretary", isSignatory: true }
      ]
    }
  },
  {
    id: "certified-crest",
    name: "Certified Crest",
    badge: "Heraldic Notary",
    description: "Heraldic security border with golden accents, notary docket framing, and formal attestation seal geometry.",
    icon: Certificate,
    accentColor: "#78350f",
    sampleData: {
      title: "CERTIFIED BOARD RESOLUTION",
      subtitle: "AUTHORIZATION OF BANKING & TREASURY TRANSACTIONS",
      theme: "certified-crest",
      accentColor: "#78350f",
      letterhead: {
        companyName: "ROYAL PHOENIX CAPITAL LIMITED",
        rcNumber: "RC 1450293",
        registeredAddress: "45 Marina Boulevard, Lagos Island, Lagos, Nigeria",
        email: "legal@royalphoenix.ng",
        phone: "+234 1 280 9900"
      },
      meetingMetadata: {
        date: "5th August 2026",
        venue: "Executive Council Chambers, Marina, Lagos",
        commencementText: "At a formal sitting of the Board of Directors of ROYAL PHOENIX CAPITAL LIMITED:"
      },
      preambleText: "Certified pursuant to Section 88 & 115 of the Companies and Allied Matters Act (CAMA 2020).",
      resolutionLeadIn: "Resolved that the Company appoint Guaranty Trust Bank (GTBank) as its principal banker:",
      numberedClauses: [
        "Establish Corporate Current, Deposit, and Escrow banking accounts with GTBank Marina Branch.",
        "Authorize corporate electronic banking tokens and designated multi-signatory access levels.",
        "Approve the execution of bank guarantees, loan agreements, and structured trade instruments."
      ],
      validityClause: "This certified extract remains valid and enforceable in perpetuity unless formally revoked.",
      recitals: [],
      operativeClauses: [],
      mandateClause: "Any Two (2) Directors Jointly.",
      certificationText: "Given under the hands of the authorized Directors and the Common Seal of the Company.",
      signatories: [
        { name: "Sir Anthony K. Briggs", role: "Executive Chairman", isSignatory: true },
        { name: "Dr. Ngozi Eze-Nwosu", role: "Managing Director", isSignatory: true }
      ],
      corporateMotto: "Excellence, Integrity & Generational Value Creation"
    }
  },
  {
    id: "minimalist-tech",
    name: "Minimalist Tech",
    badge: "Ultra-Clean",
    description: "Ultra-sleek modern typography with monospace metadata tags, hairline dividers, and high readability.",
    icon: TerminalWindow,
    accentColor: "#0284c7",
    sampleData: {
      title: "BOARD RESOLUTION",
      subtitle: "DIGITAL INFRASTRUCTURE & PAYMENT GATEWAY MANDATE",
      theme: "minimalist-tech",
      accentColor: "#0284c7",
      letterhead: {
        companyName: "CLOUDSCALE INNOVATIONS LTD",
        rcNumber: "RC 2189034",
        registeredAddress: "12 Yaba Tech Corridor, Commercial Avenue, Yaba, Lagos, Nigeria",
        email: "ops@cloudscale.io",
        phone: "+234 810 555 4321"
      },
      meetingMetadata: {
        date: "14th August 2026",
        venue: "Virtual Asynchronous Board Consent",
        commencementText: "Board Resolution executed via written unanimous consent on 14th August 2026:"
      },
      preambleText: "Executed in full accordance with the Articles of Association and CAMA 2020.",
      resolutionLeadIn: "Resolved that CLOUDSCALE INNOVATIONS LTD authorize Monnify (TeamApt) payment gateway integration:",
      numberedClauses: [
        "Open dedicated virtual accounts for customer subscription automated billing.",
        "Authorize webhook settlement endpoints and API security keys for cloud infrastructure.",
        "Empower the Chief Technology Officer to execute developer terms of service."
      ],
      validityClause: "Valid until revoked by the Board.",
      recitals: [],
      operativeClauses: [],
      mandateClause: "Sole Managing Director Mandate.",
      certificationText: "Certified true extract of unanimous board resolution.",
      signatories: [
        { name: "Tunde Balogun", role: "Chief Executive Officer", isSignatory: true },
        { name: "Kemi Adeleke", role: "Chief Financial Officer", isSignatory: true }
      ],
      corporateMotto: "Scalable Infrastructure for the Global Cloud"
    }
  },
  {
    id: "maritime-energy",
    name: "Maritime & Energy",
    badge: "Industrial",
    description: "Heavy corporate industrial header with slate-framed clauses, high-contrast borders, and structured logistics styling.",
    icon: Buildings,
    accentColor: "#1e293b",
    sampleData: {
      title: "BOARD RESOLUTION EXTRACT",
      subtitle: "AUTHORIZATION FOR VESSEL CHARTER & CREDIT LINE OPERATIONS",
      theme: "maritime-energy",
      accentColor: "#1e293b",
      letterhead: {
        companyName: "ATLANTIC OFFSHORE ENERGY LIMITED",
        rcNumber: "RC 1309824",
        registeredAddress: "Trans-Amadi Industrial Layout, Port Harcourt, Rivers State, Nigeria",
        email: "contracts@atlanticoffshore.ng",
        phone: "+234 84 461 200"
      },
      meetingMetadata: {
        date: "3rd August 2026",
        venue: "Port Harcourt Operations Center",
        commencementText: "At a special sitting of the Board of Directors held on 3rd August 2026:"
      },
      preambleText: "Pursuant to the Nigerian Oil and Gas Industry Content Development Act and CAMA 2020.",
      resolutionLeadIn: "The Board hereby approves the commercial banking and treasury facility with Fidelity Bank Plc:",
      numberedClauses: [
        "Operate specialized Project Accounts for upstream exploration and vessel maintenance contracts.",
        "Authorize letters of credit, performance bonds, and advance payment guarantees up to USD 5,000,000.",
        "Appoint designated project directors as authorized signatories for all operational disbursements."
      ],
      validityClause: "Binding and effective upon delivery to Fidelity Bank Plc.",
      recitals: [],
      operativeClauses: [],
      mandateClause: "Any Two (2) Directors Jointly.",
      certificationText: "Certified under the official seal and signatures of the Company.",
      signatories: [
        { name: "Engr. Tamuno Briggs", role: "Managing Director", isSignatory: true },
        { name: "Barrister Uchechi Okonjo", role: "Legal Director", isSignatory: true }
      ],
      corporateMotto: "Excellence in African Offshore Operations"
    }
  },
  {
    id: "chancery-legal",
    name: "Chancery Legalist",
    badge: "Classical Legal",
    description: "Classical barrister aesthetic with parchment warm tones, formal recitals (WHEREAS), and testatum execution.",
    icon: Gavel,
    accentColor: "#581c87",
    sampleData: {
      title: "MINUTES & RESOLUTION OF THE BOARD",
      subtitle: "STATUTORY GOVERNANCE & BANKING MANDATE EXTRACT",
      theme: "chancery-legal",
      accentColor: "#581c87",
      letterhead: {
        companyName: "VICTORIA CHANCERY TRUST & ASSET MANAGEMENT LTD",
        rcNumber: "RC 1543890",
        registeredAddress: "18 Bishop Oluwole Street, Victoria Island, Lagos, Nigeria",
        email: "trustees@victoriachancery.com",
        phone: "+234 1 462 8800"
      },
      meetingMetadata: {
        date: "1st August 2026",
        venue: "Chancery Chambers, Victoria Island, Lagos",
        commencementText: "At a general meeting of the Board of Directors duly constituted in accordance with law:"
      },
      preambleText: "WHEREAS the Company is duly registered and authorized under the laws of Nigeria in accordance with CAMA 2020.",
      resolutionLeadIn: "NOW THEREFORE BE IT RESOLVED BY THE BOARD OF DIRECTORS AS FOLLOWS:",
      numberedClauses: [
        "THAT the Company establish a fiduciary client escrow account with First Bank of Nigeria Limited.",
        "THAT all transactions and client asset allocations be governed by strict dual-authorization mandates.",
        "THAT the Managing Director and Head of Legal be empowered to execute all relevant statutory deeds."
      ],
      validityClause: "IN WITNESS WHEREOF the parties have hereunto set their hands and corporate seal.",
      recitals: [],
      operativeClauses: [],
      mandateClause: "Chairman and Secretary Jointly.",
      certificationText: "Certified true copy from the Registry of Victoria Chancery Trust Limited.",
      signatories: [
        { name: "Hon. Justice Babatunde Folarin (Rtd)", role: "Chairman", isSignatory: true },
        { name: "Dr. Genevieve N. Okoli, SAN", role: "Managing Trustee", isSignatory: true }
      ],
      corporateMotto: "Fiduciary Trust & Uncompromising Legal Integrity"
    }
  },
  {
    id: "apex-enterprise",
    name: "Apex Enterprise",
    badge: "Fortune 500",
    description: "Fortune-500 style multilateral corporate band header with executive badges and crisp monochrome contrast.",
    icon: Globe,
    accentColor: "#09090b",
    sampleData: {
      title: "BOARD RESOLUTION",
      subtitle: "CORPORATE TREASURY & GLOBAL SETTLEMENT MANDATE",
      theme: "apex-enterprise",
      accentColor: "#09090b",
      letterhead: {
        companyName: "PAN-AFRICAN INFRASTRUCTURE CONGLOMERATE PLC",
        rcNumber: "RC 789123",
        registeredAddress: "Tower 1, Kingsway Commercial Hub, Ikoyi, Lagos, Nigeria",
        email: "treasury@panafrican-group.com",
        phone: "+234 1 277 5000"
      },
      meetingMetadata: {
        date: "11th August 2026",
        venue: "Executive Council Chambers, Ikoyi, Lagos",
        commencementText: "At a formal meeting of the Board of Directors held on 11th August 2026:"
      },
      preambleText: "Enacted pursuant to the powers vested in the Board under CAMA 2020.",
      resolutionLeadIn: "The Board resolves to establish regional settlement and FX swap operations with Providus Bank:",
      numberedClauses: [
        "Authorize corporate multi-currency treasury operations with Providus Bank Victoria Island Hub.",
        "Approve automated API settlement sweeps and virtual accounts across subsidiary entities.",
        "Designate Group Treasury Officers as primary mandate signatories."
      ],
      validityClause: "This corporate mandate remains valid until written modification.",
      recitals: [],
      operativeClauses: [],
      mandateClause: "Any Two (2) Authorized Directors Jointly.",
      certificationText: "Certified true extract signed by Group Chief Executive Officer.",
      signatories: [
        { name: "Alhaji Aliyu Dangote-Sani", role: "Group Chief Executive Officer", isSignatory: true },
        { name: "Mrs. Victoria K. Mensah", role: "Chief Risk & Compliance Officer", isSignatory: true }
      ],
      corporateMotto: "Catalyzing Sustainable Infrastructure Across Africa"
    }
  },
  {
    id: "heritage-corporate",
    name: "Heritage Corporate",
    badge: "Legacy Prestige",
    description: "Dignified legacy corporate layout with deep burgundy accents, ornate corner geometry, and heritage styling.",
    icon: Medal,
    accentColor: "#831843",
    sampleData: {
      title: "BOARD OF DIRECTORS RESOLUTION",
      subtitle: "AUTHORIZING COMMERCIAL BANKING & ASSET ACQUISITION",
      theme: "heritage-corporate",
      accentColor: "#831843",
      letterhead: {
        companyName: "CENTRAL EQUITIES & INVESTMENTS LIMITED",
        rcNumber: "RC 1120934",
        registeredAddress: "Heritage Place, Alfred Rewane Road, Ikoyi, Lagos, Nigeria",
        email: "compliance@centralequities.ng",
        phone: "+234 1 280 7700"
      },
      meetingMetadata: {
        date: "7th August 2026",
        venue: "Boardroom Suite, Ikoyi, Lagos",
        commencementText: "At a meeting of the Board of Directors duly convened and held on 7th August 2026:"
      },
      preambleText: "In accordance with the Articles of Association and Section 88 of CAMA 2020.",
      resolutionLeadIn: "It is hereby resolved that the Company establish business operations with Stanbic IBTC Bank:",
      numberedClauses: [
        "Open corporate asset management and operational accounts with Stanbic IBTC Bank.",
        "Authorize the deployment of point-of-sale (POS) and virtual collection terminals.",
        "Empower the Executive Directors to negotiate and sign credit and asset leasing terms."
      ],
      validityClause: "This resolution is irrevocable unless rescinded by a subsequent resolution.",
      recitals: [],
      operativeClauses: [],
      mandateClause: "Any One (1) Director Alone.",
      certificationText: "Certified true copy of board resolution.",
      signatories: [
        { name: "Chief Gabriel O. Oshodi", role: "Executive Chairman", isSignatory: true },
        { name: "Dr. (Mrs) Halima Sanusi", role: "Managing Director", isSignatory: true }
      ],
      corporateMotto: "Preserving Wealth & Building Generational Value"
    }
  }
];

export default function ExampleTemplatesModal({
  isOpen,
  onClose
}: ExampleTemplatesModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Keyboard navigation (Arrow keys & ESC)
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  if (!isOpen) return null;

  const currentTemplate = TEMPLATE_PREVIEWS[currentIndex];
  const Icon = currentTemplate.icon;

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? TEMPLATE_PREVIEWS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === TEMPLATE_PREVIEWS.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 md:p-5 overflow-hidden animate-in fade-in duration-200 select-none">
      {/* Modal Top Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between gap-3 pb-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5" weight="bold" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                {currentTemplate.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 shrink-0">
                {currentTemplate.badge}
              </span>
              <span className="text-[11px] sm:text-xs text-white/50 font-mono shrink-0">
                ({currentIndex + 1} of {TEMPLATE_PREVIEWS.length})
              </span>
            </div>
            <p className="text-[11px] text-white/70 truncate max-w-xs sm:max-w-xl">
              {currentTemplate.description}
            </p>
          </div>
        </div>

        {/* Close Modal Button */}
        <button
          type="button"
          onClick={onClose}
          className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 shrink-0"
          title="Close Examples (ESC)"
        >
          <X className="h-4 w-4" weight="bold" />
        </button>
      </div>

      {/* Main Center Area: Fixed A4 Paper Sheet (Zero Internal Scrolling) with Large Side Navigation Buttons */}
      <div className="w-full max-w-5xl flex items-center justify-center gap-2 sm:gap-6 my-auto flex-1 relative min-h-0 py-1">
        {/* Large Prominent Left Arrow Button */}
        <button
          type="button"
          onClick={handlePrev}
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-90 text-white border border-white/30 flex flex-col items-center justify-center transition-all cursor-pointer shadow-2xl shrink-0 z-20 group hover:border-primary"
          title="Previous Template (Left Arrow)"
        >
          <CaretLeft className="h-7 w-7 sm:h-8 sm:w-8 group-hover:-translate-x-0.5 transition-transform" weight="bold" />
        </button>

        {/* TRUE A4 PAPER SHEET (Aspect 210/297, Scaled To Viewport, NO SCROLLBARS) */}
        <div 
          className={`h-[62vh] sm:h-[72vh] md:h-[76vh] max-h-[820px] aspect-[210/297] text-slate-900 shadow-2xl rounded-sm border border-slate-300 relative overflow-hidden flex flex-col justify-between p-3 sm:p-5 md:p-6 select-none transition-all duration-300 shrink-0 ${
            currentTemplate.id === "chancery-legal" ? "bg-[#faf8f3]" : "bg-white"
          }`}
          style={{
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)",
            fontFamily: currentTemplate.id === "modern-executive" || currentTemplate.id === "minimalist-tech" || currentTemplate.id === "continental-banking" || currentTemplate.id === "apex-enterprise"
              ? "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              : "'Times New Roman', Times, Georgia, serif"
          }}
        >
          {/* Inner Archetype Framing */}
          <div className={`flex-1 flex flex-col justify-between space-y-1.5 sm:space-y-2.5 ${
            currentTemplate.id === "gazette-formal" ? "border-[2px] border-double border-slate-800 p-2 sm:p-2.5" :
            currentTemplate.id === "certified-crest" ? "border border-amber-800/40 outline outline-1 outline-amber-800/20 outline-offset-2 p-2 sm:p-2.5" :
            currentTemplate.id === "heritage-corporate" ? "border border-rose-950/30 p-2 sm:p-2.5" :
            currentTemplate.id === "maritime-energy" ? "border-l-[4px] border-slate-900 pl-2.5 sm:pl-3.5" : ""
          }`}>
            
            {/* 1. CLEAN LETTERHEAD HEADER (NO FEDERAL REPUBLIC / NO ARTIFICIAL LABELS) */}
            <div className="border-b pb-1.5 sm:pb-2" style={{ borderColor: currentTemplate.accentColor }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <div 
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center text-white font-sans font-black text-xs sm:text-sm shrink-0 shadow-sm"
                    style={{ backgroundColor: currentTemplate.accentColor }}
                  >
                    {currentTemplate.sampleData.letterhead.companyName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-[9.5px] sm:text-[11.5px] md:text-[12.5px] font-black uppercase tracking-tight text-slate-900 leading-tight">
                      {currentTemplate.sampleData.letterhead.companyName}
                    </h1>
                    <p className="text-[7px] sm:text-[8.5px] text-slate-600 font-semibold leading-tight mt-0.5">
                      {currentTemplate.sampleData.letterhead.rcNumber} &bull; {currentTemplate.sampleData.letterhead.registeredAddress}
                    </p>
                    <p className="text-[6.5px] sm:text-[7.5px] text-slate-500 font-medium">
                      {currentTemplate.sampleData.letterhead.email} &bull; {currentTemplate.sampleData.letterhead.phone}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[7.5px] sm:text-[8.5px] text-slate-800 font-bold block">
                    Date: {currentTemplate.sampleData.meetingMetadata?.date}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. RESOLUTION TITLE */}
            <div className="text-center py-0.5">
              <h2 className="text-[10px] sm:text-[12px] md:text-[13px] font-black uppercase tracking-wider text-slate-900 leading-snug">
                {currentTemplate.sampleData.title}
              </h2>
              <p 
                className="text-[7.5px] sm:text-[9px] font-bold uppercase tracking-wide leading-tight mt-0.5"
                style={{ color: currentTemplate.accentColor }}
              >
                {currentTemplate.sampleData.subtitle}
              </p>
            </div>

            {/* 3. PREAMBLE / MEETING COMMENCEMENT */}
            <div className="bg-slate-50/90 rounded p-1.5 sm:p-2 border border-slate-200/70 text-[7px] sm:text-[8.5px] text-slate-700 leading-snug">
              <p className="font-semibold italic">
                {currentTemplate.sampleData.meetingMetadata?.commencementText}
              </p>
            </div>

            {/* 4. NUMBERED RESOLUTION CLAUSES */}
            <div className="space-y-1 flex-1">
              <p className="text-[7.5px] sm:text-[8.5px] font-bold text-slate-900 leading-tight">
                IT WAS UNANIMOUSLY RESOLVED AS FOLLOWS:
              </p>
              <div className="space-y-1">
                {currentTemplate.sampleData.numberedClauses?.slice(0, 4).map((clause, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[7px] sm:text-[8px] md:text-[8.5px] text-slate-800 leading-snug">
                    <span 
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full flex items-center justify-center text-white font-mono font-bold text-[6.5px] sm:text-[7.5px] shrink-0 mt-0.5"
                      style={{ backgroundColor: currentTemplate.accentColor }}
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1 font-medium">{clause}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. VALIDITY STATEMENT */}
            <div className="text-[7px] sm:text-[8px] text-slate-800 leading-snug">
              <p className="font-medium">{currentTemplate.sampleData.validityClause}</p>
            </div>

            {/* 6. AUTHENTIC SIGNATORY DOCKETS (EXACT REFERENCE FORMAT) */}
            <div className="pt-1.5 border-t grid grid-cols-2 gap-2 sm:gap-3" style={{ borderColor: currentTemplate.accentColor }}>
              {currentTemplate.sampleData.signatories.map((sig, idx) => (
                <div key={idx} className="p-1.5 sm:p-2 rounded bg-slate-50/80 border border-slate-200 font-sans text-[7px] sm:text-[8px] space-y-0.5 leading-tight">
                  <div className="grid grid-cols-[55px_1fr] gap-0.5">
                    <span className="font-bold text-slate-600 uppercase text-[6.5px] sm:text-[7.5px]">DIRECTOR</span>
                    <span className="font-black text-slate-950 uppercase truncate">: {sig.name}</span>
                  </div>
                  <div className="grid grid-cols-[55px_1fr] gap-0.5">
                    <span className="font-bold text-slate-600 uppercase text-[6.5px] sm:text-[7.5px]">POSITION</span>
                    <span className="font-semibold text-slate-800 truncate">: {sig.role}</span>
                  </div>
                  <div className="grid grid-cols-[55px_1fr] gap-0.5">
                    <span className="font-bold text-slate-600 uppercase text-[6.5px] sm:text-[7.5px]">COMPANY</span>
                    <span className="text-slate-800 uppercase truncate">: {currentTemplate.sampleData.letterhead.companyName}</span>
                  </div>
                  <div className="grid grid-cols-[55px_1fr] gap-0.5">
                    <span className="font-bold text-slate-600 uppercase text-[6.5px] sm:text-[7.5px]">DATE</span>
                    <span className="text-slate-800 truncate">: {currentTemplate.sampleData.meetingMetadata?.date}</span>
                  </div>
                  <div className="grid grid-cols-[55px_1fr] gap-0.5 items-center pt-0.5 border-t border-slate-200">
                    <span className="font-bold text-slate-600 uppercase text-[6.5px] sm:text-[7.5px]">SIGNATURE</span>
                    <span className="font-serif italic text-[8px] sm:text-[9.5px] text-slate-700">: {sig.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 7. CERTIFICATION NOTE */}
            <div className="pt-0.5">
              <p className="text-[6.5px] sm:text-[7.5px] italic text-slate-600 leading-tight">
                {currentTemplate.sampleData.certificationText}
              </p>
            </div>

          </div>

          {/* 8. CORPORATE MOTTO FOOTER BAR */}
          {currentTemplate.sampleData.corporateMotto && (
            <div 
              className="w-full py-1 sm:py-1.5 px-3 text-center text-white text-[7.5px] sm:text-[9px] font-sans font-bold uppercase tracking-widest mt-1"
              style={{ backgroundColor: currentTemplate.accentColor }}
            >
              {currentTemplate.sampleData.corporateMotto}
            </div>
          )}
        </div>

        {/* Large Prominent Right Arrow Button */}
        <button
          type="button"
          onClick={handleNext}
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-90 text-white border border-white/30 flex flex-col items-center justify-center transition-all cursor-pointer shadow-2xl shrink-0 z-20 group hover:border-primary"
          title="Next Template (Right Arrow)"
        >
          <CaretRight className="h-7 w-7 sm:h-8 sm:w-8 group-hover:translate-x-0.5 transition-transform" weight="bold" />
        </button>
      </div>

      {/* Modal Bottom: Mobile Friendly Navigation Buttons & Dot Switcher */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-white/10 shrink-0">
        {/* Mobile Quick Action Buttons (< Previous & Next >) */}
        <div className="flex sm:hidden items-center justify-between w-full gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="flex-1 py-2 px-3 rounded-xl bg-white/15 active:bg-white/25 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/20 cursor-pointer"
          >
            <CaretLeft className="h-4 w-4" weight="bold" />
            <span>Previous</span>
          </button>
          
          <span className="text-xs text-white/60 font-mono px-2 shrink-0">
            {currentIndex + 1} / {TEMPLATE_PREVIEWS.length}
          </span>

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-2 px-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <span>Next</span>
            <CaretRight className="h-4 w-4" weight="bold" />
          </button>
        </div>

        {/* Desktop Dot Indicators */}
        <div className="hidden sm:flex items-center gap-1.5">
          {TEMPLATE_PREVIEWS.map((tpl, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  isSelected 
                    ? "w-6 sm:w-8 bg-primary shadow-sm" 
                    : "w-2 bg-white/30 hover:bg-white/60"
                }`}
                title={`Switch to ${tpl.name}`}
              />
            );
          })}
        </div>

        {/* Keyboard Hint & Done CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-[10px] sm:text-[11px] text-white/50">
            Use <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px] text-white font-mono">&larr;</kbd> <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px] text-white font-mono">&rarr;</kbd> arrow keys to switch
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:bg-primary/90 transition-all cursor-pointer"
          >
            Done Viewing
          </button>
        </div>
      </div>
    </div>
  );
}
