import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding pricing data...")

  // 1. Unified Pricing (CAC, SCUML, TAX, & NIN)
  const prices = [
    { serviceKey: "BUSINESS_NAME", title: "Business Name Registration", price: 29000.00 },
    { serviceKey: "LLC", title: "Limited Liability Company (LTD) - Up to 1M Shares", price: 35000.00 },
    { serviceKey: "LLC_EXTRA_MILLION", title: "LLC Additional Fee per 1M Shares", price: 15000.00 },
    { serviceKey: "NGO", title: "Incorporated Trustees (NGO)", price: 120000.00 },
    { serviceKey: "NAME_SUBSTITUTION", title: "Name Substitution Fee", price: 5000.00 },
    { serviceKey: "SCUML", title: "SCUML Certificate Registration", price: 320000.00 },
    { serviceKey: "TAX_ID_INDIVIDUAL", title: "Individual Tax ID (TIN)", price: 500.00 },
    { serviceKey: "TAX_ID_CORPORATE", title: "Corporate Tax ID (TIN)", price: 1000.00 },
    // 🚨 NEW: NIN Slip Prices moved here!
    { serviceKey: "NIN_REGULAR", title: "Regular Official Slip", price: 500.00 },
    { serviceKey: "NIN_STANDARD", title: "Standard Biometric Slip", price: 700.00 },
    { serviceKey: "NIN_PREMIUM", title: "Premium Card Layout", price: 1000.00 }
  ]

  for (const p of prices) {
    await prisma.servicePricing.upsert({
      where: { serviceKey: p.serviceKey },
      // 🚨 CRITICAL FIX: Only update the title. 
      // This leaves the price completely alone if the row already exists in the database!
      update: { title: p.title },
      create: { serviceKey: p.serviceKey, title: p.title, price: p.price },
    })
  }

  // 2. Global Settings
  console.log("Seeding Global Settings...")
  const settings = [
    { key: "SUPPORT_WHATSAPP", value: "2348000000000", description: "Global Customer Support WhatsApp Number" }
  ]

  for (const s of settings) {
    await prisma.globalSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: { key: s.key, value: s.value, description: s.description },
    })
  }
  
  console.log("Global settings seeded successfully.")
}

main()
  .catch((e) => { 
    console.error(e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  })
