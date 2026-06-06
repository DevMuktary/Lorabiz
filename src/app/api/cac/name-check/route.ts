import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { prisma } from "@/lib/prisma"; 

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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, message: "User account or wallet not found." }, { status: 404 });
    }

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
        advanceCheck: true  // <-- Yes, this is correctly set to true here
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

    console.log("\n====== CAC ADVANCED API RESPONSE ======");
    console.log(`PROPOSED NAME: ${uppercaseName}`);
    console.log("PAYLOAD:", JSON.stringify(cacJson, null, 2));
    console.log("=======================================\n");

    // ==========================================
    // 3. SECURE DATABASE DEDUCTION (Ledger Sync)
    // ==========================================
    const newBalance = currentBalance - CHECK_COST;
    const transactionRef = `CAC-CHK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const [updatedWallet] = await prisma.$transaction([
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
    // 4. PARSE CAC ADVANCED RESPONSE (FIXED BUG)
    // ==========================================
    const apiMessage = cacJson.message || "";
    
    // Determine Availability: The API returns success: true because the HTTP connection worked.
    // We MUST parse the message string to see if the name actually exists or conflicts.
    const isNameTaken = apiMessage.toLowerCase().includes("exist") || apiMessage.toLowerCase().includes("conflict");
    const isAvailable = cacJson.success && !isNameTaken;

    const recommendations = cacJson.data?.recommendedActions?.map((action: any) => action.message).join(" ") || "";
    
    // Safely extract suggested names (CAC sometimes returns it as a string, sometimes an array, sometimes null)
    let suggestedNames = [];
    if (Array.isArray(cacJson.data?.suggestedNames)) {
      suggestedNames = cacJson.data.suggestedNames;
    } else if (typeof cacJson.data?.suggestedName === "string") {
      suggestedNames = [cacJson.data.suggestedName];
    }
    
    let rejectionReason = apiMessage;
    if (recommendations) {
      rejectionReason = `${apiMessage}. ${recommendations}`;
    }

    return NextResponse.json({
      success: true, // The internal route worked successfully
      isBlocked: !isAvailable, // Tell frontend to show the RED rejection screen
      rejectionType: !isAvailable ? "CAC_REJECTION" : "PASSED",
      reasonMessage: !isAvailable ? rejectionReason : "Name is available and ready for registration.",
      newWalletBalance: Number(updatedWallet.balance),
      data: {
        mostSimilarName: cacJson.data?.mostSimilarName || "N/A",
        cleansedNameUsed: uppercaseName,
        similarityScore: cacJson.data?.similarityScore || "0%", 
        complianceScore: cacJson.data?.complianceScore || "0%",
        suggestedNames: suggestedNames
      }
    });

  } catch (error) {
    console.error("Gateway Error:", error);
    return NextResponse.json({ success: false, message: "Server connection failed." }, { status: 500 });
  }
}
