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

    // ADDED: ownershipType, altName1, altName2
    const { 
      proposedName, altName1, altName2, 
      entityType, category, specificNature, 
      similarityScore, ownershipType 
    } = await req.json();

    if (!proposedName || !entityType || !category || !specificNature || !ownershipType) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) throw new Error("User not found");

    // Save the verified name as a draft
    const draft = await prisma.businessRegistration.create({
      data: {
        userId: user.id,
        proposedName: proposedName.toUpperCase(),
        altName1: altName1 ? altName1.toUpperCase() : null,
        altName2: altName2 ? altName2.toUpperCase() : null,
        entityType,
        ownershipType, // This is what Step 3 relies on!
        category,
        specificNature,
        status: "UNSUBMITTED",
        similarityScore: similarityScore ? similarityScore.toString() : "0",
      }
    });

    return NextResponse.json({ success: true, draftId: draft.id });

  } catch (error) {
    console.error("Draft Creation Error:", error);
    return NextResponse.json({ success: false, message: "Failed to save draft." }, { status: 500 });
  }
}
