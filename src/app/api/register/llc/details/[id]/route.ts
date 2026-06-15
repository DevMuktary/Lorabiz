import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// ==========================================
// 1. GET: FETCH DRAFT DATA TO POPULATE THE UI
// ==========================================
export async function GET(
  req: Request, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const registration = await prisma.llcRegistration.findUnique({
      where: { id },
      include: { officers: true } // Pull in directors/shareholders too
    });

    if (!registration) {
      return NextResponse.json({ message: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: registration });
  } catch (error) {
    console.error("Fetch LLC Details Error:", error);
    return NextResponse.json({ message: "Error fetching details" }, { status: 500 });
  }
}

// ==========================================
// 2. PUT: AUTOSAVE & FINAL SUBMISSION ENGINE
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
    const { 
      email, principalActivity, specificActivity, description,
      registeredAddress, headOfficeAddress, headOfficeSameAsRegistered,
      useDefaultArticles, witnessDetails, memorandumObjects,
      officers, shareCapital, declarantDetails, isDraft 
    } = body;

    // SECURITY: Ensure they actually own this registration
    const currentReg = await prisma.llcRegistration.findUnique({ where: { id } });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    
    if (!currentReg || !user || currentReg.userId !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // SECURITY: Block edits if already processing or approved
    if (currentReg.status !== "UNSUBMITTED" && currentReg.status !== "QUERIED") {
      return NextResponse.json({ message: "Cannot edit a locked application." }, { status: 403 });
    }

    // --- STRICT FINAL VALIDATION BEFORE CHECKOUT ---
    if (!isDraft) {
      if (!email || !description) {
        return NextResponse.json({ success: false, message: "Company Email and Description are required." }, { status: 400 });
      }
      if (!registeredAddress?.state || !registeredAddress?.street) {
        return NextResponse.json({ success: false, message: "Registered Office Address is incomplete." }, { status: 400 });
      }
      if (!useDefaultArticles && (!witnessDetails?.firstName || !witnessDetails?.signatureUrl)) {
         return NextResponse.json({ success: false, message: "Witness details and signature are required for Articles of Association." }, { status: 400 });
      }
      if (!memorandumObjects || memorandumObjects.length === 0) {
        return NextResponse.json({ success: false, message: "At least one Object of Memorandum is required." }, { status: 400 });
      }
      
      const directors = officers?.filter((o: any) => o.roles.includes("DIRECTOR")) || [];
      if (directors.length === 0) {
        return NextResponse.json({ success: false, message: "At least one Director is required." }, { status: 400 });
      }
      
      const shareholders = officers?.filter((o: any) => o.roles.includes("SHAREHOLDER")) || [];
      if (shareholders.length === 0) {
        return NextResponse.json({ success: false, message: "At least one Shareholder is required." }, { status: 400 });
      }
    }

    // 1. Update the base LLC registration table
    await prisma.llcRegistration.update({
      where: { id },
      data: {
        email: email || null,
        principalActivity: principalActivity || null,
        specificActivity: specificActivity || null,
        description: description || null,
        registeredAddress: registeredAddress || null,
        headOfficeAddress: headOfficeSameAsRegistered ? null : headOfficeAddress,
        useDefaultArticles: useDefaultArticles ?? true,
        witnessDetails: witnessDetails || null,
        memorandumObjects: memorandumObjects || [],
        shareCapital: shareCapital || null,
        declarantDetails: declarantDetails || null,
        // Assuming uploads are merged back into specific models, or stored as JSON if needed globally
      }
    });

    // 2. Sync Officers (Directors, Shareholders, PSCs)
    // To handle dynamic updates perfectly, we delete existing officers and recreate them
    await prisma.companyOfficer.deleteMany({
      where: { registrationId: id }
    });

    if (officers && officers.length > 0) {
      const officerData = officers.map((o: any) => ({
        registrationId: id,
        roles: o.roles,
        surname: o.surname,
        firstName: o.firstName,
        otherName: o.otherName || null,
        dob: o.dob || "",
        gender: o.gender || "",
        nationality: o.nationality || "NIGERIA",
        formerName: o.formerName || null,
        formerNationality: o.formerNationality || null,
        occupation: o.occupation || "",
        phone: o.phone || "",
        email: o.email || "",
        idType: o.idType || null,
        idNumber: o.idNumber || null,
        taxResidency: o.taxResidency || null,
        tin: o.tin || null,
        residentialAddress: o.residentialAddress || null,
        serviceAddress: o.serviceAddress || null,
        sharesAllotted: shareCapital?.allotments?.[o.id] || null,
        pscDetails: o.pscDetails || null,
      }));

      await prisma.companyOfficer.createMany({
        data: officerData
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Data saved securely." 
    });
  } catch (error) {
    console.error("Save LLC Details Error:", error);
    return NextResponse.json({ message: "Failed to save registration details" }, { status: 500 });
  }
}
