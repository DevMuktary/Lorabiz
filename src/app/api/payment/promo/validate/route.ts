import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 1. Authenticate the User
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized access." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User profile not found." }, { status: 404 });
    }

    // 2. Parse Request Body
    const body = await req.json();
    const { code, service, originalAmount } = body;

    if (!code || !service || originalAmount === undefined) {
      return NextResponse.json({ success: false, message: "Missing required fields (code, service, originalAmount)." }, { status: 400 });
    }

    const normalizedCode = code.toUpperCase().trim();
    const amount = Number(originalAmount);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, message: "Invalid original amount provided." }, { status: 400 });
    }

    // 3. Fetch Promo Code from Database
    const promo = await prisma.promoCode.findUnique({
      where: { code: normalizedCode }
    });

    if (!promo) {
      return NextResponse.json({ success: false, message: "Invalid promo code." }, { status: 404 });
    }

    // 4. Strict Validation Checks
    
    // A. Is the code active?
    if (!promo.isActive) {
      return NextResponse.json({ success: false, message: "This promo code is currently inactive." }, { status: 400 });
    }

    // B. Has the code expired?
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, message: "This promo code has expired." }, { status: 400 });
    }

    // C. Has the global limit been reached?
    if (promo.usageLimit !== null && promo.timesUsed >= promo.usageLimit) {
      return NextResponse.json({ success: false, message: "This promo code has reached its maximum global usage limit." }, { status: 400 });
    }

    // D. Is it restricted to specific services?
    // Note: The schema array should look like ["ALL"] or ["BUSINESS_NAME", "LLC"]
    const isAllowedService = promo.restrictedServices.includes("ALL") || promo.restrictedServices.includes(service.toUpperCase());
    
    if (!isAllowedService) {
      return NextResponse.json({ 
        success: false, 
        message: `This promo code cannot be used for ${service.replace(/_/g, " ")} services.` 
      }, { status: 400 });
    }

    // E. Has this specific user reached their personal limit?
    const userUsagesCount = await prisma.promoUsage.count({
      where: { 
        promoId: promo.id, 
        userId: user.id 
      }
    });

    if (userUsagesCount >= promo.perUserLimit) {
      return NextResponse.json({ 
        success: false, 
        message: `You have already used this promo code the maximum allowed times (${promo.perUserLimit}).` 
      }, { status: 400 });
    }

    // 5. Calculate the Discount Math
    let discountAmount = 0;
    
    if (promo.fixedAmount) {
      // Fixed Naira deduction
      discountAmount = Number(promo.fixedAmount);
    } else if (promo.discountPct) {
      // Percentage deduction
      discountAmount = (amount * Number(promo.discountPct)) / 100;
    }

    // Ensure we don't discount more than the actual price (no negative totals!)
    if (discountAmount > amount) {
      discountAmount = amount;
    }

    let finalAmount = amount - discountAmount;
    
    // Safety check just in case
    if (finalAmount < 0) finalAmount = 0;

    // 6. Return the validated Math to the frontend
    return NextResponse.json({
      success: true,
      message: "Promo code applied successfully!",
      data: {
        code: promo.code,
        originalAmount: amount,
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        type: promo.fixedAmount ? "FIXED" : "PERCENTAGE",
        value: promo.fixedAmount ? Number(promo.fixedAmount) : Number(promo.discountPct)
      }
    });

  } catch (error: any) {
    console.error("❌ Promo Validation API Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error while validating promo code." }, { status: 500 });
  }
}
