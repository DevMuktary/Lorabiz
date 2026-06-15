import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { 
      proposedName, altName1, altName2, 
      entityType, category, specificNature, 
      similarityScore, ownershipType 
    } = await req.json();

    if (!proposedName || !entityType || !category || !specificNature) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) throw new Error("User not found");

    // ==========================================
    // ROUTE 1: LLC REGISTRATION SAVER
    // ==========================================
    if (entityType === "Company (LLC)") {
      const draft = await prisma.llcRegistration.create({
        data: {
          userId: user.id,
          proposedName: proposedName.toUpperCase(),
          altName1: altName1 ? altName1.toUpperCase() : null,
          altName2: altName2 ? altName2.toUpperCase() : null,
          status: "UNSUBMITTED",
          currentStep: 1,
          principalActivity: category,
          specificActivity: specificNature,
          similarityScore: similarityScore ? similarityScore.toString() : "0",
        }
      });
      return NextResponse.json({ success: true, draftId: draft.id });
    } 
    
    // ==========================================
    // ROUTE 2: BUSINESS NAME REGISTRATION SAVER
    // ==========================================
    else {
      if (!ownershipType) {
         return NextResponse.json({ success: false, message: "Ownership type is required for Business Names." }, { status: 400 });
      }

      const draft = await prisma.businessRegistration.create({
        data: {
          userId: user.id,
          proposedName: proposedName.toUpperCase(),
          altName1: altName1 ? altName1.toUpperCase() : null,
          altName2: altName2 ? altName2.toUpperCase() : null,
          entityType,
          ownershipType, 
          category,
          specificNature,
          status: "UNSUBMITTED",
          similarityScore: similarityScore ? similarityScore.toString() : "0",
        }
      });
      return NextResponse.json({ success: true, draftId: draft.id });
    }

  } catch (error) {
    console.error("Draft Creation Error:", error);
    return NextResponse.json({ success: false, message: "Failed to save draft." }, { status: 500 });
  }
}
