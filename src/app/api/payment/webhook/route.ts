import crypto from "crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NotificationEvent } from "@/services/notifications";
import { notificationQueue } from "@/lib/queue";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json({ message: "No signature found" }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY as string;
    const expectedSignature = crypto.createHmac("sha512", secret).update(body).digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const reference = event.data?.reference;
      const amountPaid = Number(event.data?.amount) / 100; // Convert Kobo to Naira (Ground Truth!)
      const userEmail = event.data?.customer?.email;
      const metadata = event.data?.metadata || {};
      const expectedAmount = metadata.expectedAmount ? Number(metadata.expectedAmount) : null;

      if (!reference || !userEmail) {
        return NextResponse.json({ message: "Invalid payload data" }, { status: 400 });
      }

      // =========================================================================
      // SCENARIO 1: DIRECT WALLET FUNDING ("FW_...")
      // ==========================================
      if (reference.startsWith("FW_")) {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const user = await tx.user.findUnique({ 
            where: { email: userEmail }, 
            include: { wallet: true } 
          });
          
          if (!user || !user.wallet) return;

          // Idempotency check: prevent double crediting if webhook fires twice
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
              description: "Wallet Funding via Paystack Gateway"
            }
          });
        });

        return NextResponse.json({ received: true });
      }

      // =========================================================================
      // SCENARIO 2: ONLINE SERVICE CHECKOUT ("ONL_...")
      // =========================================================================
      if (reference.startsWith("ONL_")) {
        const registrationId = reference.split("_")[1];
        let notificationPayload: NotificationEvent | null = null;

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const user = await tx.user.findUnique({ where: { email: userEmail }, include: { wallet: true } });
          if (!user || !user.wallet) return; 

          const existingTx = await tx.transaction.findUnique({ where: { reference } });
          if (existingTx && existingTx.status === "SUCCESS") return; 

          let serviceType: "business" | "llc" | null = null;
          let regName = "Registration";
          let displayId = registrationId; 

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

          if (!serviceType) return; 

          // ---------------------------------------------------------------------
          // SECURITY GUARD: STRICT AMOUNT VERIFICATION
          // If expectedAmount exists and user underpaid, credit wallet ONLY and abort!
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
                description: `Partial Online Payment (Underpaid for ${regName} - Credited to Wallet)`
              }
            });
            return; // Abort without updating registration status!
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
              description: "Paystack Online Funding (Webhook)"
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
              description: `Payment for Registration (${regName})`
            }
          });

          // Step C: Unlock application status for CAC processing
          if (serviceType === "business") {
            await tx.businessRegistration.update({ where: { id: registrationId }, data: { status: "PENDING" } });
          } else if (serviceType === "llc") {
            await tx.llcRegistration.update({ where: { id: registrationId }, data: { status: "PENDING" } });
          }

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
        });

        if (notificationPayload) {
          await notificationQueue.add("send-application-notification", notificationPayload, {
            attempts: 3, 
            backoff: { type: "exponential", delay: 5000 }, 
            removeOnComplete: true,
          });
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

              // SECURITY GUARD: Enforce underpayment protection on Name Substitution
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
                    description: "Partial Online Payment (Underpaid Name Substitution - Credited to Wallet)"
                  }
                });
                return; // Abort without updating names!
              }

              // Step 1: Fund Wallet
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
                  description: "Paystack Online Funding (Webhook)"
                }
              });

              // Step 2: Debit Wallet
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
                  description: "Payment for Name Substitution"
                }
              });

              // Step 3: Apply Name Changes in Database
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
            console.error("Failed to parse/execute NSUB payload:", e);
          }
        }
        return NextResponse.json({ received: true });
      }

      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ message: "Webhook error" }, { status: 500 });
  }
}
