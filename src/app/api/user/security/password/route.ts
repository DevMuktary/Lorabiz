import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendPasswordChangeOTP } from "@/lib/email";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const userEmail = session.user.email;
    const body = await req.json();
    const { action, currentPassword, newPassword, otpCode } = body;

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user || !user.passwordHash) return NextResponse.json({ message: "Invalid account state." }, { status: 400 });

    // -------------------------------------------------------------------------
    // STEP 1: VERIFY CURRENT PASSWORD & SEND OTP
    // -------------------------------------------------------------------------
    if (action === "SEND_OTP") {
      if (!currentPassword) return NextResponse.json({ message: "Current password is required." }, { status: 400 });

      // Verify they actually know their current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ message: "Incorrect current password." }, { status: 403 });
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      await prisma.otpCode.upsert({
        where: { email: userEmail },
        update: { code: generatedOtp, expiresAt },
        create: { email: userEmail, code: generatedOtp, expiresAt },
      });

      await sendPasswordChangeOTP(userEmail, generatedOtp);

      return NextResponse.json({ success: true, message: "Verification code sent to your email." });
    }

    // -------------------------------------------------------------------------
    // STEP 2: VERIFY OTP AND HASH/SAVE NEW PASSWORD
    // -------------------------------------------------------------------------
    if (action === "VERIFY_OTP") {
      if (!otpCode || !newPassword) return NextResponse.json({ message: "OTP and new password are required." }, { status: 400 });

      const existingOtp = await prisma.otpCode.findUnique({ where: { email: userEmail } });

      if (!existingOtp || existingOtp.code !== otpCode || existingOtp.expiresAt < new Date()) {
        return NextResponse.json({ message: "Invalid or expired verification code." }, { status: 400 });
      }

      // Valid OTP! Hash the new password and apply
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      await prisma.$transaction([
        prisma.user.update({
          where: { email: userEmail },
          data: { passwordHash: hashedNewPassword }
        }),
        prisma.otpCode.delete({ where: { email: userEmail } })
      ]);

      return NextResponse.json({ success: true, message: "Password securely updated." });
    }

    return NextResponse.json({ message: "Invalid action." }, { status: 400 });

  } catch (error) {
    console.error("Password Security API Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
