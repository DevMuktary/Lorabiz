// Number to Words Converter specifically formatted for Naira
export function numberToWordsNaira(num: number): string {
  if (num === 0) return "Zero Naira";
  if (!num || isNaN(num)) return "";

  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const scales = ["", "Thousand", "Million", "Billion", "Trillion"];

  function convertGroup(n: number): string {
    let str = "";
    if (n > 99) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
      if (n > 0) str += "and ";
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + " ";
    }
    return str.trim();
  }

  let words = "";
  let scaleIdx = 0;

  while (num > 0) {
    const group = num % 1000;
    if (group > 0) {
      const groupWords = convertGroup(group);
      words = groupWords + (scales[scaleIdx] ? " " + scales[scaleIdx] : "") + (words ? " " + words : "");
    }
    num = Math.floor(num / 1000);
    scaleIdx++;
  }

  return words.trim() + " Naira";
}

// Format number with commas
export const formatNumberWithCommas = (val: number | string) => {
  if (!val) return "";
  const num = typeof val === "string" ? parseInt(val.replace(/\D/g, "")) : val;
  if (isNaN(num)) return "";
  return num.toLocaleString("en-US");
};

// Remove commas to get raw number
export const parseNumber = (val: string) => {
  return parseInt(val.replace(/\D/g, "")) || 0;
};

// The 72 Designated Companies & Minimums
export const DESIGNATED_COMPANIES = [
  { id: 0, type: "ENTITY WITH SHARES BELOW FIVE MILLION", min: 1000000 },
  { id: 1, type: "ISSUING HOUSE", min: 200000000 },
  { id: 2, type: "BROKER/DEALER", min: 300000000 },
  { id: 3, type: "TRUSTEE", min: 300000000 },
  { id: 4, type: "FUND/PORTFOLIO MANAGER", min: 150000000 },
  { id: 5, type: "STOCK BROKER", min: 200000000 },
  { id: 6, type: "STOCK DEALER", min: 100000000 },
  { id: 7, type: "CORPORATE INVESTMENT ADVISER (REGISTRAR)", min: 150000000 },
  { id: 8, type: "CORPORATE INVESTMENT ADVISER", min: 5000000 },
  { id: 9, type: "INDIVIDUAL INVESTMENT ADVISER", min: 2000000 },
  { id: 10, type: "MARKET MAKER", min: 2000000000 },
  { id: 11, type: "CONSULTANT (PARTNERSHIP)", min: 2000000 },
  { id: 12, type: "CONSULTANT (INDIVIDUAL)", min: 500000 },
  { id: 13, type: "CONSULTANT (CORPORATE)", min: 5000000 },
  { id: 14, type: "UNDERWRITER", min: 200000000 },
  { id: 15, type: "VENTURE CAPITAL MANAGER", min: 20000000 },
  { id: 16, type: "COMMODITIES BROKER", min: 40000000 },
  { id: 17, type: "CAPITAL TRADE POINT", min: 20000000 },
  { id: 18, type: "RATING AGENCY", min: 150000000 },
  { id: 19, type: "CORPORATE/SUB BROKER", min: 5000000 },
  { id: 20, type: "ASSET MANAGEMENT (INTANGIBLE ASSETS)", min: 300000000 },
  { id: 21, type: "COMMERCIAL BANK WITH REGIONAL AUTHORIZATION", min: 10000000000 },
  { id: 22, type: "COMMERCIAL BANK WITH NATIONAL AUTHORIZATION", min: 25000000000 },
  { id: 23, type: "COMMERCIAL BANK WITH INTERNATIONAL AUTHORIZATION", min: 50000000000 },
  { id: 24, type: "MERCHANT BANK", min: 15000000000 },
  { id: 25, type: "PAYMENT SOLUTION SERVICES (PSS)", min: 250000000 },
  { id: 26, type: "SUPER AGENT", min: 50000000 },
  { id: 27, type: "PAYMENT TERMINAL SERVICE PROVIDER (PTSP)", min: 100000000 },
  { id: 28, type: "PAYMENT SOLUTIONS SERVICE PROVIDER (PSSP)", min: 100000000 },
  { id: 29, type: "MOBILE MONEY OPERATION", min: 2000000000 },
  { id: 30, type: "SWITCHING AND PROCESSING", min: 2000000000 },
  { id: 31, type: "UNIT MICRO FINANCE BANK (TIER 1)", min: 200000000 },
  { id: 32, type: "UNIT MICRO FINANCE BANK (TIER 2)", min: 50000000 },
  { id: 33, type: "MICRO FINANCE BANK (STATE & FCT)", min: 1000000000 },
  { id: 34, type: "MICRO FINANCE BANK (NATIONAL)", min: 5000000000 },
  { id: 35, type: "PRIMARY MORTGAGE INSTITUTION", min: 2000000000 },
  { id: 36, type: "FINANCE COMPANY", min: 20000000 },
  { id: 37, type: "BUREAU DE CHANGE", min: 35000000 },
  { id: 38, type: "NON-INTEREST BANK (REGIONAL)", min: 5000000000 },
  { id: 39, type: "NON-INTEREST BANK (NATIONAL)", min: 10000000000 },
  { id: 40, type: "INSURANCE BROKER", min: 5000000 },
  { id: 41, type: "LIFE INSURANCE", min: 8000000000 },
  { id: 42, type: "GENERAL INSURANCE", min: 10000000000 },
  { id: 43, type: "COMPOSITE INSURANCE", min: 18000000000 },
  { id: 44, type: "RE-INSURANCE", min: 20000000000 },
  { id: 45, type: "UNIT MICROINSURER", min: 40000000 },
  { id: 46, type: "STATE MICROINSURER", min: 100000000 },
  { id: 47, type: "NATIONAL MICROINSURER", min: 600000000 },
  { id: 48, type: "TAKAFUL INSURANCE (GENERAL AND FAMILY)", min: 200000000 },
  { id: 49, type: "PRIVATE SECURITY COMPANY/CONSULTANT", min: 10000000 },
  { id: 50, type: "PENSION FUND/ASSET CUSTODIAN", min: 2000000000 },
  { id: 51, type: "CLOSED PENSION FUND", min: 500000000 },
  { id: 52, type: "PENSION FUND ADMINISTRATOR", min: 5000000000 },
  { id: 53, type: "LOTTERY", min: 5000000 },
  { id: 54, type: "SPORTS LOTTERY", min: 30000000 },
  { id: 55, type: "AIR TRANSPORT (INTERNATIONAL)", min: 2000000000 },
  { id: 56, type: "AIR TRANSPORT (REGIONAL)", min: 1000000000 },
  { id: 57, type: "AIR TRANSPORT (LOCAL)", min: 500000000 },
  { id: 58, type: "AIR AMBULANCE/FUMIGATION/ PRIVATE JET", min: 20000000 },
  { id: 59, type: "AVIATION (GROUND HANDLING SERVICES)", min: 500000000 },
  { id: 60, type: "AVIATION (AIR TRANSPORT TRAINING INSTITUTIONS)", min: 2000000 },
  { id: 61, type: "AGENTS OF FOREIGN AIRLINES", min: 1000000 },
  { id: 62, type: "TRAVEL/TOURS", min: 30000000 },
  { id: 63, type: "AGRICULTURAL SEEDS, PRODUCTIONS, PROCESSING, MARKETING", min: 10000000 },
  { id: 64, type: "SHIPPING COMPANY/AGENT", min: 25000000 },
  { id: 65, type: "CABOTAGE TRADE", min: 25000000 },
  { id: 66, type: "LIFE MICRO-INSURANCE", min: 150000000 },
  { id: 67, type: "GENERAL MICRO-INSURANCE", min: 200000000 },
  { id: 68, type: "FREIGTH FORWARDING", min: 5000000 },
  { id: 69, type: "PAYMENT SERVICE BANK", min: 5000000000 },
  { id: 70, type: "HEALTH MAINTENANCE ORGANIZATION (HMO)(NATIONAL)", min: 400000000 },
  { id: 71, type: "HEALTH MAINTENANCE ORGANIZATION (HMO)(REGIONAL)", min: 200000000 },
  { id: 72, type: "HEALTH MAINTENANCE ORGANIZATION (HMO)(STATE)", min: 100000000 },
];
