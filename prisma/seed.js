const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function runSeed() {
  console.log("🌱 [Seed] Seeding service pricing data...");

  const prices = [
    { serviceKey: "BUSINESS_NAME", title: "Business Name Registration", price: 29000.00 },
    { serviceKey: "LLC", title: "Limited Liability Company (LTD) - Up to 1M Shares", price: 35000.00 },
    { serviceKey: "LLC_EXTRA_MILLION", title: "LLC Additional Fee per 1M Shares", price: 15000.00 },
    { serviceKey: "NGO", title: "Incorporated Trustees (NGO)", price: 120000.00 },
    { serviceKey: "NAME_SUBSTITUTION", title: "Name Substitution Fee", price: 5000.00 },
    { serviceKey: "SCUML", title: "SCUML Certificate Registration", price: 320000.00 },
    { serviceKey: "TAX_ID_INDIVIDUAL", title: "Individual Tax ID (TIN)", price: 500.00 },
    { serviceKey: "TAX_ID_CORPORATE", title: "Corporate Tax ID (TIN)", price: 1000.00 },
    // NIN Slip & Identity Service Prices (Query by NIN)
    { serviceKey: "NIN_BASIC", title: "Basic NIN Slip", price: 400.00 },
    { serviceKey: "NIN_VNIN", title: "VNIN Verification Slip", price: 500.00 },
    { serviceKey: "NIN_REGULAR", title: "Regular Slip", price: 500.00 },
    { serviceKey: "NIN_STANDARD", title: "Standard Biometric Slip", price: 700.00 },
    { serviceKey: "NIN_PREMIUM", title: "Premium Card Layout", price: 1000.00 },
    // Phone Query NIN Slip Prices
    { serviceKey: "NIN_PHONE_REGULAR", title: "Phone Query - Regular Slip", price: 500.00 },
    { serviceKey: "NIN_PHONE_STANDARD", title: "Phone Query - Standard Slip", price: 700.00 },
    { serviceKey: "NIN_PHONE_PREMIUM", title: "Phone Query - Premium Slip", price: 1000.00 },
    { serviceKey: "NIN_PERSONALIZATION", title: "NIN Personalization", price: 1500.00 },
    { serviceKey: "NIN_IPE_CLEARANCE", title: "IPE Clearance (Exception Resolution)", price: 2500.00 },
    { serviceKey: "NIN_VALIDATION_NO_RECORD", title: "NIN Validation (No Record Found)", price: 2000.00 },
    { serviceKey: "NIN_VALIDATION_VNIN", title: "NIN Validation (VNIN Validation)", price: 2500.00 },
    { serviceKey: "NIN_VALIDATION_MOD", title: "NIN Validation (Update Record / Mod)", price: 3000.00 },
    // NIN Modification Service Prices
    { serviceKey: "NIN_MOD_NAME", title: "NIN Modification - Change of Name", price: 2500.00 },
    { serviceKey: "NIN_MOD_PHONE", title: "NIN Modification - Change of Phone Number", price: 2000.00 },
    { serviceKey: "NIN_MOD_ADDRESS", title: "NIN Modification - Change of Address", price: 2000.00 },
    // BVN Verification & Retrieval Service Prices
    { serviceKey: "BVN_STANDARD", title: "BVN Verification - Standard Slip", price: 700.00 },
    { serviceKey: "BVN_PREMIUM", title: "BVN Verification - Premium Card Slip", price: 1000.00 },
    { serviceKey: "BVN_RETRIEVAL", title: "BVN Number Retrieval", price: 2500.00 },
    // BVN Modification Service Prices
    { serviceKey: "BVN_MOD_NAME", title: "BVN Modification - Change of Name Only", price: 3000.00 },
    { serviceKey: "BVN_MOD_PHONE", title: "BVN Modification - Change of Phone Number Only", price: 2500.00 },
    { serviceKey: "BVN_MOD_DOB", title: "BVN Modification - Change of Date of Birth Only", price: 15000.00 },
    { serviceKey: "BVN_MOD_NAME_PHONE", title: "BVN Modification - Change of Name & Phone", price: 5000.00 },
    { serviceKey: "BVN_MOD_DOB_PHONE", title: "BVN Modification - Change of DOB & Phone", price: 17000.00 },
    { serviceKey: "BVN_MOD_NAME_DOB", title: "BVN Modification - Change of Name & DOB", price: 17500.00 },
    { serviceKey: "BVN_MOD_ALL", title: "BVN Modification - Change of Name, DOB & Phone (All 3)", price: 19500.00 },
    { serviceKey: "BVN_MOD_DOB_SURCHARGE", title: "BVN Modification - 5-Year DOB Surcharge", price: 5000.00 },
    // Court Affidavit Services
    { serviceKey: "AFFIDAVIT_STATE", title: "Court Affidavit - State Judiciary", price: 2500.00 },
    { serviceKey: "AFFIDAVIT_FEDERAL", title: "Court Affidavit - Federal High Court", price: 4000.00 },
    { serviceKey: "AFFIDAVIT_CHANGE_OF_NAME", title: "Court Affidavit - Change / Correction of Name", price: 2500.00 },
    { serviceKey: "AFFIDAVIT_AGE_DECLARATION", title: "Court Affidavit - Age Declaration / DOB", price: 2500.00 },
    { serviceKey: "AFFIDAVIT_CAC_CORPORATE", title: "Court Affidavit - CAC Corporate Matters", price: 2500.00 },
    { serviceKey: "AFFIDAVIT_LOSS_OF_ITEM", title: "Court Affidavit - Loss of Document / SIM Card", price: 2500.00 },
    { serviceKey: "AFFIDAVIT_PROOF_OF_OWNERSHIP", title: "Court Affidavit - Proof of Ownership & Status", price: 2500.00 },
    { serviceKey: "AFFIDAVIT_GENERAL_PURPOSE", title: "Court Affidavit - General Purpose Statement", price: 2500.00 },
    // CAC Post-Incorporation (Annual Returns)
    { serviceKey: "CAC_ANNUAL_RETURNS_BN", title: "CAC Annual Returns - Business Name", price: 12000.00 },
    { serviceKey: "CAC_ANNUAL_RETURNS_LLC", title: "CAC Annual Returns - Limited Liability Company", price: 18000.00 }
  ];

  let count = 0;
  for (const p of prices) {
    await prisma.servicePricing.upsert({
      where: { serviceKey: p.serviceKey },
      update: { 
        title: p.title,
        isActive: true, // Ensure active so it doesn't show maintenance
      },
      create: { 
        serviceKey: p.serviceKey, 
        title: p.title, 
        price: p.price,
        isActive: true,
      },
    });
    count++;
  }
  console.log(`✅ Seeded ${count} service pricing records (All set to Active).`);

  // Global Settings
  console.log("🌱 [Seed] Seeding Global Settings...");
  const settings = [
    { key: "SUPPORT_WHATSAPP", value: "2348000000000", description: "Global Customer Support WhatsApp Number" },
    { key: "NIN_SLIP_PROVIDER", value: "AUTO", description: "NIN Slip Verification Provider (AUTO | DATAVERIFY | SLIPAPI)" },
    { key: "NIN_PHONE_SEARCH_ACTIVE", value: "true", description: "Whether NIN Search by Phone is active (true | false)" }
  ];

  for (const s of settings) {
    await prisma.globalSetting.upsert({
      where: { key: s.key },
      update: { description: s.description },
      create: { key: s.key, value: s.value, description: s.description },
    });
  }
  console.log("✅ Global settings seeded successfully.");
}

async function main() {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await runSeed();
      break;
    } catch (err) {
      attempt++;
      console.warn(`⚠️ Seed connection attempt ${attempt}/${maxRetries} failed:`, err?.message || err);
      if (attempt >= maxRetries) {
        console.error("❌ Failed to complete database seed.");
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, 2500));
    }
  }
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
