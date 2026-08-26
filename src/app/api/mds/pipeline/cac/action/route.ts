import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { notificationQueue } from "@/lib/queue";
import { NotificationEvent } from "@/services/notifications";
import { getReferrerRewardAmount } from "@/lib/loyalty";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const mdsAdmin = await prisma.user.findFirst({
      where: { email: session.user.email, role: { in: ["ADMIN", "STAFF"] } },
    });
    if (!mdsAdmin) {
      return NextResponse.json({ error: "Forbidden. Admin or Staff access required." }, { status: 403 });
    }

    const body = await req.json();
    const { 
      ticketId, ticketType, actionType, reason, 
      registrationNumber, taxId, certificateUrl, statusReportUrl, memorandumUrl,
      issueRefund, refundAmount, staffId
    } = body;

    if (!ticketId || !ticketType || !actionType) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    let notificationPayload: NotificationEvent | null = null;

    await prisma.$transaction(async (tx) => {
      let targetRef = "";
      let clientId = "";
      let regName = "";
      
      const updateData: any = { 
        status: actionType === "APPROVE" ? "APPROVED" : actionType === "FAIL" ? "FAILED" : actionType === "QUERY" ? "QUERIED" : undefined 
      };
      
      if (actionType === "UNASSIGN") updateData.assignedToId = null;
      if (actionType === "ASSIGN" && staffId) updateData.assignedToId = staffId;

      if (actionType === "APPROVE") {
        updateData.registrationNumber = registrationNumber;
        updateData.taxId = taxId;
        updateData.certificateUrl = certificateUrl;
        updateData.statusReportUrl = statusReportUrl;
        if (ticketType === "LLC") updateData.memorandumUrl = memorandumUrl;
      }

      if (actionType === "QUERY") {
        updateData.queryReason = reason;
        updateData.queryStatus = "UNRESOLVED";
        if (ticketType === "BUSINESS_NAME") {
          updateData.queryDate = new Date();
        }
      }

      if (ticketType === "BUSINESS_NAME") {
        const updated = await tx.businessRegistration.update({ where: { id: ticketId }, data: updateData });
        targetRef = updated.trackingId || ticketId;
        clientId = updated.userId;
        regName = updated.proposedName;

      } else if (ticketType === "LLC") {
        const updated = await tx.llcRegistration.update({ where: { id: ticketId }, data: updateData });
        targetRef = updated.trackingId || ticketId;
        clientId = updated.userId;
        regName = updated.proposedName || "LLC Application";
      }

      // --- NEW: BULLETPROOF REFERRAL LEDGER PAYOUT ---
      if (actionType === "APPROVE" && clientId) {
        
        // 1. Is there an active referral link for this client?
        const activeReferral = await tx.referral.findUnique({
          where: { referredUserId: clientId }
        });

        // 2. Check if the Master Kill Switch is ON, and if the referral hasn't expired (12-month limit)
        if (activeReferral) {
            const isReferralActiveSetting = await tx.globalSetting.findUnique({ 
                where: { key: 'REFERRAL_ACTIVE' } 
            });
            const isReferralActive = !isReferralActiveSetting || isReferralActiveSetting.value === 'true';
            
            const isNotExpired = !activeReferral.expiresAt || new Date() < activeReferral.expiresAt;

            if (isReferralActive && isNotExpired) {
                // 3. Prevent Double Payouts (Check if we already paid for this EXACT job)
                const existingCommission = await tx.referralCommission.findUnique({
                    where: { serviceId: ticketId }
                });

                if (!existingCommission) {
                    // 4. Fetch the dynamic fixed price for this specific service from Admin Settings
                    const serviceSettingKey = ticketType === "LLC" ? 'REF_REWARD_CAC_LLC' : 'REF_REWARD_CAC_BIZ';
                    const rewardSetting = await tx.globalSetting.findUnique({
                        where: { key: serviceSettingKey }
                    });
                    
                    const baseAmount = rewardSetting ? Number(rewardSetting.value) : (ticketType === "LLC" ? 1500.00 : 1000.00);
                    const commissionAmount = await getReferrerRewardAmount(tx, activeReferral.referrerId, baseAmount);

                    // 5. Only pay if the admin hasn't set the reward to 0 to disable it
                    if (commissionAmount > 0) {
                        // A. Log it in the ledger (CRITICAL)
                        await tx.referralCommission.create({
                            data: {
                                referralId: activeReferral.id,
                                serviceType: ticketType === "LLC" ? "CAC_LLC" : "CAC_BIZ",
                                serviceId: ticketId, // The @unique constraint here is our ultimate fraud shield
                                amount: commissionAmount
                            }
                        });

                        // B. Credit the referrer's wallet instantly
                        await tx.user.update({
                            where: { id: activeReferral.referrerId },
                            data: { referralBalance: { increment: commissionAmount } }
                        });
                    }
                }
            }
        }
      }
      // ------------------------------------------------------

      const user = await tx.user.findUnique({ where: { id: clientId } });

      if (user && (actionType === "APPROVE" || actionType === "QUERY")) {
        const userPhone = user.phone || "";
        const userEmail = user.email || "";
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Valued Customer";

        if (actionType === "APPROVE") {
          notificationPayload = {
            type: "APPLICATION_APPROVED",
            userId: user.id,
            phone: userPhone,
            email: userEmail,
            name: userName,
            businessName: regName,
            rcNumber: registrationNumber || "N/A",
            certificateUrl: certificateUrl,
            statusReportUrl: statusReportUrl,
            memorandumUrl: memorandumUrl,
          };
        } else if (actionType === "QUERY") {
          notificationPayload = {
            type: "APPLICATION_QUERIED",
            userId: user.id,
            phone: userPhone,
            email: userEmail,
            name: userName,
            businessName: regName,
            queryReason: reason || "Action required on your application.",
            regId: ticketId,
            entitySlug: ticketType === "LLC" ? "llc" : "businesses"
          };
        }
      }

      if (actionType === "FAIL" && issueRefund && refundAmount) {
        const wallet = await tx.wallet.findUnique({ where: { userId: clientId } });
        if (wallet) {
          const balanceBefore = wallet.balance;
          const balanceAfter = Number(balanceBefore) + Number(refundAmount);
          const refundRef = `REF-${Math.floor(Math.random() * 1000000000)}`;

          await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter } });
          await tx.transaction.create({
            data: {
              walletId: wallet.id, amount: refundAmount, balanceBefore, balanceAfter,
              type: "REFUND", status: "SUCCESS", reference: refundRef,
              description: `Refund for Failed Application [${targetRef}]. Reason: ${reason}`
            }
          });
        }
      }

      await tx.staffActionLog.create({
        data: {
          userId: mdsAdmin.id,
          action: `ADMIN_${actionType}`,
          targetId: targetRef,
          details: `Admin executed ${actionType} on ${ticketType}. ${actionType === "ASSIGN" ? `Assigned to staff ${staffId}.` : ''} Reason: ${reason || 'N/A'}`
        }
      });
    });

    if (notificationPayload) {
      await notificationQueue.add("send-admin-action-notification", notificationPayload, {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: true,
      });
    }

    return NextResponse.json({ success: true, message: `Application successfully updated.` });
  } catch (error) {
    console.error("Action API Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
