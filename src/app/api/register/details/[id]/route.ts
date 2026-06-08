import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// ==========================================
// FETCH DRAFT DETAILS
// ==========================================
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const registration = await prisma.businessRegistration.findUnique({
      where: { id },
      include: { proprietors: true }
    });

    if (!registration) return NextResponse.json({ message: "Draft not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: registration });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching details" }, { status: 500 });
  }
}

// ==========================================
// SAVE & VALIDATE REGISTRATION (DRAFT OR FINAL)
// ==========================================
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { companyInfo, proprietors, isDraft } = body;

    // --- STRICT BACKEND VALIDATION ON FINAL SUBMIT ---
    if (!isDraft) {
      if (!companyInfo.state || !companyInfo.address) {
        return NextResponse.json({ success: false, message: "Company State and Address are compulsory." }, { status: 400 });
      }

      if (proprietors.length === 0) {
         return NextResponse.json({ success: false, message: "At least one proprietor is required." }, { status: 400 });
      }

      for (const p of proprietors) {
         if (!p.surname || !p.firstName || !p.phone || !p.state || !p.gender || !p.dob || !p.serviceAddress) {
           return NextResponse.json({ success: false, message: `Proprietor ${p.firstName || ''} is missing required fields.` }, { status: 400 });
         }
         if (!p.documents.nin || !p.documents.passport || !p.documents.signature) {
           return NextResponse.json({ success: false, message: `Proprietor ${p.firstName} is missing document uploads.` }, { status: 400 });
         }
      }
    }

    // 1. Update the base registration
    await prisma.businessRegistration.update({
      where: { id },
      data: {
        companyEmail: companyInfo.email || null,
        companyState: companyInfo.state || null,
        companyCity: companyInfo.city || null,
        companyStreetNo: companyInfo.streetNo || null,
        companyAddress: companyInfo.address || null,
        commencementDate: companyInfo.commencementDate || null,
        // If it's a draft, keep old status, otherwise mark PENDING
        status: isDraft ? undefined : "PENDING" 
      }
    });

    // 2. Sync Proprietors (Delete old ones and insert new ones)
    await prisma.proprietor.deleteMany({
      where: { registrationId: id }
    });

    if (proprietors && proprietors.length > 0) {
      const proprietorData = proprietors.map((p: any) => ({
        registrationId: id,
        surname: p.surname,
        firstName: p.firstName,
        otherName: p.otherName || null,
        email: p.email || null,
        phone: p.phone,
        gender: p.gender, 
        dob: p.dob,
        state: p.state,
        lga: p.lga,
        city: p.city || null,
        streetNo: p.streetNo || null,
        serviceAddress: p.serviceAddress,
        ninUrl: p.documents.nin || null,
        passportUrl: p.documents.passport || null,
        signatureUrl: p.documents.signature || null,
      }));

      await prisma.proprietor.createMany({
        data: proprietorData
      });
    }

    return NextResponse.json({ success: true, message: isDraft ? "Draft saved" : "Registration submitted successfully!" });
  } catch (error) {
    console.error("Save Details Error:", error);
    return NextResponse.json({ message: "Failed to save registration details" }, { status: 500 });
  }
}

// ... Keep your existing DELETE route here
