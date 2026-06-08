import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// ==========================================
// FETCH DRAFT DETAILS
// ==========================================
export async function GET(
  req: Request, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15+ requires params to be awaited
    const { id } = await props.params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const registration = await prisma.businessRegistration.findUnique({
      where: { id },
      include: { proprietors: true } // Pull existing proprietors if any
    });

    if (!registration) {
      return NextResponse.json({ message: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: registration });
  } catch (error) {
    console.error("Fetch Details Error:", error);
    return NextResponse.json({ message: "Error fetching details" }, { status: 500 });
  }
}

// ==========================================
// SAVE & VALIDATE REGISTRATION (DRAFT OR FINAL)
// ==========================================
export async function PUT(
  req: Request, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { companyInfo, proprietors, isDraft } = body;

    // --- STRICT BACKEND VALIDATION ON FINAL SUBMIT ---
    if (!isDraft) {
      // 1. Validate Company Info
      if (!companyInfo.state || !companyInfo.address) {
        return NextResponse.json({ success: false, message: "Company State and Address are compulsory." }, { status: 400 });
      }

      // 2. Validate Proprietor Counts based on Ownership Type
      if (!proprietors || proprietors.length === 0) {
         return NextResponse.json({ success: false, message: "At least one proprietor is required." }, { status: 400 });
      }

      const currentReg = await prisma.businessRegistration.findUnique({ where: { id } });
      if (currentReg?.ownershipType === "SOLE" && proprietors.length !== 1) {
        return NextResponse.json({ success: false, message: "Sole Proprietorship requires exactly 1 proprietor." }, { status: 400 });
      }
      if (currentReg?.ownershipType !== "SOLE" && proprietors.length < 2) {
        return NextResponse.json({ success: false, message: "Partnerships require at least 2 proprietors." }, { status: 400 });
      }

      // 3. Validate Individual Proprietor Data & Documents
      for (const p of proprietors) {
         if (!p.surname || !p.firstName || !p.phone || !p.state || !p.gender || !p.dob || !p.serviceAddress) {
           return NextResponse.json({ success: false, message: `Proprietor ${p.firstName || ''} is missing required fields.` }, { status: 400 });
         }
         if (!p.documents?.nin || !p.documents?.passport || !p.documents?.signature) {
           return NextResponse.json({ success: false, message: `Proprietor ${p.firstName} is missing document uploads.` }, { status: 400 });
         }
      }
    }

    // 1. Update the base registration with Company Info
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

    // 2. Sync Proprietors (Delete old ones and insert new ones to avoid complex diffing)
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
        ninUrl: p.documents?.nin || null,
        passportUrl: p.documents?.passport || null,
        signatureUrl: p.documents?.signature || null,
      }));

      await prisma.proprietor.createMany({
        data: proprietorData
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: isDraft ? "Draft saved securely." : "Registration submitted successfully!" 
    });
  } catch (error) {
    console.error("Save Details Error:", error);
    return NextResponse.json({ message: "Failed to save registration details" }, { status: 500 });
  }
}

// ==========================================
// DELETE DRAFT
// ==========================================
export async function DELETE(
  req: Request, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Validate user identity securely
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Verify ownership of the draft before deletion
    const registration = await prisma.businessRegistration.findUnique({
      where: { id }
    });

    if (!registration || registration.userId !== user.id) {
      return NextResponse.json({ message: "Unauthorized action. You do not own this application." }, { status: 403 });
    }

    // Prisma's "onDelete: Cascade" rule from our schema will automatically delete all 
    // linked Proprietors and Documents attached to this registration when it is dropped.
    await prisma.businessRegistration.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Application successfully deleted." });
  } catch (error) {
    console.error("Delete Draft Error:", error);
    return NextResponse.json({ message: "Failed to delete the application." }, { status: 500 });
  }
}
