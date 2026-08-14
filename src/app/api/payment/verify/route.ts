import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { redis } from "@/lib/redis";
import { notificationQueue } from "@/lib/queue";
import { logUserActivity } from "@/lib/activity-logger";
import { sendDocumentGeneratedEmail } from "@/lib/email";
import { generateAIBoardResolution, generateDeterministicResolution } from "@/lib/board-resolution-generator";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { reference } = body;

    // =====================================================================
    // SSRF FIX: STRICT INPUT VALIDATION & SANITIZATION
    // =====================================================================
    if (!reference || typeof reference !== "string" || !/^[a-zA-Z0-9_-]+$/.test(reference)) {
      return NextResponse.json({ message: "Invalid transaction reference format" }, { status: 400 });
    }

    if (!reference.startsWith("ONL_") && !reference.startsWith("FW_") && !reference.startsWith("NSUB_")) {
      return NextResponse.json({ message: "Invalid transaction type for this endpoint" }, { status: 400 });
    }

    const safeReference = encodeURIComponent(reference);

    // 1. Verify Payment Server-to-Server with KoraPay
    const koraRes = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${safeReference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}`, 
      },
    });

    const koraData = await koraRes.json();

    if (!koraData.status || koraData.data.status !== "success") {
      return NextResponse.json({ success: false, message: "Payment verification failed with KoraPay." }, { status: 400 });
    }

    const amountPaid = Number(koraData.data.amount);
    const userEmail = session.user.email as string;

    // =====================================================================
    // CRITICAL FIX: SAFELY EXTRACT REGISTRATION ID IGNORING UNDERSCORES
    // =====================================================================
    let scumlDraft: any = null;
    let docDraft: any = null;
    const isScuml = reference.startsWith("ONL_SCUML_");
    const isDoc = reference.startsWith("ONL_DOC_");
    
    let registrationId = "";
    if (isDoc) {
      const temp = reference.replace("ONL_DOC_", "");
      registrationId = temp.substring(0, temp.lastIndexOf("_"));
      const draftStr = await redis.get(registrationId);
      if (draftStr) {
        docDraft = JSON.parse(draftStr);
      }
    } else if (isScuml) {
      const temp = reference.replace("ONL_SCUML_", "");
      registrationId = temp.substring(0, temp.lastIndexOf("_")); 
      
      const draftStr = await redis.get(registrationId);
      if (draftStr) {
        scumlDraft = JSON.parse(draftStr);
      }
    } else if (reference.startsWith("ONL_")) {
      const temp = reference.replace("ONL_", "");
      registrationId = temp.substring(0, temp.lastIndexOf("_"));
    } else if (reference.startsWith("NSUB_")) {
      const temp = reference.replace("NSUB_", "");
      registrationId = temp.substring(0, temp.lastIndexOf("_"));
    }

    // 2. ATOMIC TRANSACTION TO PREVENT RACE CONDITIONS
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.findUnique({ 
        where: { email: userEmail }, 
        include: { wallet: true } 
      });
      if (!user || !user.wallet) throw new Error("User or wallet missing");

      const existingTx = await tx.transaction.findUnique({ where: { reference } });
      if (existingTx && existingTx.status === "SUCCESS") {
        return; 
      }

      // =====================================================================
      // SCENARIO A: WALLET FUNDING
      // =====================================================================
      if (reference.startsWith("FW_")) {
        const updatedWallet = await tx.wallet.update({
          where: { id: user.wallet.id },
          data: { balance: { increment: amountPaid } }
        });
        
        await tx.transaction.create({
          data: {
            walletId: user.wallet.id,
            amount: amountPaid,
            balanceBefore: Number(updatedWallet.balance) - amountPaid,
            balanceAfter: Number(updatedWallet.balance),
            type: "CREDIT",
            status: "SUCCESS",
            reference: reference, 
            description: "Wallet Funding via KoraPay Gateway",
            serviceCategory: "WALLET_FUNDING"
          }
        });
        return;
      }

      // =====================================================================
      // SCENARIO C: NAME SUBSTITUTION (NEW!)
      // =====================================================================
      if (reference.startsWith("NSUB_")) {
        // Extract names packed into KoraPay metadata during initialization
        const metadata = koraData.data.metadata || {};
        const proposedName = metadata["name-1"];
        const altName1 = metadata["name-2"] !== "none" ? metadata["name-2"] : "";
        const altName2 = metadata["name-3"] !== "none" ? metadata["name-3"] : "";
        const type = metadata["type"];

        const fundedWallet = await tx.wallet.update({
          where: { id: user.wallet.id },
          data: { balance: { increment: amountPaid } }
        });
        const balanceAfterCredit = Number(fundedWallet.balance);

        await tx.transaction.create({
          data: {
            walletId: user.wallet.id,
            amount: amountPaid,
            balanceBefore: balanceAfterCredit - amountPaid,
            balanceAfter: balanceAfterCredit,
            type: "CREDIT",
            status: "SUCCESS",
            reference: reference, 
            description: "KoraPay Online Funding",
            serviceCategory: "WALLET_FUNDING"
          }
        });

        const debitedWallet = await tx.wallet.update({
          where: { id: user.wallet.id },
          data: { balance: { decrement: amountPaid } }
        });

        await tx.transaction.create({
          data: {
            walletId: user.wallet.id,
            amount: amountPaid,
            balanceBefore: balanceAfterCredit,
            balanceAfter: Number(debitedWallet.balance),
            type: "DEBIT",
            status: "SUCCESS",
            reference: `NSUB_PAY_${registrationId}_${Date.now()}`,
            description: `Payment for Name Substitution`,
            serviceCategory: "NAME_SUBSTITUTION"
          }
        });

        // Save the new names to the database!
        if (type === "BUSINESS_NAME") {
          await tx.businessRegistration.update({ where: { id: registrationId }, data: { proposedName, altName1, altName2 } });
        } else {
          await tx.llcRegistration.update({ where: { id: registrationId }, data: { proposedName, altName1, altName2 } });
        }
        return;
      }

      // =====================================================================
      // SCENARIO B: SERVICE CHECKOUT (CAC/SCUML)
      // =====================================================================
      if (reference.startsWith("ONL_")) {
        const fundedWallet = await tx.wallet.update({
          where: { id: user.wallet.id },
          data: { balance: { increment: amountPaid } }
        });
        const balanceAfterCredit = Number(fundedWallet.balance);

        await tx.transaction.create({
          data: {
            walletId: user.wallet.id,
            amount: amountPaid,
            balanceBefore: balanceAfterCredit - amountPaid,
            balanceAfter: balanceAfterCredit,
            type: "CREDIT",
            status: "SUCCESS",
            reference: reference, 
            description: "KoraPay Online Funding",
            serviceCategory: "WALLET_FUNDING"
          }
        });

        const debitedWallet = await tx.wallet.update({
          where: { id: user.wallet.id },
          data: { balance: { decrement: amountPaid } }
        });
        const balanceAfterDebit = Number(debitedWallet.balance);

        await tx.transaction.create({
          data: {
            walletId: user.wallet.id,
            amount: amountPaid,
            balanceBefore: balanceAfterCredit,
            balanceAfter: balanceAfterDebit,
            type: "DEBIT",
            status: "SUCCESS",
            reference: `SRV_PAY_${registrationId}_${Date.now()}`,
            description: isDoc 
              ? `Payment for Board Resolution (${docDraft?.formData?.companyName || "Document"})`
              : `Payment for Service Registration`,
            serviceCategory: isDoc ? "SMART_DOCUMENTS" : isScuml ? "SCUML" : "BUSINESS_NAME"
          }
        });

        if (isDoc && docDraft) {
          const docFormData = docDraft.formData;
          let structuredResolution;
          try {
            structuredResolution = await generateAIBoardResolution(docFormData);
          } catch (e) {
            structuredResolution = generateDeterministicResolution(docFormData);
          }

          const docTitle = `Board Resolution - ${docFormData.targetInstitution} (${docFormData.purposeCategory === "PAYMENT_GATEWAY" ? "Payment Gateway" : "Corporate Account"})`;

          await tx.generatedDocument.create({
            data: {
              userId: user.id,
              documentType: docDraft.documentType || "BOARD_RESOLUTION",
              title: docTitle,
              companyName: docFormData.companyName,
              status: "COMPLETED",
              accentColor: docFormData.accentColor || "#0f172a",
              logoUrl: docFormData.logoUrl || null,
              formData: docFormData as any,
              structuredData: structuredResolution as any,
              amountPaid: amountPaid,
              transactionRef: reference
            }
          });
        } else if (isScuml) {
          if (scumlDraft) {
            await tx.scumlRegistration.create({ 
              data: {
                id: registrationId, 
                userId: scumlDraft.userId,
                type: scumlDraft.type,
                companyName: scumlDraft.companyName,
                certificateUrl: scumlDraft.documents.certificateUrl,
                statusReportUrl: scumlDraft.documents.statusReportUrl,
                memorandumUrl: scumlDraft.documents.memorandumUrl || null,
                constitutionUrl: scumlDraft.documents.constitutionUrl || null,
                status: "PENDING",
                amountPaid: amountPaid,
                transactionRef: reference
              } 
            });
          }
        } else {
          const bizReg = await tx.businessRegistration.findUnique({ where: { id: registrationId }});
          if (bizReg && bizReg.status === "UNSUBMITTED") {
            await tx.businessRegistration.update({
              where: { id: registrationId },
              data: { status: "PENDING" } 
            });
          } else {
            const llcReg = await tx.llcRegistration.findUnique({ where: { id: registrationId }});
            if (llcReg && llcReg.status === "UNSUBMITTED") {
              await tx.llcRegistration.update({
                where: { id: registrationId },
                data: { status: "PENDING" } 
              });
            }
          }
        }
      }
    });

    if (isDoc && docDraft) {
      await redis.del(registrationId);
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      const compName = docDraft.formData?.companyName || "Your Company";
      const docTitle = `Board Resolution - ${docDraft.formData?.targetInstitution || "Corporate Resolution"}`;
      
      try {
        await sendDocumentGeneratedEmail({
          to: userEmail,
          firstName: user?.firstName || "Valued Client",
          documentTitle: docTitle,
          companyName: compName,
          documentId: registrationId,
        });
      } catch (err) {
        console.error("Failed to send Document Email in Verify:", err);
      }

      if (user) {
        logUserActivity({
          userId: user.id,
          action: "SMART_DOCUMENT_PURCHASED",
          category: "SERVICES",
          description: `Smart Legal Document generated: "${docTitle}" for "${compName}"`,
          referenceId: reference,
          metadata: { documentTitle: docTitle, companyName: compName, amount: amountPaid },
          req,
        });
      }
    }

    if (isScuml && scumlDraft) {
      await redis.del(registrationId);
    }

    // Non-blocking Activity Logging and Automation Triggers
    if (reference.startsWith("FW_")) {
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: { wallet: true },
      });

      if (user) {
        logUserActivity({
          userId: user.id,
          action: "WALLET_FUNDING_SUCCESS",
          category: "WALLET",
          description: `Wallet funded with ₦${amountPaid.toLocaleString()}`,
          referenceId: reference,
          metadata: { amount: amountPaid },
          req,
        });

        try {
          const alreadySentFundingEmail = await prisma.automatedEmailLog.findFirst({
            where: {
              userId: user.id,
              emailType: "FIRST_WALLET_FUNDING",
            },
          });

          if (!alreadySentFundingEmail) {
            const currentBalance = user.wallet ? Number(user.wallet.balance) : amountPaid;
            const host = req.headers.get("host") || "lorabiz.com";
            const protocol = host.includes("localhost") ? "http" : "https";
            const baseUrl = `${protocol}://${host}`;

            await notificationQueue.add(
              "send-first-wallet-funding-email",
              {
                type: "FIRST_WALLET_FUNDING_EMAIL",
                userId: user.id,
                email: user.email,
                firstName: user.firstName || "Valued Client",
                amount: amountPaid,
                balance: currentBalance,
                reference,
                baseUrl,
              },
              {
                attempts: 3,
                backoff: { type: "exponential", delay: 5000 },
                removeOnComplete: true,
              }
            );
          }
        } catch (fundingErr) {
          console.error("Failed to check/enqueue first wallet funding email in verify route:", fundingErr);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Payment verified successfully!" });

  } catch (error: any) {
    console.error("Payment Verification Error:", error.message);
    return NextResponse.json({ message: error.message || "Failed to process payment." }, { status: 500 });
  }
}
