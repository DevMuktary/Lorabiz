import crypto from "crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NotificationEvent } from "@/services/notifications";
import { notificationQueue } from "@/lib/queue";
import { redis } from "@/lib/redis";
import { sendScumlSubmittedEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    // Use Korapay's signature header
    const signature = req.headers.get("x-korapay-signature");

    if (!signature) {
      console.error("🚨 Webhook Error: No KoraPay signature found in headers.");
      return NextResponse.json({ message: "No signature found" }, { status: 400 });
    }

    const secret = process.env.KORAPAY_SECRET_KEY;
    
    // ✅ RAILWAY FIX: Prevent fatal server crash if environment variable is missing
    if (!secret) {
      console.error("🚨 CRITICAL: KORAPAY_SECRET_KEY is missing from Railway environment variables!");
      return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
    }
    
    // Korapay uses SHA256 (not SHA512)
    const expectedSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");

    if (signature !== expectedSignature) {
      console.error("🚨 Webhook Error: Invalid signature match.");
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const reference = event.data?.reference;
      // Korapay amounts are already in exact Naira
      const amountPaid = Number(event.data?.amount); 
      const userEmail = event.data?.customer?.email;
      const metadata = event.data?.metadata || {};
      const expectedAmount = metadata.expectedAmount ? Number(metadata.expectedAmount) : null;
      const appliedPromoId = metadata.appliedPromoId || null;
      
      const serviceCategory = metadata.serviceCategory || "OTHER";

      if (!reference || !userEmail) {
        console.error("🚨 Webhook Error: Missing reference or email in payload.");
        return NextResponse.json({ message: "Invalid payload data" }, { status: 400 });
      }

      // =========================================================================
      // SCENARIO 1: DIRECT WALLET FUNDING ("FW_...")
      // =========================================================================
      if (reference.startsWith("FW_")) {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const user = await tx.user.findUnique({ 
            where: { email: userEmail }, 
            include: { wallet: true } 
          });
          
          if (!user || !user.wallet) return;

          const existingTx = await tx.transaction.findUnique({ where: { reference } });
          if (existingTx && existingTx.status === "SUCCESS") return;

          const updatedWallet = await tx.wallet.update({
            where: { id: user.wallet.id },
            data: { balance: { increment: amountPaid } }
          });

          const newBalance = Number(updatedWallet.balance);
          const previousBalance = newBalance - amountPaid;

          await tx.transaction.create({
            data: {
              walletId: user.wallet.id, 
              amount: amountPaid, 
              balanceBefore: previousBalance, 
              balanceAfter: newBalance,
              type: "CREDIT", 
              status: "SUCCESS", 
              reference: reference, 
              description: "Wallet Funding via Korapay Gateway",
              serviceCategory: "WALLET_FUNDING"
            }
          });
        });

        console.log(`✅ Successfully funded wallet for ${userEmail} with ₦${amountPaid}`);
        return NextResponse.json({ received: true });
      }

      // =========================================================================
      // SCENARIO 2: ONLINE SERVICE CHECKOUT ("ONL_...")
      // =========================================================================
      if (reference.startsWith("ONL_")) {
        const isScuml = reference.startsWith("ONL_SCUML_");
        const registrationId = metadata.registrationId || (isScuml ? reference.split("_")[2] : reference.split("_")[1]);
        
        let notificationPayload: NotificationEvent | null = null;
        let isPaymentFullySuccessful = false;
        let scumlDraft: any = null;

        // PRE-FETCH REDIS DRAFT FOR SCUML OUTSIDE TRANSACTION
        if (isScuml) {
          const draftStr = await redis.get(registrationId);
          if (draftStr) {
            scumlDraft = JSON.parse(draftStr);
          } else {
            console.warn(`⚠️ SCUML Draft ${registrationId} expired before payment.`);
            return NextResponse.json({ received: true }); 
          }
        }

        const user = await prisma.user.findUnique({ where: { email: userEmail }, include: { wallet: true } });

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          if (!user || !user.wallet) return; 

          const existingTx = await tx.transaction.findUnique({ where: { reference } });
          if (existingTx && existingTx.status === "SUCCESS") return; 

          let serviceType: "business" | "llc" | "scuml" | null = null;
          let regName = "Registration";
          let displayId = registrationId; 

          if (isScuml && scumlDraft) {
            serviceType = "scuml";
            regName = scumlDraft.companyName || "SCUML Application";
            displayId = registrationId;
          } else {
            const bizReg = await tx.businessRegistration.findUnique({ where: { id: registrationId } });
            if (bizReg) {
              if (bizReg.status !== "UNSUBMITTED") return; 
              serviceType = "business";
              regName = bizReg.proposedName;
              displayId = bizReg.trackingId || registrationId; 
            } else {
              const llcReg = await tx.llcRegistration.findUnique({ where: { id: registrationId } });
              if (llcReg) {
                if (llcReg.status !== "UNSUBMITTED") return; 
                serviceType = "llc";
                regName = llcReg.proposedName || "LLC Application";
                displayId = llcReg.trackingId || registrationId; 
              }
            }
          }

          if (!serviceType) return; 

          // ---------------------------------------------------------------------
          // SECURITY GUARD: STRICT AMOUNT VERIFICATION
          // ---------------------------------------------------------------------
          if (expectedAmount && amountPaid < expectedAmount) {
            console.warn(`🚨 UNDERPAYMENT DETECTED for ${reference}: Paid ₦${amountPaid}, Required ₦${expectedAmount}. Crediting wallet balance only.`);
            
            const updatedWallet = await tx.wallet.update({
              where: { id: user.wallet.id },
              data: { balance: { increment: amountPaid } }
            });
            const newBalance = Number(updatedWallet.balance);

            await tx.transaction.create({
              data: {
                walletId: user.wallet.id, 
                amount: amountPaid, 
                balanceBefore: newBalance - amountPaid, 
                balanceAfter: newBalance,
                type: "CREDIT", 
                status: "SUCCESS", 
                reference: reference, 
                description: `Partial Online Payment (Underpaid for ${regName} - Credited to Wallet)`,
                serviceCategory: "WALLET_FUNDING"
              }
            });
            return; 
          }

          // Step A: Record incoming online funds into wallet ledger
          const fundedWallet = await tx.wallet.update({
            where: { id: user.wallet.id },
            data: { balance: { increment: amountPaid } }
          });
          const balanceAfterCredit = Number(fundedWallet.balance);
          const balanceBeforeCredit = balanceAfterCredit - amountPaid;

          await tx.transaction.create({
            data: {
              walletId: user.wallet.id, 
              amount: amountPaid, 
              balanceBefore: balanceBeforeCredit, 
              balanceAfter: balanceAfterCredit,
              type: "CREDIT", 
              status: "SUCCESS", 
              reference: reference, 
              description: "Korapay Online Funding (Webhook)",
              serviceCategory: "WALLET_FUNDING"
            }
          });

          // Step B: Debit the wallet for the actual service fee
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
              description: `Payment for Registration (${regName})`,
              serviceCategory: serviceCategory 
            }
          });

          // Step C: Unlock application status for Admin processing
          if (serviceType === "business") {
            await tx.businessRegistration.update({ where: { id: registrationId }, data: { status: "PENDING" } });
          } else if (serviceType === "llc") {
            await tx.llcRegistration.update({ where: { id: registrationId }, data: { status: "PENDING" } });
          } else if (serviceType === "scuml" && scumlDraft) {
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

          // Step D: Burn Promo Code officially in the ledger
          if (appliedPromoId) {
            await tx.promoCode.update({
              where: { id: appliedPromoId },
              data: { timesUsed: { increment: 1 } }
            });
            await tx.promoUsage.create({
              data: { promoId: appliedPromoId, userId: user.id }
            });
          }

          isPaymentFullySuccessful = true;

          // Setup Notification payload for CAC services
          if (serviceType !== "scuml" && user) {
            const userPhone = user.phone || "";
            const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Valued Customer";
            
            notificationPayload = {
              userId: user.id, 
              type: "APPLICATION_SUBMITTED", 
              phone: userPhone, 
              email: userEmail,
              name: userName, 
              businessName: regName, 
              regId: displayId,
            };
          }
        });

        // =========================================================================
        // AFTER TRANSACTION: CLEANUP REDIS & SEND EMAILS
        // =========================================================================
        if (isPaymentFullySuccessful && user) {
          
          if (isScuml && scumlDraft) {
            await redis.del(registrationId);
            
            try {
              await sendScumlSubmittedEmail({
                to: userEmail,
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

      // =========================================================================
      // SCENARIO 3: NAME SUBSTITUTION CHECKOUT ("NSUB-ONL-...")
      // =========================================================================
      if (reference.startsWith("NSUB-ONL-")) {
        const parts = reference.split("-");
        if (parts.length >= 4) {
          const registrationId = parts[2];
          const safeEncodedPayload = parts.slice(3).join("-");

          try {
            const base64 = safeEncodedPayload.replace(/-/g, '+').replace(/_/g, '/');
            const paddedBase64 = base64 + '=='.substring(0, (3 * base64.length) % 4);
            const payloadStr = Buffer.from(paddedBase64, 'base64').toString('utf-8');
            const { proposedName, altName1, altName2, type } = JSON.parse(payloadStr);

            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
              const user = await tx.user.findUnique({ where: { email: userEmail }, include: { wallet: true } });
              if (!user || !user.wallet) return;

              const existingTx = await tx.transaction.findUnique({ where: { reference } });
              if (existingTx && existingTx.status === "SUCCESS") return;

              if (expectedAmount && amountPaid < expectedAmount) {
                console.warn(`🚨 UNDERPAYMENT DETECTED for Name Sub ${reference}: Paid ₦${amountPaid}, Required ₦${expectedAmount}.`);
                const updatedWallet = await tx.wallet.update({
                  where: { id: user.wallet.id },
                  data: { balance: { increment: amountPaid } }
                });
                const newBalance = Number(updatedWallet.balance);

                await tx.transaction.create({
                  data: {
                    walletId: user.wallet.id, 
                    amount: amountPaid, 
                    balanceBefore: newBalance - amountPaid, 
                    balanceAfter: newBalance,
                    type: "CREDIT", 
                    status: "SUCCESS", 
                    reference: reference, 
                    description: "Partial Online Payment (Underpaid Name Substitution - Credited to Wallet)",
                    serviceCategory: "WALLET_FUNDING"
                  }
                });
                return; 
              }

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
                  description: "Korapay Online Funding (Webhook)",
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
                  reference: `NSUB_PAY_${registrationId}_${Date.now()}`, 
                  description: "Payment for Name Substitution",
                  serviceCategory: "NAME_SUBSTITUTION"
                }
              });

              if (type === "BUSINESS_NAME") {
                await tx.businessRegistration.update({
                  where: { id: registrationId },
                  data: { proposedName, altName1, altName2 }
                });
              } else {
                await tx.llcRegistration.update({
                  where: { id: registrationId },
                  data: { proposedName, altName1, altName2 }
                });
              }
            });
          } catch (e) {
            console.error("🚨 Failed to parse/execute NSUB payload:", e);
          }
        }
        return NextResponse.json({ received: true });
      }

      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("🚨 Webhook Critical Error:", error);
    return NextResponse.json({ message: "Webhook error" }, { status: 500 });
  }
}
