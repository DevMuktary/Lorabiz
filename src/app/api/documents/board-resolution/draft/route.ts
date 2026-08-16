import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { BoardResolutionFormData } from "@/lib/board-resolution-generator";

export const dynamic = "force-dynamic";

/**
 * POST: Create or update an unsubmitted Board Resolution draft
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized. Please log in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const body = await req.json();
    const { draftId, formData, currentStep = 1 } = body as {
      draftId?: string;
      formData: Partial<BoardResolutionFormData>;
      currentStep?: number;
    };

    if (!formData) {
      return NextResponse.json({ success: false, message: "Form data is required." }, { status: 400 });
    }

    const companyName = (formData.companyName || "Untitled Resolution Draft").trim();
    const title = formData.targetInstitution 
      ? `Board Resolution - ${formData.targetInstitution} (${formData.purposeCategory === "PAYMENT_GATEWAY" ? "Payment Gateway" : "Corporate Account"})`
      : `Board Resolution Draft - ${companyName}`;

    // Payload to store
    const fullDraftPayload = {
      ...formData,
      savedCurrentStep: currentStep,
    };

    // If draftId is provided, update existing draft
    if (draftId) {
      const existing = await prisma.generatedDocument.findFirst({
        where: { id: draftId, userId: user.id }
      });

      if (existing) {
        const updated = await prisma.generatedDocument.update({
          where: { id: draftId },
          data: {
            title: title,
            companyName: companyName,
            accentColor: formData.accentColor || "#0f172a",
            logoUrl: formData.logoUrl || null,
            formData: fullDraftPayload as any,
            updatedAt: new Date(),
          }
        });

        return NextResponse.json({
          success: true,
          message: "Draft saved successfully.",
          draftId: updated.id,
          updatedAt: updated.updatedAt
        });
      }
    }

    // Otherwise, create a new draft
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const draftRef = `DRAFT_BR_${Date.now()}_${randomSuffix}`;

    const created = await prisma.generatedDocument.create({
      data: {
        userId: user.id,
        documentType: "BOARD_RESOLUTION",
        title: title,
        companyName: companyName,
        status: "DRAFT",
        accentColor: formData.accentColor || "#0f172a",
        logoUrl: formData.logoUrl || null,
        formData: fullDraftPayload as any,
        amountPaid: 0,
        transactionRef: draftRef,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Draft created successfully.",
      draftId: created.id,
      updatedAt: created.updatedAt
    });

  } catch (error: any) {
    console.error("Save Draft Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error?.message || "Failed to save resolution draft." 
    }, { status: 500 });
  }
}

/**
 * GET: Fetch a draft by ID
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "Draft ID is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const draft = await prisma.generatedDocument.findFirst({
      where: { id: id, userId: user.id }
    });

    if (!draft) {
      return NextResponse.json({ success: false, message: "Draft not found or unauthorized access." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      draft: draft,
      data: draft
    });

  } catch (error: any) {
    console.error("Fetch Draft Error:", error);
    return NextResponse.json({ success: false, message: "Failed to load draft." }, { status: 500 });
  }
}

/**
 * DELETE: Delete a draft
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "Draft ID is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const draft = await prisma.generatedDocument.findFirst({
      where: { id: id, userId: user.id }
    });

    if (!draft) {
      return NextResponse.json({ success: false, message: "Draft not found." }, { status: 404 });
    }

    await prisma.generatedDocument.delete({
      where: { id: id }
    });

    return NextResponse.json({
      success: true,
      message: "Draft deleted successfully."
    });

  } catch (error: any) {
    console.error("Delete Draft Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete draft." }, { status: 500 });
  }
}
