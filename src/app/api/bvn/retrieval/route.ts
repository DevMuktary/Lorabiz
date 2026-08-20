import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateNumericId } from "@/utils/generateId";
import { sendBvnRetrievalSubmittedEmail } from "@/lib/email";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized access. Please log in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ success: false, error: "User account not found." }, { status: 404 });
    }

    const history = await prisma.bvnRetrievalRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error("BVN Retrieval History Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch BVN retrieval history." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized access. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, phone, attestationsAccepted } = body;

    // Validate Full Name
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 3) {
      return NextResponse.json({
        success: false,
        error: "Please enter the full legal name registered on the BVN account.",
      }, { status: 400 });
    }

    // Validate Phone Number
    const cleanedPhone = phone ? String(phone).replace(/\s+/g, "").replace(/^\+234/, "0") : "";
    if (!cleanedPhone || cleanedPhone.length !== 11 || !/^\d{11}$/.test(cleanedPhone)) {
      return NextResponse.json({
        success: false,
        error: "Please enter a valid 11-digit phone number linked to the BVN.",
      }, { status: 400 });
    }

    // Validate Attestation
    if (!attestationsAccepted) {
      return NextResponse.json({
        success: false,
        error: "You must accept the statutory retrieval declaration to proceed.",
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, error: "User account or wallet not found." }, { status: 404 });
    }

    // Dynamic pricing & maintenance check
    const pricing = await prisma.servicePricing.findUnique({
      where: { serviceKey: "BVN_RETRIEVAL" },
    });

    if (pricing && !pricing.isActive) {
      return NextResponse.json({
        success: false,
        error: pricing.maintenanceMsg || "BVN Retrieval service is currently undergoing scheduled maintenance. Please try again shortly.",
      }, { status: 400 });
    }

    const finalPrice = pricing ? Number(pricing.price) : 2500;
    const userBalance = Number(user.wallet.balance);

    if (userBalance < finalPrice) {
      return NextResponse.json({
        success: false,
        error: `Insufficient wallet balance. This service costs ₦${finalPrice.toLocaleString()} but your balance is ₦${userBalance.toLocaleString()}. Please fund your wallet to proceed.`,
      }, { status: 400 });
    }

    const trackingId = `RET-${generateNumericId(6)}`;
    const transactionRef = `BVN-RET-${generateNumericId(8)}`;

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: { decrement: finalPrice } },
      });

      const updatedBalance = Number(updatedWallet.balance);
      const balanceBefore = updatedBalance + finalPrice;

      await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: finalPrice,
          balanceBefore,
          balanceAfter: updatedBalance,
          type: "DEBIT",
          status: "SUCCESS",
          reference: transactionRef,
          serviceCategory: "BVN",
          description: `BVN Retrieval Request (${trackingId}) for ${fullName.trim()}`,
        },
      });

      const request = await tx.bvnRetrievalRequest.create({
        data: {
          trackingId,
          userId: user.id,
          fullName: fullName.trim(),
          phone: cleanedPhone,
          status: "PENDING",
          amountPaid: finalPrice,
          transactionRef,
        },
      });

      return request;
    });

    // Send confirmation email
    try {
      await sendBvnRetrievalSubmittedEmail({
        to: user.email,
        firstName: user.firstName || "Valued Client",
        trackingId: result.trackingId,
        fullName: result.fullName,
        phone: result.phone,
        amountPaid: Number(result.amountPaid),
      });
    } catch (emailErr) {
      console.error("Failed to send BVN Retrieval submission email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Your BVN Retrieval request has been submitted successfully.",
      data: result,
    });
  } catch (error: any) {
    console.error("BVN Retrieval Submission Error:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "An unexpected error occurred while processing your request.",
    }, { status: 500 });
  }
}
