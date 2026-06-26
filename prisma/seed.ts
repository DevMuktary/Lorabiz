import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding pricing data...")

  const prices = [
    {
      serviceKey: "BUSINESS_NAME",
      title: "Business Name Registration",
      price: 29000.00,
    },
    {
      serviceKey: "LLC",
      title: "Limited Liability Company (LTD) - Up to 1M Shares", // ALL-INCLUSIVE Base Price (CAC + Stamp + Processing)
      price: 35000.00, 
    },
    {
      serviceKey: "LLC_EXTRA_MILLION",
      title: "LLC Additional Fee per 1M Shares", // Multiplier fee for > 1M shares
      price: 15000.00, // Adjust this to what you want to charge per extra million
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

  console.log("Pricing seeded successfully.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
