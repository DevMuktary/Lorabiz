import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        logs: {
          orderBy: { createdAt: "desc" },
          take: 100, // Retrieve recent delivery logs
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error: any) {
    console.error("Fetch Single Campaign Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const body = await req.json();

    const existing = await prisma.emailCampaign.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft campaigns can be edited." },
        { status: 400 }
      );
    }

    const updated = await prisma.emailCampaign.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title.trim() : existing.title,
        subject: body.subject !== undefined ? body.subject.trim() : existing.subject,
        previewText: body.previewText !== undefined ? body.previewText?.trim() : existing.previewText,
        content: body.content !== undefined ? body.content : existing.content,
        senderName: body.senderName !== undefined ? body.senderName?.trim() : existing.senderName,
        targetAudience: body.targetAudience !== undefined ? body.targetAudience : existing.targetAudience,
      },
    });

    await prisma.staffActionLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATED_EMAIL_CAMPAIGN",
        targetId: id,
        details: `Updated draft campaign "${updated.title}"`,
      },
    });

    return NextResponse.json({
      success: true,
      campaign: updated,
    });
  } catch (error: any) {
    console.error("Update Campaign Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    const existing = await prisma.emailCampaign.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (existing.status === "SENDING") {
      return NextResponse.json(
        { error: "Cannot delete an active campaign currently sending." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.emailCampaign.delete({ where: { id } });
      await tx.staffActionLog.create({
        data: {
          userId: session.user.id,
          action: "DELETED_EMAIL_CAMPAIGN",
          targetId: id,
          details: `Deleted campaign "${existing.title}"`,
        },
      });
    });

    return NextResponse.json({ success: true, message: "Campaign deleted" });
  } catch (error: any) {
    console.error("Delete Campaign Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
