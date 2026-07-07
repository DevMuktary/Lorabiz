import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Fetch counts for Business Registrations in parallel
    const [bizPending, bizApproved, bizQueried, bizFailed] = await Promise.all([
      prisma.businessRegistration.count({ where: { status: "PENDING" } }),
      prisma.businessRegistration.count({ where: { status: "APPROVED" } }),
      prisma.businessRegistration.count({ where: { status: "QUERIED" } }),
      prisma.businessRegistration.count({ where: { status: "FAILED" } }),
    ]);

    // 2. Fetch counts for LLC Registrations in parallel
    const [llcPending, llcApproved, llcQueried, llcFailed] = await Promise.all([
      prisma.llcRegistration.count({ where: { status: "PENDING" } }),
      prisma.llcRegistration.count({ where: { status: "APPROVED" } }),
      prisma.llcRegistration.count({ where: { status: "QUERIED" } }),
      prisma.llcRegistration.count({ where: { status: "FAILED" } }),
    ]);

    // 3. Fetch counts for NIN Requests (Instant service, so no Pending/Queried usually)
    const [ninSuccess, ninFailed] = await Promise.all([
      prisma.ninRequestLog.count({ where: { status: "SUCCESS" } }),
      prisma.ninRequestLog.count({ where: { status: "FAILED" } }),
    ]);

    // --- AGGREGATE LOGIC ---

    const cacMetrics = {
      pending: bizPending + llcPending,
      completed: bizApproved + llcApproved,
      queried: bizQueried + llcQueried,
      failed: bizFailed + llcFailed,
    };

    const ninMetrics = {
      pending: 0, // NIN slips are generated instantly via API
      completed: ninSuccess,
      queried: 0,
      failed: ninFailed,
    };

    const globalMetrics = {
      pending: cacMetrics.pending + ninMetrics.pending,
      completed: cacMetrics.completed + ninMetrics.completed,
      queried: cacMetrics.queried + ninMetrics.queried,
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
          href: "/quadrox-lorabiz-team/mds/dashboard/orders/cac"
        },
        {
          id: "nin",
          name: "Identity Services (NIN)",
          description: "Regular, Standard, and Premium NIN Slip generation and verification.",
          metrics: ninMetrics,
          subCategories: ["NIN Slips"],
          href: "/quadrox-lorabiz-team/mds/dashboard/orders/nin"
        }
      ]
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Pipeline API Error:", error);
    return NextResponse.json({ error: "Failed to fetch pipeline data" }, { status: 500 });
  }
}
