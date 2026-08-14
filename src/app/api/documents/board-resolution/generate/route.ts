import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { 
  BoardResolutionFormData, 
  generateAIBoardResolution, 
  generateDeterministicResolution 
} from "@/lib/board-resolution-generator";
import { sendDocumentGeneratedEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const { formData, paymentMethod = "WALLET", promoCode, pdfBase64, imageBase64, draftId } = body as {
      formData: BoardResolutionFormData;
      paymentMethod?: "WALLET" | "ONLINE";
      promoCode?: string;
      pdfBase64?: string;
      imageBase64?: string;
      draftId?: string;
    };

    if (!formData || !formData.companyName || !formData.registeredAddress || !formData.targetInstitution) {
      return NextResponse.json({ 
        success: false, 
        message: "Missing required company or institution details." 
      }, { status: 400 });
    }

    // 1. Fetch user & wallet
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, message: "User account or wallet not found." }, { status: 404 });
    }

    // 2. Pricing calculation
    const pricingRecord = await prisma.servicePricing.findUnique({
      where: { serviceKey: "DOC_BOARD_RESOLUTION" }
    });
    const basePrice = pricingRecord ? Number(pricingRecord.price) : 3500;

    let finalPrice = basePrice;
    let appliedPromoId: string | null = null;

    if (promoCode) {
      const normalizedCode = promoCode.toUpperCase().trim();
      const promo = await prisma.promoCode.findUnique({ where: { code: normalizedCode } });

      if (promo && promo.isActive) {
        const isAllowed = promo.restrictedServices.includes("ALL") || promo.restrictedServices.includes("DOC_BOARD_RESOLUTION") || promo.restrictedServices.includes("DOCUMENTS");
        const usageCount = await prisma.promoUsage.count({ where: { promoId: promo.id, userId: user.id } });
        const hasNotExceeded = promo.perUserLimit === null || usageCount < promo.perUserLimit;

        if (isAllowed && hasNotExceeded) {
          let discount = 0;
          if (promo.fixedAmount) discount = Number(promo.fixedAmount);
          else if (promo.discountPct) discount = (basePrice * Number(promo.discountPct)) / 100;
          finalPrice = Math.max(0, Math.round(basePrice - discount));
          appliedPromoId = promo.id;
        }
      }
    }

    // 3. Process Wallet Payment
    if (paymentMethod === "WALLET") {
      const currentBalance = Number(user.wallet.balance);
      if (currentBalance < finalPrice) {
        return NextResponse.json({ 
          success: false, 
          message: `Insufficient wallet balance. Price is ₦${finalPrice.toLocaleString()}, but your balance is ₦${currentBalance.toLocaleString()}. Please fund your wallet.` 
        }, { status: 400 });
      }

      const txReference = `DOC_BR_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      // Generate full structured resolution
      let structuredResolution;
      try {
        structuredResolution = await generateAIBoardResolution(formData);
      } catch (e) {
        structuredResolution = generateDeterministicResolution(formData);
      }

      const docTitle = `Board Resolution - ${formData.targetInstitution} (${formData.purposeCategory === "PAYMENT_GATEWAY" ? "Payment Gateway" : "Corporate Account"})`;

      const result = await prisma.$transaction(async (tx) => {
        // Debit wallet
        const updatedWallet = await tx.wallet.update({
          where: { id: user.wallet!.id },
          data: { balance: { decrement: finalPrice } }
        });

        // Record Ledger Transaction
        await tx.transaction.create({
          data: {
            walletId: user.wallet!.id,
            amount: finalPrice,
            balanceBefore: currentBalance,
            balanceAfter: Number(updatedWallet.balance),
            type: "DEBIT",
            status: "SUCCESS",
            reference: txReference,
            description: `Smart Legal Document: ${docTitle}`,
            serviceCategory: "SMART_DOCUMENTS"
          }
        });

        // Update Promo usage if applicable
        if (appliedPromoId) {
          await tx.promoCode.update({
            where: { id: appliedPromoId },
            data: { timesUsed: { increment: 1 } }
          });
          await tx.promoUsage.create({
            data: { promoId: appliedPromoId, userId: user.id }
          });
        }

        // Create or Update Generated Document Record
        let createdDoc;
        if (draftId) {
          const existingDraft = await tx.generatedDocument.findFirst({
            where: { id: draftId, userId: user.id }
          });
          if (existingDraft) {
            createdDoc = await tx.generatedDocument.update({
              where: { id: draftId },
              data: {
                title: docTitle,
                companyName: formData.companyName,
                status: "COMPLETED",
                accentColor: formData.accentColor || "#0f172a",
                logoUrl: formData.logoUrl || null,
                formData: formData as any,
                structuredData: structuredResolution as any,
                pdfUrl: pdfBase64 || null,
                imageUrl: imageBase64 || null,
                amountPaid: finalPrice,
                transactionRef: txReference,
                updatedAt: new Date()
              }
            });
          }
        }

        if (!createdDoc) {
          createdDoc = await tx.generatedDocument.create({
            data: {
              userId: user.id,
              documentType: "BOARD_RESOLUTION",
              title: docTitle,
              companyName: formData.companyName,
              status: "COMPLETED",
              accentColor: formData.accentColor || "#0f172a",
              logoUrl: formData.logoUrl || null,
              formData: formData as any,
              structuredData: structuredResolution as any,
              pdfUrl: pdfBase64 || null,
              imageUrl: imageBase64 || null,
              amountPaid: finalPrice,
              transactionRef: txReference
            }
          });
        }

        return createdDoc;
      });

      // Send confirmation email with PDF attachment
      try {
        await sendDocumentGeneratedEmail({
          to: user.email,
          firstName: user.firstName,
          documentTitle: docTitle,
          companyName: formData.companyName,
          documentId: result.id,
          pdfBase64: pdfBase64,
        });
      } catch (emailErr) {
        console.error("Failed to send Document Email:", emailErr);
      }

      return NextResponse.json({
        success: true,
        message: "Document generated and saved to your vault successfully!",
        document: {
          id: result.id,
          title: result.title,
          companyName: result.companyName,
          structuredData: result.structuredData,
          transactionRef: result.transactionRef,
          createdAt: result.createdAt
        }
      });
    }

    return NextResponse.json({ success: false, message: "Please choose wallet payment method or fund your wallet." }, { status: 400 });

  } catch (error: any) {
    console.error("Generate Board Resolution Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "An error occurred while generating the document." 
    }, { status: 500 });
  }
}
