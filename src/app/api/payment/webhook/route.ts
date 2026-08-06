import crypto from "crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NotificationEvent } from "@/services/notifications";
import { notificationQueue } from "@/lib/queue";
import { redis } from "@/lib/redis";
import { sendScumlSubmittedEmail } from "@/lib/email";

export async function POST(req: Request) {
  console.log("\n==============================================");
  console.log("🔔 KORAPAY WEBHOOK TRIGGERED (STATELESS)");
  console.log("==============================================");

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-korapay-signature");

    if (!signature) return NextResponse.json({ message: "No signature found" }, { status: 400 });

    const event = JSON.parse(rawBody);
    const secret = process.env.KORAPAY_SECRET_KEY as string;

    // Validate Signature natively using Kora's structure rules
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(event.data))
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("❌ FAILED: Signature mismatch!");
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    if (event.event === "charge.success") {
      const reference = event.data?.reference as string;
      const amountPaid = Number(event.data?.amount);
      
      console.log(`✅ Event Validated. Ref: ${reference} | Amount: ${amountPaid}`);

      let userId: string | null = null;
      let serviceType: "business" | "llc" | "scuml" | "wallet_funding" | null = null;
      let registrationId: string | null = null;
      let regName = "Registration";
      let displayId = "";
      let scumlDraft: any = null;

      // =========================================================================
      // 1. STATELESS USER RESOLUTION (ROBUST STRING PARSING)
      // =========================================================================
      if (reference.startsWith("FW_USR_")) {
          serviceType = "wallet_funding";
          const temp = reference.replace("FW_USR_", "");
          userId = temp.substring(0, temp.lastIndexOf("_"));
      } 
      else if (reference.startsWith("ONL_SCUML_")) {
          serviceType = "scuml";
          const temp = reference.replace("ONL_SCUML_", "");
          registrationId = temp.substring(0, temp.lastIndexOf("_")); // Safely extracts "scuml_draft_xyz"
          
          const draftStr = await redis.get(registrationId);
          if (draftStr) {
              scumlDraft = JSON.parse(draftStr);
              userId = scumlDraft.userId;
              regName = scumlDraft.companyName;
          } else {
              console.warn(`⚠️ SCUML Draft ${registrationId} expired.`);
              return NextResponse.json({ received: true }); 
          }
      } 
      else if (reference.startsWith("ONL_")) {
          const temp = reference.replace("ONL_", "");
          registrationId = temp.substring(0, temp.lastIndexOf("_"));
          
          const bizReg = await prisma.businessRegistration.findUnique({ where: { id: registrationId } });
          if (bizReg) {
              serviceType = "business";
              userId = bizReg.userId;
              regName = bizReg.proposedName;
              displayId = bizReg.trackingId || registrationId;
          } else {
              const llcReg = await prisma.llcRegistration.findUnique({ where: { id: registrationId } });
              if (llcReg) {
                  serviceType = "llc";
                  userId = llcReg.userId;
                  regName = llcReg.proposedName || "LLC";
                  displayId = llcReg.trackingId || registrationId;
              }
          }
      }

      if (!userId || !serviceType) {
        console.error(`❌ FAILED: Could not resolve User ID or Service for Ref: ${reference}`);
        return NextResponse.json({ message: "Unresolvable Reference" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: userId }, include: { wallet: true } });
      if (!user || !user.wallet) {
          console.error(`❌ FAILED: Resolved User (${userId}) missing or has no wallet.`);
          return NextResponse.json({ received: true });
      }

      console.log(`✅ User Resolved Successfully: ${user.email} (${serviceType})`);

      // =========================================================================
      // 2. PRISMA TRANSACTION EXECUTION
      // =========================================================================
      let isPaymentFullySuccessful = false;
      let notificationPayload: NotificationEvent | null = null;

      try {
          await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const existingTx = await tx.transaction.findUnique({ where: { reference } });
            if (existingTx && existingTx.status === "SUCCESS") {
                console.log("⚠️ Transaction already processed. Idempotency active.");
                return; 
            }

            if (serviceType === "wallet_funding") {
                const updatedWallet = await tx.wallet.update({
                  where: { id: user.wallet!.id },
                  data: { balance: { increment: amountPaid } }
                });

                await tx.transaction.create({
                  data: {
                    walletId: user.wallet!.id, 
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

            const fundedWallet = await tx.wallet.update({
              where: { id: user.wallet!.id },
              data: { balance: { increment: amountPaid } }
            });
            const balanceAfterCredit = Number(fundedWallet.balance);

            await tx.transaction.create({
              data: {
                walletId: user.wallet!.id, 
                amount: amountPaid, 
                balanceBefore: balanceAfterCredit - amountPaid, 
                balanceAfter: balanceAfterCredit,
                type: "CREDIT", 
                status: "SUCCESS", 
                reference: reference, 
                description: "KoraPay Online Funding (Webhook)",
                serviceCategory: "WALLET_FUNDING"
              }
            });

            const debitedWallet = await tx.wallet.update({
              where: { id: user.wallet!.id },
              data: { balance: { decrement: amountPaid } }
            });
            const balanceAfterDebit = Number(debitedWallet.balance);

            await tx.transaction.create({
              data: {
                walletId: user.wallet!.id, 
                amount: amountPaid, 
                balanceBefore: balanceAfterCredit, 
                balanceAfter: balanceAfterDebit,
                type: "DEBIT", 
                status: "SUCCESS", 
                reference: `SRV_PAY_${registrationId}_${Date.now()}`, 
                description: `Payment for Registration (${regName})`,
                serviceCategory: serviceType.toUpperCase()
              }
            });

            if (serviceType === "business" && registrationId) {
              await tx.businessRegistration.update({ where: { id: registrationId }, data: { status: "PENDING" } });
            } else if (serviceType === "llc" && registrationId) {
              await tx.llcRegistration.update({ where: { id: registrationId }, data: { status: "PENDING" } });
            } else if (serviceType === "scuml" && registrationId && scumlDraft) {
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

            isPaymentFullySuccessful = true;

            if (serviceType !== "scuml") {
              notificationPayload = {
                userId: user.id, 
                type: "APPLICATION_SUBMITTED", 
                phone: user.phone || "", 
                email: user.email!,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Customer", 
                businessName: regName, 
                regId: displayId,
              };
            }
          });
          
          console.log("✅ Database Update Complete.");
      } catch (dbError) {
          console.error("❌ DATABASE UPDATE FAILED:", dbError);
      }

      if (isPaymentFullySuccessful) {
        if (serviceType === "scuml" && scumlDraft && registrationId) {
          await redis.del(registrationId);
          try {
            await sendScumlSubmittedEmail({
              to: user.email!,
              name: user.firstName || "Customer",
              companyName: scumlDraft.companyName,
              regType: scumlDraft.type,
              transactionRef: reference
            });
          } catch (err) {
            console.error("Failed to send SCUML email via Webhook:", err);
          }
        } else if (notificationPayload) {
          await notificationQueue.add("send-application-notification", notificationPayload, {
            attempts: 3, 
            backoff: { type: "exponential", delay: 5000 }, 
            removeOnComplete: true,
          });
        }
      }

      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ CRITICAL WEBHOOK ERROR:", error);
    return NextResponse.json({ message: "Webhook error" }, { status: 500 });
  }
}
