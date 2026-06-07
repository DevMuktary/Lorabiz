import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// FETCH DRAFT DETAILS
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const registration = await prisma.businessRegistration.findUnique({
      where: { id: params.id },
      include: { proprietors: true } // Pull existing proprietors if any
    });

    if (!registration) {
      return NextResponse.json({ message: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: registration });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching details" }, { status: 500 });
  }
}

// SAVE FULL REGISTRATION PROGRESS
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { companyInfo, proprietors } = body;

    // 1. Update the base registration with Company Info
    await prisma.businessRegistration.update({
      where: { id: params.id },
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
      where: { registrationId: params.id }
    });

    if (proprietors && proprietors.length > 0) {
      const proprietorData = proprietors.map((p: any) => ({
        registrationId: params.id,
        surname: p.surname,
        firstName: p.firstName,
        otherName: p.otherName || null,
        email: p.email || null,
        phone: p.phone,
        gender: p.gender, // Assuming this aligns with Prisma Enum (MALE/FEMALE/OTHER)
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
