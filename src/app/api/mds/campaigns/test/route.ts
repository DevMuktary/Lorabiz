import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendTestCampaignEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { sanitizeEmailHtml } from "@/lib/sanitize-email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { testEmail, subject, previewText, content } = body;

    if (!testEmail || !subject || !content) {
      return NextResponse.json(
        { error: "Recipient email, subject, and content are required for test send." },
        { status: 400 }
      );
    }

    const host = req.headers.get("host") || "lorabiz.com";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const sanitizedContent = sanitizeEmailHtml(content);

    await sendTestCampaignEmail({
      to: testEmail.trim(),
      subject,
      previewText,
      rawContent: sanitizedContent,
      sampleName: session.user?.name || "Admin Reviewer",
      baseUrl,
    });

    // Log the test send in StaffActionLog
    await prisma.staffActionLog.create({
      data: {
        userId: session.user.id,
        action: "SENT_TEST_EMAIL_CAMPAIGN",
        targetId: testEmail.trim(),
        details: `Sent test broadcast for subject: "${subject}" to ${testEmail}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Test email successfully dispatched to ${testEmail}`,
    });
  } catch (error: any) {
    console.error("Test Campaign Send Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send test email" },
      { status: 500 }
    );
  }
}
