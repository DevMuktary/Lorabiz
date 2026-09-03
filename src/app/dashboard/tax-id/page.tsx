"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { 
  Info, CheckCircle, X, WarningCircle, ArrowRight, ListDashes, 
  ArrowLeft, Tag, IdentificationCard, Buildings, CaretDown, CaretUp, Gift 
} from "@phosphor-icons/react";

type TaxIdType = "INDIVIDUAL" | "CORPORATE";

const CORPORATE_CATEGORIES = [
  "Business Name",
  "Company (LLC)",
  "Incorporated Trustee",
  "Limited Partnership",
  "Limited Liability Partnership"
];

export default function TaxIdPage() {
  const [isActive, setIsActive] = useState(true);
  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  const [reqType, setReqType] = useState<TaxIdType>("INDIVIDUAL");
  
  const [prices, setPrices] = useState({ individual: 0, corporate: 0 });
  const [discountDetails, setDiscountDetails] = useState<Record<string, any>>({});
  const [freePassCount, setFreePassCount] = useState<number>(0);
  const [useRewardCredit, setUseRewardCredit] = useState<boolean>(true);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  
  const [showIntroModal, setShowIntroModal] = useState(true);

  const [consentChecked, setConsentChecked] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Individual Form
  const [nin, setNin] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");

  // Corporate Form
  const [cacNumber, setCacNumber] = useState("");
  const [corpCategory, setCorpCategory] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const fetchPricingAndWallet = async () => {
      try {
        const [priceRes, walletRes, settingsRes, taxRes] = await Promise.all([
          fetch("/api/pricing"),
          fetch("/api/user/wallet"),
          fetch("/api/settings/global"),
          fetch("/api/tax-id")
        ]);
        const priceData = await priceRes.json();
        if (priceData.success) {
          setPrices({
            individual: priceData.data.TAX_ID_INDIVIDUAL || 500,
            corporate: priceData.data.TAX_ID_CORPORATE || 1000
          });
          if (priceData.discountDetails) {
            setDiscountDetails(priceData.discountDetails);
          }
        }
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          const balance = walletData.wallet?.balance ?? walletData.balance;
          if (balance !== undefined && balance !== null) {
            setWalletBalance(Number(balance));
          }
        }
        if (taxRes.ok) {
          const taxData = await taxRes.json();
          if (taxData.freePassCount) {
            setFreePassCount(taxData.freePassCount);
          }
        }
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.settings) {
          setIsActive(settingsData.settings.taxIdEnabled ?? true);
          if (settingsData.settings.taxIdReason) {
            setMaintenanceMsg(settingsData.settings.taxIdReason);
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      } finally {
        setIsLoadingPrice(false);
      }
    };
    fetchPricingAndWallet();
  }, []);

  // Close custom dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentDiscountKey = reqType === "INDIVIDUAL" ? "TAX_ID_INDIVIDUAL" : "TAX_ID_CORPORATE";
  const currentDiscount = discountDetails[currentDiscountKey];
  const currentPrice = reqType === "INDIVIDUAL" ? prices.individual : prices.corporate;
  const originalPrice = currentDiscount?.originalPrice || currentPrice;
  const hasDiscount = Boolean(currentDiscount?.hasDiscount);
  const discountBadge = currentDiscount?.badge;

  const isPassApplied = freePassCount > 0 && useRewardCredit;
  const payablePrice = isPassApplied ? 0 : currentPrice;
  const isInsufficientBalance = walletBalance < payablePrice;

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!consentChecked) {
      setErrorMsg("You must accept the terms to proceed.");
      return;
    }

    if (reqType === "INDIVIDUAL") {
      if (!nin || nin.length !== 11) {
        setErrorMsg("Valid 11-digit NIN is required.");
        return;
      }
      if (!firstName || !lastName || !dob) {
        setErrorMsg("First name, Last name and Date of birth are required.");
        return;
      }
    } else {
      if (!cacNumber) {
        setErrorMsg("CAC registration number is required.");
        return;
      }
      if (!corpCategory) {
        setErrorMsg("Please select a corporate category.");
        return;
      }
    }

    setIsConfirmModalOpen(true);
  };

  const confirmAndPay = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const payload: any = { 
        type: reqType,
        price: payablePrice,
        useRewardCredit: isPassApplied,
      };

      if (reqType === "INDIVIDUAL") {
        payload.individualData = {
          nin: nin.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dob: dob
        };
      } else {
        payload.corporateData = {
          cacNumber: cacNumber.trim(),
          category: corpCategory
        };
      }

      const res = await fetch("/api/tax-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to process request. Please check your details and try again.");
      }

      // Success -> Redirect to history
      window.location.href = "/dashboard/tax-id/history";
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!isActive) {
    return (
      <div className="p-8 text-center bg-card border border-border rounded-2xl max-w-xl mx-auto mt-12 space-y-4">
        <WarningCircle weight="duotone" className="h-16 w-16 text-yellow-500 mx-auto" />
        <h2 className="text-2xl font-black text-foreground">Service Temporarily Unavailable</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {maintenanceMsg || "Tax ID (TIN) processing is currently undergoing maintenance. Please check back later."}
        </p>
        <Link 
          href="/dashboard" 
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm font-bold rounded-xl border border-border hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative">
      
      {/* Intro Modal (I Understand) */}
      {showIntroModal && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Info weight="fill" className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">Tax ID (TIN) Service Guidelines</h3>
                <p className="text-xs text-muted-foreground">Please read before proceeding</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <span className="font-bold text-foreground">1.</span>
                <p><strong className="text-foreground">Official JTB / FIRS Verification:</strong> Ensure that your NIN details (for individuals) match your official records, or CAC RC/BN is registered properly.</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-foreground">2.</span>
                <p><strong className="text-foreground">Processing Turnaround:</strong> Applications are processed digitally between 1 to 24 hours.</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-foreground">3.</span>
                <p><strong className="text-foreground">Digital Delivery:</strong> Your 13-digit Tax ID will be generated and available for instant download in your history ledger.</p>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setShowIntroModal(false)}
              className="mt-8 w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              I Understand
            </button>
          </div>
        </div>,
        document.body
      )}

      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white dark:bg-white flex items-center justify-center p-1.5 border border-slate-200/80 dark:border-white/20 shrink-0 shadow-xs">
            <Image src="/nrs.png" alt="TIN" width={40} height={40} className="object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Generate Tax ID (TIN)</h1>
            <p className="text-muted-foreground text-sm">Get your 13-digit Tax Identification Number.</p>
          </div>
        </div>

        <Link href="/dashboard/tax-id/history" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground text-sm font-bold rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group shrink-0">
          <ListDashes weight="bold" className="h-4 w-4" />
          View History & Status
          <ArrowRight weight="bold" className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleOpenConfirm} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
            
            {/* PalmPay / OPay Style Free Tax ID Pass Voucher Card (Compact) */}
            {freePassCount > 0 && (
              <div className="rounded-xl border border-orange-500/25 bg-orange-500/5 px-3 py-2 sm:px-3.5 sm:py-2.5 transition-all">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25 flex items-center justify-center shrink-0">
                      <Gift size={15} weight="fill" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-foreground">1 Free Tax ID Pass</span>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-orange-500 text-white px-1.5 py-0.2 rounded">
                          {freePassCount} {freePassCount === 1 ? "READY" : "AVAILABLE"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {useRewardCredit
                          ? "Applied! Valid for Individual or Corporate Tax ID at ₦0 fee."
                          : "Pass available · Click toggle to apply to this order"}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setUseRewardCredit(!useRewardCredit)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      useRewardCredit ? "bg-orange-600" : "bg-muted-foreground/30"
                    }`}
                    title={useRewardCredit ? "Remove Free Pass" : "Apply Free Pass"}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        useRewardCredit ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Toggle Tabs */}
            <div className="space-y-4">
              <label className="text-sm font-bold">1. Select Request Type</label>
              <div className="flex bg-secondary p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setReqType("INDIVIDUAL")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${reqType === "INDIVIDUAL" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <IdentificationCard weight="bold" className="h-4 w-4" />
                  Individual (NIN)
                </button>
                <button
                  type="button"
                  onClick={() => setReqType("CORPORATE")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${reqType === "CORPORATE" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Buildings weight="bold" className="h-4 w-4" />
                  Non-Individual (CAC)
                </button>
              </div>

              {!isLoadingPrice && (
                <div className="animate-in fade-in flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-500 px-3 py-2 rounded-lg w-fit mt-3">
                  <Tag weight="fill" className="h-4 w-4 shrink-0" />
                  <div className="flex items-center gap-2 flex-wrap">
                    {isPassApplied ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Processing Fee: ₦0.00 Free
                        </span>
                        <span className="line-through text-muted-foreground text-xs opacity-75">
                          ₦{currentPrice.toLocaleString()}
                        </span>
                        <span className="bg-orange-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-xs">
                          FREE WITH PASS
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Processing Fee: ₦{currentPrice.toLocaleString()}
                        </span>
                        {hasDiscount && originalPrice > currentPrice && (
                          <div className="flex items-center gap-1.5">
                            <span className="line-through text-muted-foreground text-xs opacity-75">
                              ₦{originalPrice.toLocaleString()}
                            </span>
                            <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
                              {discountBadge || "DISCOUNTED"}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6 pt-4 border-t border-border">
              {reqType === "INDIVIDUAL" ? (
                <div className="space-y-5 animate-in fade-in">
                  <div>
                    <label className="text-sm font-bold mb-2 block">National Identity Number (NIN)</label>
                    <input required type="text" pattern="\d{11}" maxLength={11} value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))} placeholder="Enter your 11-digit NIN" className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-base sm:text-base focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold mb-2 block">First Name</label>
                      <input required type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. John" className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-base sm:text-base focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-sm font-bold mb-2 block">Last Name</label>
                      <input required type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Doe" className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-base sm:text-base focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold mb-2 block">Date of Birth</label>
                    <input required type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().split("T")[0]} className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-base sm:text-base focus:ring-2 focus:ring-primary/50 outline-none transition-all appearance-none cursor-pointer" style={{ colorScheme: "dark" }} />
                  </div>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in">
                  <div>
                    <label className="text-sm font-bold mb-2 block">CAC Registration Number</label>
                    <input required type="text" value={cacNumber} onChange={(e) => setCacNumber(e.target.value.toUpperCase())} placeholder="e.g. RC123456 or BN987654" className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-base sm:text-base focus:ring-2 focus:ring-primary/50 outline-none transition-all uppercase" />
                  </div>
                  
                  {/* Designed Dropdown for Corporate Category */}
                  <div className="relative" ref={categoryDropdownRef}>
                    <label className="text-sm font-bold mb-2 block">Registration Category</label>
                    <button 
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all text-left ${isCategoryDropdownOpen ? 'border-primary ring-2 ring-primary/20 bg-background' : 'border-border bg-background hover:border-primary/50'}`}
                    >
                      <span className={corpCategory ? "font-bold text-base sm:text-base text-foreground" : "text-base sm:text-base text-muted-foreground"}>
                        {corpCategory || "Select your CAC Category..."}
                      </span>
                      {isCategoryDropdownOpen ? <CaretUp weight="bold" className="h-4 w-4 text-muted-foreground" /> : <CaretDown weight="bold" className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    {isCategoryDropdownOpen && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {CORPORATE_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setCorpCategory(cat);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className="w-full flex items-center px-4 py-3 hover:bg-secondary transition-colors text-left border-b border-border last:border-0 font-bold text-sm text-foreground"
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border space-y-5">
              <label className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl cursor-pointer border border-transparent hover:border-border transition-colors">
                <input type="checkbox" required checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer shrink-0" />
                <span className="text-xs text-muted-foreground leading-relaxed select-none">
                  I hereby declare under the <strong>Nigeria Data Protection Act (NDPA) 2023</strong> that I am the applicant or authorized corporate proxy for this entity, and authorize Lorabiz to process this tax identity application with relevant revenue authorities.
                </span>
              </label>

              <button type="submit" disabled={!consentChecked || isLoadingPrice} className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md cursor-pointer">
                {isLoadingPrice ? (
                  "Loading pricing..."
                ) : isPassApplied ? (
                  <span className="flex items-center gap-2">
                    <span>Submit Application (₦0.00 Free)</span>
                    <span className="text-xs opacity-75 line-through">₦{currentPrice.toLocaleString()}</span>
                  </span>
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-24">
            <h3 className="font-black text-sm uppercase tracking-wider text-muted-foreground mb-5">Why you need a TIN</h3>
            <ul className="space-y-5">
              <li className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">1</div>
                <p className="text-sm text-muted-foreground leading-relaxed">Required for opening corporate or personal bank accounts.</p>
              </li>
              <li className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">2</div>
                <p className="text-sm text-muted-foreground leading-relaxed">Required for registering your business for VAT and filing your annual tax returns.</p>
              </li>
              <li className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">3</div>
                <p className="text-sm text-muted-foreground leading-relaxed">Mandatory for importing/exporting goods and bidding for government contracts.</p>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {mounted && isConfirmModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 min-h-screen w-screen z-[99999] flex items-center justify-center p-4 bg-background/80 dark:bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
            <div className="p-6 md:p-8 space-y-6">
              
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black">Confirm Request</h3>
                <button onClick={() => setIsConfirmModalOpen(false)} disabled={isSubmitting} className="p-1 hover:bg-secondary rounded-full transition-colors disabled:opacity-50 cursor-pointer">
                  <X weight="bold" className="h-5 w-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="bg-destructive/10 text-destructive text-sm font-bold p-3 rounded-lg flex items-center gap-2 border border-destructive/20">
                  <WarningCircle weight="bold" className="h-4 w-4" /> {errorMsg}
                </div>
              )}

              <div className="bg-secondary/50 rounded-xl p-4 space-y-2 border border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-bold">{reqType}</span>
                </div>
                {reqType === "INDIVIDUAL" ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-bold">{firstName} {lastName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">NIN</span>
                      <span className="font-bold tracking-widest">{nin}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CAC Number</span>
                    <span className="font-bold">{cacNumber}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-end border-t border-border pt-3 mt-3">
                  <span className="text-muted-foreground text-sm">Total Cost</span>
                  {isPassApplied ? (
                    <div className="text-right">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-xl leading-none block">₦0.00 Free</span>
                      <span className="text-xs text-muted-foreground line-through">₦{currentPrice.toLocaleString()}</span>
                    </div>
                  ) : (
                    <span className="font-black text-primary text-xl leading-none">₦{currentPrice.toLocaleString()}</span>
                  )}
                </div>
              </div>

              {errorMsg && !isInsufficientBalance && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2.5 text-xs font-semibold">
                  <WarningCircle weight="fill" className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Insufficient balance warning inside modal */}
              {isInsufficientBalance ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <span className="text-xl">😭</span>
                      <span>Insufficient Wallet Balance</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your balance is <strong className="text-foreground">₦{walletBalance.toLocaleString()}</strong>, but this request requires <strong className="text-foreground">₦{payablePrice.toLocaleString()}</strong>.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsConfirmModalOpen(false)} 
                      className="flex-1 py-3 bg-secondary text-foreground font-bold rounded-xl hover:opacity-90 transition-opacity text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <Link
                      href="/dashboard"
                      className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 text-sm text-center shadow-md cursor-pointer whitespace-nowrap"
                    >
                      <span>Go to Dashboard</span>
                      <ArrowRight weight="bold" className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>Balance After Debit:</span>
                    <span className="font-bold text-foreground">₦{(walletBalance - payablePrice).toLocaleString()}</span>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsConfirmModalOpen(false)} 
                      disabled={isSubmitting} 
                      className="flex-1 py-3 bg-secondary text-foreground font-bold rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={confirmAndPay} 
                      disabled={isSubmitting} 
                      className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                    >
                      {isSubmitting ? (
                        "Processing..."
                      ) : isPassApplied ? (
                        <><CheckCircle weight="bold" className="h-4 w-4" /> Submit (₦0.00 Free)</>
                      ) : (
                        <><CheckCircle weight="bold" className="h-4 w-4" /> Pay & Submit</>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
