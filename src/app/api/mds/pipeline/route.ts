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

    // 2. Fetch counts for NIN Requests (Instant Service)
    const [ninSuccess, ninFailed] = await Promise.all([
      prisma.ninRequestLog.count({ where: { status: "SUCCESS" } }),
      prisma.ninRequestLog.count({ where: { status: "FAILED" } }),
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

    const scumlMetrics = {
      pending: scumlPending + scumlProcessing, // Treating PROCESSING as active pending load
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

    // Calculate Global Totals
    const globalMetrics = {
      pending: cacMetrics.pending + scumlMetrics.pending + taxIdMetrics.pending,
      completed: cacMetrics.completed + ninMetrics.completed + scumlMetrics.completed + taxIdMetrics.completed,
      queried: cacMetrics.queried, // Only CAC has queries currently
      failed: cacMetrics.failed + ninMetrics.failed,
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
          id: "nin",
          name: "Identity Services (NIN)",
          description: "Automated Regular, Standard, and Premium NIN Slip generation API.",
          metrics: ninMetrics,
          subCategories: ["NIN Slips"],
          href: "/quadrox-lorabiz-team/mds/dashboard/orders/nin",
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
