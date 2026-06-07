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
// SAVE FULL REGISTRATION PROGRESS
// ==========================================
export async function PUT(
  req: Request, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15+ requires params to be awaited
    const { id } = await props.params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { companyInfo, proprietors } = body;

    // 1. Update the base registration with Company Info
    await prisma.businessRegistration.update({
      where: { id },
      data: {
        companyEmail: companyInfo.email,
        companyState: companyInfo.state,
        companyCity: companyInfo.city,
        companyStreetNo: companyInfo.streetNo,
        companyAddress: companyInfo.address,
        commencementDate: companyInfo.commencementDate,
        // Mark it as PENDING since they've submitted the full details
        status: "PENDING" 
      }
    });

    // 2. Sync Proprietors (Delete old ones and insert new ones to avoid complex updates)
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
        city: p.city,
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

    return NextResponse.json({ success: true, message: "Registration submitted successfully!" });
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
    // Next.js 15+ requires params to be awaited
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
