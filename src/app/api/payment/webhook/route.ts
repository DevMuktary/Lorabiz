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
  console.log("🔔 KORAPAY WEBHOOK TRIGGERED");
  console.log("==============================================");

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-korapay-signature");

    console.log("1. Signature Header Received:", signature ? "YES" : "NO");
    console.log("2. Raw Body Received:", rawBody.substring(0, 200) + "..."); // Log first 200 chars to check structure

    if (!signature) {
      console.error("❌ FAILED: No signature found in headers");
      return NextResponse.json({ message: "No signature found" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const secret = process.env.KORAPAY_SECRET_KEY as string;

    if (!secret) {
        console.error("❌ FAILED: KORAPAY_SECRET_KEY is undefined in environment variables!");
    }

    // Validate Signature natively using Kora's structure rules
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(event.data))
      .digest("hex");

    console.log("3. Signature Check:");
    console.log("   - Received:", signature);
    console.log("   - Expected:", expectedSignature);

    if (signature !== expectedSignature) {
      console.error("❌ FAILED: Signature mismatch! Make sure you are using the correct Secret Key.");
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    console.log("✅ Signature Verified. Event Type:", event.event);

    if (event.event === "charge.success") {
      const reference = event.data?.reference;
      const amountPaid = Number(event.data?.amount);
      const metadata = event.data?.metadata || {};
      
      const userEmail = metadata.email || event.data?.customer?.email; 
      const expectedAmount = metadata.expected ? Number(metadata.expected) : null;
      const appliedPromoId = metadata["promo-id"] || null;
      const serviceCategory = metadata.category || "OTHER";
      
      let regIdFallback = reference?.split("_")[1];
      if (reference?.startsWith("ONL_SCUML_")) regIdFallback = reference.split("_")[2];
      const registrationId = metadata["reg-id"] || regIdFallback;

      console.log("4. Extracted Transaction Data:");
      console.log(`   - Reference: ${reference}`);
      console.log(`   - Amount Paid: ${amountPaid}`);
      console.log(`   - Expected Amount: ${expectedAmount}`);
      console.log(`   - User Email: ${userEmail}`);
      console.log(`   - Registration ID: ${registrationId}`);
      console.log(`   - Full Metadata:`, metadata);

      if (!reference || !userEmail) {
        console.error("❌ FAILED: Missing Reference or Email in payload. Cannot process.");
        return NextResponse.json({ message: "Invalid payload data" }, { status: 400 });
      }

      console.log("5. Looking up user in database...");
      const user = await prisma.user.findUnique({ where: { email: userEmail }, include: { wallet: true } });
      
      if (!user) {
          console.error(`❌ FAILED: User with email ${userEmail} not found in database.`);
          return NextResponse.json({ received: true });
      }
      if (!user.wallet) {
          console.error(`❌ FAILED: User ${userEmail} does not have a wallet attached.`);
          return NextResponse.json({ received: true });
      }
      
      console.log(`✅ User found: ID ${user.id}, Current Balance: ${user.wallet.balance}`);

      // =========================================================================
      // SCENARIO 2: ONLINE SERVICE CHECKOUT ("ONL_...")
      // =========================================================================
      if (reference.startsWith("ONL_")) {
        console.log("6. Processing Service Checkout (ONL_)");
        
        const isScuml = reference.startsWith("ONL_SCUML_");
        let notificationPayload: NotificationEvent | null = null;
        let isPaymentFullySuccessful = false;
        let scumlDraft: any = null;

        if (isScuml) {
          const draftStr = await redis.get(registrationId);
          if (draftStr) {
            scumlDraft = JSON.parse(draftStr);
          } else {
            console.warn(`⚠️ SCUML Draft ${registrationId} expired before payment.`);
            return NextResponse.json({ received: true }); 
          }
        }

        try {
            console.log("7. Starting Prisma Transaction...");
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
              const existingTx = await tx.transaction.findUnique({ where: { reference } });
              if (existingTx && existingTx.status === "SUCCESS") {
                  console.log("⚠️ Transaction already processed. Idempotency kick-in.");
                  return; 
              }
    
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
                  if (bizReg.status !== "UNSUBMITTED") {
                      console.log("⚠️ Business Registration already submitted.");
                      return; 
                  }
                  serviceType = "business";
                  regName = bizReg.proposedName;
                  displayId = bizReg.trackingId || registrationId; 
                } else {
                  const llcReg = await tx.llcRegistration.findUnique({ where: { id: registrationId } });
                  if (llcReg) {
                    if (llcReg.status !== "UNSUBMITTED") {
                        console.log("⚠️ LLC Registration already submitted.");
                        return; 
                    }
                    serviceType = "llc";
                    regName = llcReg.proposedName || "LLC Application";
                    displayId = llcReg.trackingId || registrationId; 
                  }
                }
              }
    
              if (!serviceType) {
                  console.error("❌ FAILED: Could not identify service type or registration record.");
                  return; 
              }
              console.log(`✅ Identified Service: ${serviceType} for ID: ${registrationId}`);
    
              if (expectedAmount && amountPaid < expectedAmount) {
                console.warn(`🚨 UNDERPAYMENT DETECTED: Paid ${amountPaid}, Required ${expectedAmount}. Crediting wallet only.`);
                
                const updatedWallet = await tx.wallet.update({
                  where: { id: user.wallet!.id },
                  data: { balance: { increment: amountPaid } }
                });
                const newBalance = Number(updatedWallet.balance);
    
                await tx.transaction.create({
                  data: {
                    walletId: user.wallet!.id, 
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
    
              console.log("   -> Crediting Wallet internally");
              const fundedWallet = await tx.wallet.update({
                where: { id: user.wallet!.id },
                data: { balance: { increment: amountPaid } }
              });
              const balanceAfterCredit = Number(fundedWallet.balance);
              const balanceBeforeCredit = balanceAfterCredit - amountPaid;
    
              await tx.transaction.create({
                data: {
                  walletId: user.wallet!.id, 
                  amount: amountPaid, 
                  balanceBefore: balanceBeforeCredit, 
                  balanceAfter: balanceAfterCredit,
                  type: "CREDIT", 
                  status: "SUCCESS", 
                  reference: reference, 
                  description: "KoraPay Online Funding (Webhook)",
                  serviceCategory: "WALLET_FUNDING"
                }
              });
    
              console.log("   -> Debiting Wallet internally for service fee");
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
                  serviceCategory: serviceCategory 
                }
              });
    
              console.log("   -> Updating Application Status to PENDING");
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
    
              if (serviceType !== "scuml") {
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
            console.log("✅ Prisma Transaction Completed Successfully.");
        } catch (dbError) {
            console.error("❌ PRISMA TRANSACTION FAILED:", dbError);
        }

        if (isPaymentFullySuccessful) {
          console.log("8. Initiating Post-Payment Notifications/Cleanups");
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

      console.log("⚠️ Transaction reference did not match any known patterns.");
      return NextResponse.json({ received: true });
    }

    console.log(`⚠️ Ignored event type: ${event.event}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ CRITICAL WEBHOOK ERROR:", error);
    return NextResponse.json({ message: "Webhook error" }, { status: 500 });
  }
}
