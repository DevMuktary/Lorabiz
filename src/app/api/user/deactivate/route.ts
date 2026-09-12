import { NextResponse } from "next/server";
import { getMobileAuthUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getMobileAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    // SOFT-DELETE ONLY: Deactivate account access, mark suspended, but preserve 100% data
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isSuspended: true,
      },
    });

    // Log security audit record
    await prisma.securityAuditLog.create({
      data: {
        email: user.email,
        role: user.role,
        event: "ACCOUNT_DEACTIVATED_BY_USER",
        ipAddress: req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Mobile Client",
        userAgent: req.headers.get("user-agent") || "Lorabiz Mobile App",
        details: "User initiated account deactivation from mobile settings. Historical records retained for compliance.",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your account has been deactivated successfully.",
    });
  } catch (error: any) {
    console.error("Account deactivation error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to deactivate account." },
      { status: 500 }
    );
  }
}
