import { prisma } from "@/lib/prisma";
import { sendWhatsAppTemplate } from "./whatsapp";
import {
  sendApplicationSubmittedEmail,
  sendApplicationQueriedEmail,
  sendApplicationApprovedEmail,
} from "@/lib/email";

export type NotificationEvent =
  | { type: "APPLICATION_SUBMITTED"; userId: string; phone: string; email: string; name: string; businessName: string; regId: string }
  | { type: "APPLICATION_QUERIED"; userId: string; phone: string; email: string; name: string; businessName: string; queryReason: string; regId: string; entitySlug: "llc" | "businesses" }
  | { type: "APPLICATION_APPROVED"; userId: string; phone: string; email: string; name: string; businessName: string; rcNumber: string };

export function dispatchNotification(event: NotificationEvent): void {
  setTimeout(async () => {
    try {
      switch (event.type) {
        case "APPLICATION_SUBMITTED": {
          await prisma.inAppNotification.create({
            data: {
              userId: event.userId,
              title: "Application Received 📄",
              message: `Payment confirmed for ${event.businessName}. Your filing is under review.`,
              type: "info",
              link: `/dashboard/cac/register/view/${event.regId}`,
            },
          });

          const wa = await sendWhatsAppTemplate({
            recipientPhone: event.phone,
            templateName: "cac_application_submitted",
            variables: [event.name, event.businessName, event.regId],
            buttonUrlVariable: event.regId, 
          });
          if (!wa.success) console.error("⚠️ WhatsApp Sub Failed:", wa.error);

          await sendApplicationSubmittedEmail({
            to: event.email,
            name: event.name,
            businessName: event.businessName,
            regId: event.regId,
          });
          break;
        }

        case "APPLICATION_QUERIED": {
          await prisma.inAppNotification.create({
            data: {
              userId: event.userId,
              title: "Action Required: CAC Query ⚠️",
              message: `Examiner feedback on ${event.businessName}: "${event.queryReason}"`,
              type: "warning",
              link: `/dashboard/cac/${event.entitySlug}/${event.regId}/queries`,
            },
          });

          const wa = await sendWhatsAppTemplate({
            recipientPhone: event.phone,
            templateName: "cac_application_queried",
            variables: [event.name, event.businessName, event.queryReason],
            buttonUrlVariable: event.regId, 
          });
          if (!wa.success) console.error("⚠️ WhatsApp Query Failed:", wa.error);

          await sendApplicationQueriedEmail({
            to: event.email,
            name: event.name,
            businessName: event.businessName,
            queryReason: event.queryReason,
            regId: event.regId,
            entitySlug: event.entitySlug,
          });
          break;
        }

        case "APPLICATION_APPROVED": {
          await prisma.inAppNotification.create({
            data: {
              userId: event.userId,
              title: "Incorporation Approved 🎉",
              message: `Congratulations! ${event.businessName} is registered (RC/BN: ${event.rcNumber}). Documents are ready.`,
              type: "success",
              link: `/dashboard/cac`,
            },
          });

          const wa = await sendWhatsAppTemplate({
            recipientPhone: event.phone,
            templateName: "cac_application_approved",
            variables: [event.name, event.businessName, event.rcNumber],
            buttonUrlVariable: "cac",
          });
          if (!wa.success) console.error("⚠️ WhatsApp Appr Failed:", wa.error);

          await sendApplicationApprovedEmail({
            to: event.email,
            name: event.name,
            businessName: event.businessName,
            rcNumber: event.rcNumber,
          });
          break;
        }
      }
    } catch (err) {
      console.error(`❌ Dispatch Notification Catch Error [${event.type}]:`, err);
    }
  }, 0);
}
