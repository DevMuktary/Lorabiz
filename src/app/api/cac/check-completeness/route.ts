import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { id, type } = await req.json();
    if (!id || !type) return NextResponse.json({ message: "Invalid request" }, { status: 400 });

    const missingFields: string[] = [];

    if (type === "BUSINESS_NAME") {
      const reg = await prisma.businessRegistration.findUnique({
        where: { id },
        include: { proprietors: true }
      });
      if (!reg) return NextResponse.json({ message: "Registration not found" }, { status: 404 });

      if (!reg.proposedName) missingFields.push("Proposed Business Name");
      if (!reg.specificNature) missingFields.push("Nature of Business");
      if (!reg.companyAddress) missingFields.push("Business Address");
      
      if (!reg.proprietors || reg.proprietors.length === 0) {
        missingFields.push("Proprietor Details");
      } else {
        // Ensure all proprietors have uploaded their documents
        reg.proprietors.forEach((p, index) => {
          if (!p.ninUrl || !p.passportUrl || !p.signatureUrl) {
            missingFields.push(`Proprietor ${index + 1} Documents (NIN, Passport, or Signature)`);
          }
        });
      }
    } else {
      // LLC / NGO logic
      const reg = await prisma.llcRegistration.findUnique({
        where: { id },
        include: { officers: true }
      });
      if (!reg) return NextResponse.json({ message: "Registration not found" }, { status: 404 });

      if (!reg.proposedName) missingFields.push("Proposed Company Name");
      if (!reg.registeredAddress) missingFields.push("Registered Address");
      if (!reg.totalShareCapital && type === "LLC") missingFields.push("Share Capital");
      
      if (!reg.officers || reg.officers.length === 0) {
        missingFields.push("Company Officers (Directors/Shareholders)");
      } else {
        reg.officers.forEach((officer, index) => {
          if (!officer.idDocumentUrl || !officer.signatureUrl) {
            missingFields.push(`Officer ${officer.firstName} Documents (ID or Signature)`);
          }
        });
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json({ 
        isComplete: false, 
        message: "Your application is missing required details.", 
        missingFields 
      }, { status: 200 });
    }

    return NextResponse.json({ isComplete: true }, { status: 200 });

  } catch (error) {
    console.error("Completeness Check Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
