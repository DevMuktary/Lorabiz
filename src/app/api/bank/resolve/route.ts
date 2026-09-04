import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const accountNumber = searchParams.get("accountNumber")?.trim();
    const bankCode = searchParams.get("bankCode")?.trim();

    if (!accountNumber || accountNumber.length !== 10) {
      return NextResponse.json(
        { success: false, message: "A valid 10-digit Nigerian NUBAN account number is required." },
        { status: 400 }
      );
    }

    if (!bankCode) {
      return NextResponse.json(
        { success: false, message: "Please select a bank first." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { firstName: true, lastName: true },
    });

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error("❌ PAYSTACK_SECRET_KEY is missing in environment.");
      return NextResponse.json(
        { success: false, message: "Bank resolution gateway is temporarily unavailable." },
        { status: 500 }
      );
    }

    const paystackRes = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      return NextResponse.json(
        {
          success: false,
          message: paystackData.message || "Could not resolve account with this bank. Please check your account number.",
        },
        { status: 400 }
      );
    }

    const resolvedAccountName = (paystackData.data?.account_name || "").toUpperCase();
    const resolvedAccountNumber = paystackData.data?.account_number || accountNumber;

    // Check if resolved name matches user's registered name on LoraBiz
    const userFirstName = (user?.firstName || "").toLowerCase().trim();
    const userLastName = (user?.lastName || "").toLowerCase().trim();
    const nameLower = resolvedAccountName.toLowerCase();

    const isMatch = Boolean(
      (userFirstName && nameLower.includes(userFirstName)) ||
      (userLastName && nameLower.includes(userLastName))
    );

    const registeredFullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

    return NextResponse.json({
      success: true,
      accountName: resolvedAccountName,
      accountNumber: resolvedAccountNumber,
      isNameMatch: isMatch,
      registeredName: registeredFullName,
    });
  } catch (error: any) {
    console.error("❌ Error resolving bank account:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to resolve bank account." },
      { status: 500 }
    );
  }
}
