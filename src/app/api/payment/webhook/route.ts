import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchNotification, NotificationEvent } from "@/services/notifications";

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
      const reference = event.data.reference;
      const amountPaid = Number(event.data.amount) / 100; // Convert Kobo to Naira
      const userEmail = event.data.customer.email;

      // ==========================================
      // SCENARIO 1: DIRECT WALLET FUNDING
      // ==========================================
      if (reference.startsWith("FW_")) {
        await prisma.$transaction(async (tx: any) => {
          const user = await tx.user.findUnique({ 
            where: { email: userEmail }, 
            include: { wallet: true } 
          });
          
          if (!user || !user.wallet) return;

          // Idempotency check: Don't double-fund if Webhook fires twice
          const existingTx = await tx.transaction.findUnique({ where: { reference } });
          if (existingTx && existingTx.status === "SUCCESS") return;

          const currentBalance = Number(user.wallet.balance);
          const newBalance = currentBalance + amountPaid;

          // 1. Create Ledger entry
          await tx.transaction.create({
            data: {
              walletId: user.wallet.id,
              amount: amountPaid,
              balanceBefore: currentBalance,
              balanceAfter: newBalance,
              type: "CREDIT",
              status: "SUCCESS",
              reference: reference, 
              description: "Wallet Funding via Paystack"
            }
          });

          // 2. Add Money to Wallet
          await tx.wallet.update({
            where: { id: user.wallet.id },
            data: { balance: newBalance } 
          });
        });

        return NextResponse.json({ received: true });
      }

      // ==========================================
      // SCENARIO 2: ONLINE SERVICE CHECKOUT 
      // ==========================================
      if (reference.startsWith("ONL_")) {
        const registrationId = reference.split("_")[1];
        let notificationPayload: NotificationEvent | null = null;

        await prisma.$transaction(async (tx: any) => {
          const user = await tx.user.findUnique({ 
            where: { email: userEmail }, 
            include: { wallet: true } 
          });
          
          if (!user || !user.wallet) return; 

          const existingTx = await tx.transaction.findUnique({ where: { reference } });
          if (existingTx && existingTx.status === "SUCCESS") {
            return; 
          }

          let serviceType: "business" | "llc" | null = null;
          let regName = "Registration";

          const bizReg = await tx.businessRegistration.findUnique({ where: { id: registrationId } });
          if (bizReg) {
            if (bizReg.status !== "UNSUBMITTED") return; 
            serviceType = "business";
            regName = bizReg.proposedName;
          } else {
            const llcReg = await tx.llcRegistration.findUnique({ where: { id: registrationId } });
            if (llcReg) {
              if (llcReg.status !== "UNSUBMITTED") return; 
              serviceType = "llc";
              regName = llcReg.proposedName || "LLC Application";
            }
          }

          if (!serviceType) return; 

          const currentBalance = Number(user.wallet.balance);
          const newBalanceAfterFunding = currentBalance + amountPaid;

          // A: Fund Wallet
          await tx.transaction.create({
            data: {
              walletId: user.wallet.id,
              amount: amountPaid,
              balanceBefore: currentBalance,
              balanceAfter: newBalanceAfterFunding,
              type: "CREDIT",
              status: "SUCCESS",
              reference: reference, 
              description: "Paystack Online Funding (Webhook)"
            }
          });

          // B: Instantly Debit for Service
          const newBalanceAfterPayment = newBalanceAfterFunding - amountPaid;
          await tx.transaction.create({
            data: {
              walletId: user.wallet.id,
              amount: amountPaid,
              balanceBefore: newBalanceAfterFunding,
              balanceAfter: newBalanceAfterPayment,
              type: "DEBIT",
              status: "SUCCESS",
              reference: `SRV_PAY_${registrationId}_${Date.now()}`,
              description: `Payment for Registration (${regName})`
            }
          });

          // C: Save balances & mark service as pending
          await tx.wallet.update({
            where: { id: user.wallet.id },
            data: { balance: newBalanceAfterPayment } 
          });

          if (serviceType === "business") {
            await tx.businessRegistration.update({
              where: { id: registrationId },
              data: { status: "PENDING" } 
            });
          } else if (serviceType === "llc") {
            await tx.llcRegistration.update({
              where: { id: registrationId },
              data: { status: "PENDING" } 
            });
          }

          // D: Capture user details for non-blocking notification dispatch
          const userPhone = user.phone || user.phoneNumber || "";
          const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Valued Customer";

          notificationPayload = {
            type: "APPLICATION_SUBMITTED",
            phone: userPhone,
            email: userEmail,
            name: userName,
            businessName: regName,
            regId: registrationId,
          };
        });

        // Fire Email & WhatsApp asynchronously after successful DB commit
        if (notificationPayload) {
          dispatchNotification(notificationPayload);
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
