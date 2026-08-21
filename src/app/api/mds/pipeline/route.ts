import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: { email: session.user.email, role: { in: ["ADMIN", "STAFF"] } }
    });
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin or Staff access required." }, { status: 403 });
    }
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

    // 2a. Fetch counts for BVN Requests
    const [bvnSuccess, bvnFailed] = await Promise.all([
      prisma.bvnRequestLog.count({ where: { status: "SUCCESS" } }),
      prisma.bvnRequestLog.count({ where: { status: "FAILED" } }),
    ]);

    // 2a-2. Fetch counts for BVN Retrieval Requests
    const [bvnRetPending, bvnRetProcessing, bvnRetCompleted, bvnRetFailed] = await Promise.all([
      prisma.bvnRetrievalRequest.count({ where: { status: "PENDING" } }),
      prisma.bvnRetrievalRequest.count({ where: { status: "PROCESSING" } }),
      prisma.bvnRetrievalRequest.count({ where: { status: "COMPLETED" } }),
      prisma.bvnRetrievalRequest.count({ where: { status: "FAILED" } }),
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

    // 2e. Fetch counts for NIN Modification Requests
    const [modPending, modProcessing, modCompleted, modRejected] = await Promise.all([
      prisma.ninModificationRequest.count({ where: { status: "PENDING" } }),
      prisma.ninModificationRequest.count({ where: { status: "PROCESSING" } }),
      prisma.ninModificationRequest.count({ where: { status: "COMPLETED" } }),
      prisma.ninModificationRequest.count({ where: { status: "REJECTED" } }),
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

    const bvnMetrics = {
      pending: 0,
      completed: bvnSuccess,
      queried: 0,
      failed: bvnFailed,
    };

    const bvnRetrievalMetrics = {
      pending: bvnRetPending + bvnRetProcessing,
      completed: bvnRetCompleted,
      queried: 0,
      failed: bvnRetFailed,
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

    const modificationMetrics = {
      pending: modPending + modProcessing,
      completed: modCompleted,
      queried: 0,
      failed: modRejected,
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
      pending: cacMetrics.pending + scumlMetrics.pending + taxIdMetrics.pending + ipeMetrics.pending + ninValidationMetrics.pending + personalizationMetrics.pending + modificationMetrics.pending + bvnRetrievalMetrics.pending,
      completed: cacMetrics.completed + ninMetrics.completed + bvnMetrics.completed + bvnRetrievalMetrics.completed + ipeMetrics.completed + ninValidationMetrics.completed + personalizationMetrics.completed + modificationMetrics.completed + scumlMetrics.completed + taxIdMetrics.completed + utilityMetrics.completed,
      queried: cacMetrics.queried, 
      failed: cacMetrics.failed + ninMetrics.failed + bvnMetrics.failed + bvnRetrievalMetrics.failed + ipeMetrics.failed + ninValidationMetrics.failed + personalizationMetrics.failed + modificationMetrics.failed,
    };

    // Construct the structured response
    const payload = {
      global: globalMetrics,
      services: [
        {
          id: "bvn-retrieval",
          name: "BVN Number Retrieval",
          description: "Manual retrieval & lookup of forgotten 11-digit Bank Verification Numbers from NIBSS records.",
          metrics: bvnRetrievalMetrics,
          subCategories: ["BVN Retrieval", "Record Search", "Slip Upload"],
          href: "/quadrox-lorabiz-team/mds/dashboard/orders/bvn-retrieval",
          isAutomated: false
        },
        {
          id: "nin-modification",
          name: "NIN Modification Pipeline",
          description: "Change of Name, Phone Number, and Address modification requests with document slip delivery.",
          metrics: modificationMetrics,
          subCategories: ["Change of Name", "Change of Phone", "Change of Address"],
          href: "/quadrox-lorabiz-team/mds/dashboard/orders/nin-modification",
          isAutomated: false
        },
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
          isAutomated: false
        },
        {
          id: "personalization",
          name: "NIN Personalization",
          description: "Tracking ID activation, personalization, and NIN slip retrieval pipeline.",
          metrics: personalizationMetrics,
          subCategories: ["Enrollment Tracking ID", "NIN Activation", "Slip Generation"],
          href: "/quadrox-lorabiz-team/mds/dashboard/orders/personalization",
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
        },
        {
          id: "bvn",
          name: "Identity Services (BVN)",
          description: "Automated Standard and Premium BVN Verification Slip generation API.",
          metrics: bvnMetrics,
          subCategories: ["Standard Slip", "Premium Card Slip"],
          href: "/quadrox-lorabiz-team/mds/dashboard/orders/bvn",
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
