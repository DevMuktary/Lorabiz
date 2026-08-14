import { NextResponse } from "next/server";

// Curated list of major Nigerian Banks & Fintechs as instant fallback
const FALLBACK_NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Access Bank (Diamond)", code: "063" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Globus Bank", code: "00103" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "50211" },
  { name: "Lotus Bank", code: "303" },
  { name: "Moniepoint MFB", code: "50515" },
  { name: "OPay Digital Services", code: "999992" },
  { name: "Optimus Bank", code: "107" },
  { name: "Palmpay", code: "999991" },
  { name: "Parallex Bank", code: "526" },
  { name: "Polaris Bank", code: "076" },
  { name: "Premium Trust Bank", code: "105" },
  { name: "Providus Bank", code: "101" },
  { name: "Signature Bank", code: "106" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "SunTrust Bank", code: "100" },
  { name: "Taj Bank", code: "302" },
  { name: "Titan Trust Bank", code: "102" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "VFD Microfinance Bank", code: "566" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" }
];

export async function GET() {
  try {
    const res = await fetch("https://api.paystack.co/bank?country=nigeria", {
      headers: {
        "Accept": "application/json",
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, banks: FALLBACK_NIGERIAN_BANKS });
    }

    const data = await res.json();
    if (data && data.status && Array.isArray(data.data)) {
      const sorted = data.data
        .map((b: any) => ({ name: b.name, code: b.code }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      return NextResponse.json({ success: true, banks: sorted });
    }

    return NextResponse.json({ success: true, banks: FALLBACK_NIGERIAN_BANKS });
  } catch (error) {
    console.error("Failed to fetch Paystack banks, using fallback:", error);
    return NextResponse.json({ success: true, banks: FALLBACK_NIGERIAN_BANKS });
  }
}
