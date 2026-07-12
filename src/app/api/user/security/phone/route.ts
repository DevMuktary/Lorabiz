import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendPhoneChangeOTP } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    
    const userEmail = session.user.email;
    const body = await req.json();
    const { action, newPhone, otpCode } = body;

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // -------------------------------------------------------------------------
    // STEP 1: REQUEST OTP
    // -------------------------------------------------------------------------
    if (action === "SEND_OTP") {
      if (!newPhone) return NextResponse.json({ message: "New phone number is required." }, { status: 400 });

      // Security: Check 30-day limit
      if (user.phoneChangedAt) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        if (user.phoneChangedAt > thirtyDaysAgo) {
          return NextResponse.json({ 
            message: "Security Lock: You can only change your phone number once every 30 days." 
          }, { status: 403 });
        }
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      // Use the standard OTP table you already have for login
      await prisma.otpCode.upsert({
        where: { email: userEmail },
        update: { code: generatedOtp, expiresAt },
        create: { email: userEmail, code: generatedOtp, expiresAt },
      });

      await sendPhoneChangeOTP(userEmail, generatedOtp, newPhone);

      return NextResponse.json({ success: true, message: "Verification code sent to your email." });
    }

    // -------------------------------------------------------------------------
    // STEP 2: VERIFY OTP AND SAVE NUMBER
    // -------------------------------------------------------------------------
    if (action === "VERIFY_OTP") {
      if (!otpCode || !newPhone) return NextResponse.json({ message: "OTP and new phone number are required." }, { status: 400 });

      const existingOtp = await prisma.otpCode.findUnique({ where: { email: userEmail } });

      if (!existingOtp || existingOtp.code !== otpCode || existingOtp.expiresAt < new Date()) {
        return NextResponse.json({ message: "Invalid or expired verification code." }, { status: 400 });
      }

      // Valid OTP! Apply the changes
      await prisma.$transaction([
        prisma.user.update({
          where: { email: userEmail },
          data: {
            oldPhone: user.phone, // Save current to old for fraud tracking
            phone: newPhone,
            phoneChangedAt: new Date() // Trigger the 30-day lock
          }
        }),
        prisma.otpCode.delete({ where: { email: userEmail } }) // Clean up OTP
      ]);

      return NextResponse.json({ success: true, message: "Phone number securely updated." });
    }

    return NextResponse.json({ message: "Invalid action." }, { status: 400 });

  } catch (error) {
    console.error("Phone Security API Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
