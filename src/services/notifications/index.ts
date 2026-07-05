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
          // 1. Database In-App Alert
          await prisma.inAppNotification.create({
            data: {
              userId: event.userId,
              title: "Application Received 📄",
              message: `Payment confirmed for ${event.businessName}. Your filing is under review.`,
              type: "info",
              link: `/dashboard/cac/register/view/${event.regId}`,
            },
          });

          // 2. WhatsApp & 3. Email
          await sendWhatsAppTemplate({
            recipientPhone: event.phone,
            templateName: "cac_application_submitted",
            variables: [event.name, event.businessName, event.regId],
            buttonUrlVariable: event.regId, // FIX: Added the missing URL parameter!
          });
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

          await sendWhatsAppTemplate({
            recipientPhone: event.phone,
            templateName: "cac_application_queried",
            variables: [event.name, event.businessName, event.queryReason],
            buttonUrlVariable: `${event.entitySlug}/${event.regId}/queries`, // FIX: Added the missing URL parameter!
          });
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

          await sendWhatsAppTemplate({
            recipientPhone: event.phone,
            templateName: "cac_application_approved",
            variables: [event.name, event.businessName, event.rcNumber],
            buttonUrlVariable: event.rcNumber, // FIX: Added the missing URL parameter!
          });
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
      console.error(`❌ Dispatch Notification Error [${event.type}]:`, err);
    }
  }, 0);
}
