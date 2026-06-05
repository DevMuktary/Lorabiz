import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import { prisma } from "@/lib/prisma"; // Adjust path if needed

const CHECK_COST = 100;

export async function POST(req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { proposedName, lineOfBusiness, entityType } = await req.json();

    if (!lineOfBusiness || !entityType || !proposedName) {
      return NextResponse.json({ success: false, message: "Missing required metadata parameters." }, { status: 400 });
    }

    const uppercaseName = proposedName.trim().toUpperCase();

    // ==========================================
    // 1. REAL WALLET BALANCE CHECK
    // ==========================================
    // Include the connected Wallet from the new schema
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, message: "User account or wallet not found." }, { status: 404 });
    }

    // Prisma returns Decimal types as objects, so we convert to a JavaScript Number
    const currentBalance = Number(user.wallet.balance);

    if (currentBalance < CHECK_COST) {
      return NextResponse.json({
        success: false,
        isBlocked: true,
        rejectionType: "INSUFFICIENT_FUNDS",
        reasonMessage: `You need at least ₦${CHECK_COST} in your wallet to perform an Advanced Name Search.`,
        data: null
      });
    }

    // ==========================================
    // 2. CAC ADVANCED LIVE REGISTRY FETCH
    // ==========================================
    const cacApiKey = process.env.CAC_API_KEY;
    if (!cacApiKey) throw new Error("Missing CAC API Key.");

    const cacResponse = await fetch("https://vasapp.cac.gov.ng/api/vas/engine/pre/bn-compliance", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json", "X_API_KEY": cacApiKey },
      body: JSON.stringify({ 
        proposedName: uppercaseName, 
        lineOfBusiness: lineOfBusiness,
        advanceCheck: true 
      }),
    });

    if (!cacResponse.ok) {
      return NextResponse.json({
        success: false,
        isBlocked: true,
        rejectionType: "GATEWAY_TIMEOUT",
        reasonMessage: "Registry connection failed. No funds were deducted. Please try again.",
      });
    }

    const cacJson = await cacResponse.json();

    // ==========================================
    // 🛑 LOGGING BLOCK FOR RAILWAY DEBUGGING 🛑
    // ==========================================
    console.log("\n====== CAC ADVANCED API RESPONSE ======");
    console.log(`PROPOSED NAME: ${uppercaseName}`);
    console.log("PAYLOAD:", JSON.stringify(cacJson, null, 2));
    console.log("=======================================\n");

    // ==========================================
    // 3. SECURE DATABASE DEDUCTION (Ledger Sync)
    // ==========================================
    const newBalance = currentBalance - CHECK_COST;
    // Generate a unique reference for the ledger
    const transactionRef = `CAC-CHK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Use a transaction block to ensure both the wallet decrement and the ledger entry succeed or fail together
    const [updatedWallet, ledgerEntry] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: newBalance }
      }),
      prisma.transaction.create({
        data: {
          walletId: user.wallet.id,
          amount: CHECK_COST,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          type: "DEBIT",
          status: "SUCCESS",
          reference: transactionRef,
          description: `CAC Advanced Name Search: ${uppercaseName}`
        }
      })
    ]);

    // ==========================================
    // 4. PARSE CAC ADVANCED RESPONSE
    // ==========================================
    const isSuccess = cacJson.data?.success ?? true;
    const recommendations = cacJson.data?.recommendedActions?.map((action: any) => action.message).join(" ") || "";
    const suggestedNames = cacJson.data?.suggestedNames || [];
    
    let rejectionReason = cacJson.message;
    if (recommendations) {
      rejectionReason = `${cacJson.message}. ${recommendations}`;
    }

    return NextResponse.json({
      success: true,
      isBlocked: !isSuccess,
      rejectionType: !isSuccess ? "CAC_REJECTION" : "PASSED",
      reasonMessage: !isSuccess ? rejectionReason : "Name is available and ready for registration.",
      newWalletBalance: Number(updatedWallet.balance), // Pass the freshly updated balance back to UI
      data: {
        mostSimilarName: cacJson.data?.similarNames?.[0] || "N/A",
        cleansedNameUsed: uppercaseName,
        similarityScore: cacJson.data?.similarityScorePercentage || 0,
        complianceScore: cacJson.data?.complianceScorePercentage || 0,
        suggestedNames: suggestedNames
      }
    });

  } catch (error) {
    console.error("Gateway Error:", error);
    return NextResponse.json({ success: false, message: "Server connection failed." }, { status: 500 });
  }
}
