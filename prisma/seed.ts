import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding pricing data...")

  // 1. CAC & Statutory Services Pricing
  const prices = [
    {
      serviceKey: "BUSINESS_NAME",
      title: "Business Name Registration",
      price: 29000.00,
    },
    {
      serviceKey: "LLC",
      title: "Limited Liability Company (LTD) - Up to 1M Shares", // ALL-INCLUSIVE Base Price
      price: 35000.00, 
    },
    {
      serviceKey: "LLC_EXTRA_MILLION",
      title: "LLC Additional Fee per 1M Shares", // Multiplier fee for > 1M shares
      price: 15000.00,
    },
    {
      serviceKey: "NGO",
      title: "Incorporated Trustees (NGO)",
      price: 120000.00,
    }
  ]

  for (const p of prices) {
    await prisma.servicePricing.upsert({
      where: { serviceKey: p.serviceKey },
      update: {
        price: p.price,
        title: p.title
      },
      create: {
        serviceKey: p.serviceKey,
        title: p.title,
        price: p.price
      },
    })
  }

  // 2. NIMC / NIN Slip Printing Pricing
  const ninPrices = [
    {
      slipType: "nin_regular",
      displayName: "Regular Official Slip",
      price: 500.00,
    },
    {
      slipType: "nin_standard",
      displayName: "Standard Biometric Slip",
      price: 700.00,
    },
    {
      slipType: "nin_premium",
      displayName: "Premium Card Layout",
      price: 1000.00,
    }
  ]

  for (const np of ninPrices) {
    await prisma.ninSlipPricing.upsert({
      where: { slipType: np.slipType },
      update: {
        displayName: np.displayName,
        price: np.price,
      },
      create: {
        slipType: np.slipType,
        displayName: np.displayName,
        price: np.price,
      },
    })
  }
  
  console.log("Pricing seeded successfully.")

  // 3. Global Settings (Support Contacts, etc.)
  console.log("Seeding Global Settings...")
  
  const settings = [
    {
      key: "SUPPORT_WHATSAPP",
      // Be sure to change this to your actual live WhatsApp number
      value: "2348000000000", 
      description: "Global Customer Support WhatsApp Number",
    }
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
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
