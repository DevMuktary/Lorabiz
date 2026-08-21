import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function calculateYearsDifference(currentDobStr: string, newDobStr: string): { diffYears: number; isOverFiveYears: boolean } {
  const current = new Date(currentDobStr);
  const updated = new Date(newDobStr);

  if (isNaN(current.getTime()) || isNaN(updated.getTime())) {
    return { diffYears: 0, isOverFiveYears: false };
  }

  // Calculate precise day difference to avoid leap year drift
  const diffTime = Math.abs(updated.getTime() - current.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  const diffYears = Number((diffDays / 365.2425).toFixed(2));
  
  // 5 calendar years = 1826 days
  const isOverFiveYears = diffDays > 1826.25;

  return { diffYears, isOverFiveYears };
}

// GET: Fetch prices, user balance, and modification config
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const [user, pricingRows] = await Promise.all([
      prisma.user.findUnique({
        where: { email: session.user.email },
        include: { wallet: true },
      }),
      prisma.servicePricing.findMany({
        where: {
          serviceKey: {
            in: ["BVN_MOD_NAME", "BVN_MOD_PHONE", "BVN_MOD_DOB", "BVN_MOD_DOB_SURCHARGE"],
          },
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const pricingMap: Record<string, number> = {
      BVN_MOD_NAME: 3000,
      BVN_MOD_PHONE: 2500,
      BVN_MOD_DOB: 15000,
      BVN_MOD_DOB_SURCHARGE: 5000,
    };

    for (const p of pricingRows) {
      pricingMap[p.serviceKey] = Number(p.price);
    }

    return NextResponse.json({
      success: true,
      walletBalance: Number(user.wallet?.balance || 0),
      pricing: pricingMap,
    });
  } catch (error: any) {
    console.error("❌ BVN Modification GET Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load BVN modification data." },
      { status: 500 }
    );
  }
}

// POST: Submit a new BVN modification request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const {
      bvn,
      currentFullName,
      modifyName,
      modifyPhone,
      modifyDob,
      newFirstName,
      newLastName,
      newMiddleName,
      currentPhone,
      newPhone,
      currentDob,
      newDob,
      documentUrls,
    } = body;

    // 1. Validation
    const cleanBvn = (bvn || "").trim();
    if (!cleanBvn || !/^\d{11}$/.test(cleanBvn)) {
      return NextResponse.json(
        { success: false, message: "A valid 11-digit BVN is required." },
        { status: 400 }
      );
    }

    if (!currentFullName || currentFullName.trim().length < 3) {
      return NextResponse.json(
        { success: false, message: "Please provide the full legal name currently registered on your BVN." },
        { status: 400 }
      );
    }

    if (!modifyName && !modifyPhone && !modifyDob) {
      return NextResponse.json(
        { success: false, message: "Please select at least one field to modify (Name, Phone Number, or Date of Birth)." },
        { status: 400 }
      );
    }

    // Specific field validations
    if (modifyName) {
      if (!newFirstName?.trim() || !newLastName?.trim()) {
        return NextResponse.json(
          { success: false, message: "New First Name and Last Name are required for Change of Name." },
          { status: 400 }
        );
      }
    }

    if (modifyPhone) {
      const cleanNewPhone = (newPhone || "").trim();
      if (!cleanNewPhone || !/^0\d{10}$/.test(cleanNewPhone)) {
        return NextResponse.json(
          { success: false, message: "A valid 11-digit New Phone Number starting with 0 is required." },
          { status: 400 }
        );
      }
    }

    let surchargeApplied = false;
    let surchargeAmount = 0;
    let yearsDifference: number | null = null;

    if (modifyDob) {
      if (!currentDob || !newDob) {
        return NextResponse.json(
          { success: false, message: "Both current Date of Birth and new Date of Birth are required." },
          { status: 400 }
        );
      }
      const dobCalc = calculateYearsDifference(currentDob, newDob);
      yearsDifference = dobCalc.diffYears;
      surchargeApplied = dobCalc.isOverFiveYears;
    }

    // 2. Fetch Prices from Database
    const pricingRows = await prisma.servicePricing.findMany({
      where: {
        serviceKey: {
          in: ["BVN_MOD_NAME", "BVN_MOD_PHONE", "BVN_MOD_DOB", "BVN_MOD_DOB_SURCHARGE"],
        },
      },
    });

    const pricingMap: Record<string, number> = {
      BVN_MOD_NAME: 3000,
      BVN_MOD_PHONE: 2500,
      BVN_MOD_DOB: 15000,
      BVN_MOD_DOB_SURCHARGE: 5000,
    };

    for (const p of pricingRows) {
      pricingMap[p.serviceKey] = Number(p.price);
    }

    // 3. Compute Total Price
    let totalPrice = 0;
    const selectedFieldsCount = (modifyName ? 1 : 0) + (modifyPhone ? 1 : 0) + (modifyDob ? 1 : 0);
    
    if (modifyName) totalPrice += pricingMap.BVN_MOD_NAME;
    if (modifyPhone) totalPrice += pricingMap.BVN_MOD_PHONE;
    if (modifyDob) {
      totalPrice += pricingMap.BVN_MOD_DOB;
      if (surchargeApplied) {
        surchargeAmount = pricingMap.BVN_MOD_DOB_SURCHARGE;
        totalPrice += surchargeAmount;
      }
    }

    // 4. Fetch User and Check Wallet Balance
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, message: "User wallet not found." }, { status: 404 });
    }

    const currentBalance = Number(user.wallet.balance);
    if (currentBalance < totalPrice) {
      return NextResponse.json(
        {
          success: false,
          isInsufficientBalance: true,
          message: `Insufficient wallet balance. Total cost is ₦${totalPrice.toLocaleString()}, but your balance is ₦${currentBalance.toLocaleString()}.`,
          requiredAmount: totalPrice,
          currentBalance,
        },
        { status: 400 }
      );
    }

    // Determine modification enum type
    let modType: "CHANGE_OF_NAME" | "CHANGE_OF_PHONE" | "CHANGE_OF_DOB" | "COMBINED" = "COMBINED";
    if (selectedFieldsCount === 1) {
      if (modifyName) modType = "CHANGE_OF_NAME";
      else if (modifyPhone) modType = "CHANGE_OF_PHONE";
      else if (modifyDob) modType = "CHANGE_OF_DOB";
    }

    // Generate unique tracking ID & reference
    const trackingSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const trackingId = `BVN-MOD-${trackingSuffix}`;
    const transactionRef = `TX-BVN-MOD-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;

    // 5. Atomic Transaction: Debit Wallet + Log Transaction + Create Request
    const result = await prisma.$transaction(async (tx) => {
      // Debit wallet
      const updatedWallet = await tx.wallet.update({
        where: { userId: user.id },
        data: {
          balance: {
            decrement: totalPrice,
          },
        },
      });

      // Record transaction
      const transaction = await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: totalPrice,
          balanceBefore: currentBalance,
          balanceAfter: Number(updatedWallet.balance),
          type: "DEBIT",
          status: "SUCCESS",
          reference: transactionRef,
          serviceCategory: "BVN",
          description: `BVN Modification Request - ${cleanBvn} (${trackingId})`,
        },
      });

      // Create BVN Modification Request
      const modificationRequest = await tx.bvnModificationRequest.create({
        data: {
          trackingId,
          userId: user.id,
          type: modType,
          status: "PENDING",
          bvn: cleanBvn,
          currentFullName: currentFullName.trim(),
          modifyName: Boolean(modifyName),
          modifyPhone: Boolean(modifyPhone),
          modifyDob: Boolean(modifyDob),
          newFirstName: modifyName ? newFirstName?.trim() : null,
          newLastName: modifyName ? newLastName?.trim() : null,
          newMiddleName: modifyName && newMiddleName ? newMiddleName.trim() : null,
          currentPhone: modifyPhone && currentPhone ? currentPhone.trim() : null,
          newPhone: modifyPhone ? newPhone?.trim() : null,
          currentDob: modifyDob ? currentDob : null,
          newDob: modifyDob ? newDob : null,
          yearsDifference: yearsDifference,
          surchargeApplied: surchargeApplied,
          surchargeAmount: surchargeAmount,
          documentUrls: Array.isArray(documentUrls) ? documentUrls : [],
          amountPaid: totalPrice,
          transactionRef,
        },
      });

      // Send in-app notification
      await tx.inAppNotification.create({
        data: {
          userId: user.id,
          title: "BVN Modification Submitted",
          message: `Your BVN modification request (${trackingId}) for BVN ${cleanBvn} has been received and is being processed by our compliance team.`,
          type: "info",
          link: `/dashboard/bvn/modification/history`,
        },
      });

      return { updatedWallet, transaction, modificationRequest };
    });

    return NextResponse.json({
      success: true,
      message: "BVN modification request submitted successfully.",
      trackingId,
      amountPaid: totalPrice,
      surchargeApplied,
      newBalance: Number(result.updatedWallet.balance),
      request: result.modificationRequest,
    });
  } catch (error: any) {
    console.error("❌ BVN Modification POST Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit BVN modification request." },
      { status: 500 }
    );
  }
}
