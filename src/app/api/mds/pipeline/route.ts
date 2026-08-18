import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Fetch counts for CAC Services (Business Names & LLCs)
    const [bizPending, bizApproved, bizQueried, bizFailed] = await Promise.all([
      prisma.businessRegistration.count({ where: { status: "PENDING" } }),
      prisma.businessRegistration.count({ where: { status: "APPROVED" } }),
      prisma.businessRegistration.count({ where: { status: "QUERIED" } }),
      prisma.businessRegistration.count({ where: { status: "FAILED" } }),
    ]);

    const [llcPending, llcApproved, llcQueried, llcFailed] = await Promise.all([
      prisma.llcRegistration.count({ where: { status: "PENDING" } }),
      prisma.llcRegistration.count({ where: { status: "APPROVED" } }),
      prisma.llcRegistration.count({ where: { status: "QUERIED" } }),
      prisma.llcRegistration.count({ where: { status: "FAILED" } }),
    ]);

    // 2. Fetch counts for NIN Requests
    const [ninSuccess, ninFailed] = await Promise.all([
      prisma.ninRequestLog.count({ where: { status: "SUCCESS" } }),
      prisma.ninRequestLog.count({ where: { status: "FAILED" } }),
    ]);

    // 2b. Fetch counts for IPE Clearance Requests
    const [ipeProcessing, ipeCompleted, ipeFailed] = await Promise.all([
      prisma.ninIpeRequest.count({ where: { status: "PROCESSING" } }),
      prisma.ninIpeRequest.count({ where: { status: "COMPLETED" } }),
      prisma.ninIpeRequest.count({ where: { status: "FAILED" } }),
    ]);

    // 2c. Fetch counts for NIN Validation Requests
    const [valProcessing, valCompleted, valFailed] = await Promise.all([
      prisma.ninValidationRequest.count({ where: { status: "PROCESSING" } }),
      prisma.ninValidationRequest.count({ where: { status: "COMPLETED" } }),
      prisma.ninValidationRequest.count({ where: { status: "FAILED" } }),
    ]);

    // 2d. Fetch counts for NIN Personalization Requests
    const [pznProcessing, pznCompleted, pznFailed] = await Promise.all([
      prisma.ninPersonalizationRequest.count({ where: { status: "PROCESSING" } }),
      prisma.ninPersonalizationRequest.count({ where: { status: "COMPLETED" } }),
      prisma.ninPersonalizationRequest.count({ where: { status: "FAILED" } }),
    ]);

    // 3. Fetch counts for SCUML
    const [scumlPending, scumlProcessing, scumlCompleted] = await Promise.all([
      prisma.scumlRegistration.count({ where: { status: "PENDING" } }),
      prisma.scumlRegistration.count({ where: { status: "PROCESSING" } }),
      prisma.scumlRegistration.count({ where: { status: "COMPLETED" } }),
    ]);

    // 4. Fetch counts for Tax ID
    const [taxPending, taxProcessing, taxCompleted] = await Promise.all([
      prisma.taxIdRequest.count({ where: { status: "PENDING" } }),
      prisma.taxIdRequest.count({ where: { status: "PROCESSING" } }),
      prisma.taxIdRequest.count({ where: { status: "COMPLETED" } }),
    ]);

    // 5. Fetch counts for Utilities (Airtime/Data) from the master Transaction Ledger
    // Note: The Airtime API currently only logs SUCCESS to the DB. Failed attempts are rejected before logging.
    const airtimeCompleted = await prisma.transaction.count({
      where: { serviceCategory: "UTILITIES", status: "SUCCESS" }
    });

    // --- AGGREGATE LOGIC ---

    const cacMetrics = {
      pending: bizPending + llcPending,
      completed: bizApproved + llcApproved,
      queried: bizQueried + llcQueried,
      failed: bizFailed + llcFailed,
    };

    const ninMetrics = {
      pending: 0, 
      completed: ninSuccess,
      queried: 0,
      failed: ninFailed,
    };

    const ipeMetrics = {
      pending: ipeProcessing,
      completed: ipeCompleted,
      queried: 0,
      failed: ipeFailed,
    };

    const ninValidationMetrics = {
      pending: valProcessing,
      completed: valCompleted,
      queried: 0,
      failed: valFailed,
    };

    const personalizationMetrics = {
      pending: pznProcessing,
      completed: pznCompleted,
      queried: 0,
      failed: pznFailed,
    };

    const scumlMetrics = {
      pending: scumlPending + scumlProcessing, 
      completed: scumlCompleted,
      queried: 0,
      failed: 0,
    };

    const taxIdMetrics = {
      pending: taxPending + taxProcessing, 
      completed: taxCompleted,
      queried: 0,
      failed: 0,
    };

    const utilityMetrics = {
      pending: 0, // Instant automated API
      completed: airtimeCompleted,
      queried: 0,
      failed: 0, // Currently not logging external API failures to the DB
    };

    // Calculate Global Totals
    const globalMetrics = {
      pending: cacMetrics.pending + scumlMetrics.pending + taxIdMetrics.pending + ipeMetrics.pending + ninValidationMetrics.pending + personalizationMetrics.pending,
      completed: cacMetrics.completed + ninMetrics.completed + ipeMetrics.completed + ninValidationMetrics.completed + personalizationMetrics.completed + scumlMetrics.completed + taxIdMetrics.completed + utilityMetrics.completed,
      queried: cacMetrics.queried, 
      failed: cacMetrics.failed + ninMetrics.failed + ipeMetrics.failed + ninValidationMetrics.failed + personalizationMetrics.failed,
    };

    // Construct the structured response
    const payload = {
      global: globalMetrics,
      services: [
        {
          id: "cac",
          name: "CAC Services",
          description: "Business Names, Limited Liability Companies, and Post-Incorporation.",
          metrics: cacMetrics,
          subCategories: ["Business Names", "LLC Formations"],
          href: "/quadrox-lorabiz-team/mds/dashboard/orders/cac",
          isAutomated: false
        },
        {
          id: "nin-validation",
          name: "NIN Validation Pipeline",
          description: "Manual operations ledger for No Record Found, VNIN, and Mod Validation requests.",
          metrics: ninValidationMetrics,
          subCategories: ["No Record Found", "VNIN Validation", "Update Record (Mod)"],
          href: "/quadrox-lorabiz-team/mds/dashboard/orders/nin-validation",
          isAutomated: false
        },
        {
          id: "scuml",
          name: "EFCC SCUML Certificates",
          description: "Anti-Money laundering certificates for NGOs and specific business types.",
          metrics: scumlMetrics,
          subCategories: ["Business Names", "LLCs", "NGOs"],
          href: "/quadrox-lorabiz-team/mds/dashboard/orders/scuml",
          isAutomated: false
        },
        {
          id: "tax-id",
          name: "Tax ID (TIN) Generation",
          description: "Individual and Corporate Tax Identification Numbers via JTB.",
          metrics: taxIdMetrics,
          subCategories: ["Individual TIN", "Corporate TIN"],
          href: "/quadrox-lorabiz-team/mds/dashboard/orders/tax-id",
          isAutomated: false
        },
        {
          id: "ipe",
          name: "NIMC IPE Clearance",
          description: "Resolution gateway for In-Processing Errors on National Identity Number tracking IDs.",
          metrics: ipeMetrics,
          subCategories: ["In-Processing Error", "NIMC Tracking ID", "Automated / Manual Sync"],
          href: "/quadrox-lorabiz-team/mds/dashboard/orders/ipe",
          isAutomated: true
        },
        {
          id: "personalization",
          name: "NIN Personalization",
          description: "Tracking ID activation, personalization, and NIN slip retrieval pipeline.",
          metrics: personalizationMetrics,
          subCategories: ["Enrollment Tracking ID", "NIN Activation", "Slip Generation"],
          href: "/quadrox-lorabiz-team/mds/dashboard/orders/personalization",
          isAutomated: true
        },
        {
          id: "nin",
          name: "Identity Services (NIN)",
          description: "Automated Regular, Standard, and Premium NIN Slip generation API.",
          metrics: ninMetrics,
          subCategories: ["NIN Slips"],
          href: "/quadrox-lorabiz-team/mds/dashboard/orders/nin",
          isAutomated: true
        },
        {
          id: "utilities",
          name: "Utility Vending",
          description: "Automated Airtime & Data VTU via external API integration.",
          metrics: utilityMetrics,
          subCategories: ["Airtime Recharge", "Data Plans"],
          href: "#", // Placeholder until you build the MDS view for Utilities
          isAutomated: true
        }
      ]
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Pipeline API Error:", error);
    return NextResponse.json({ error: "Failed to fetch pipeline data" }, { status: 500 });
  }
}
