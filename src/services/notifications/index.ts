// src/services/notifications/index.ts

import { sendWhatsAppTemplate } from "./whatsapp";
import {
  sendApplicationSubmittedEmail,
  sendApplicationQueriedEmail,
  sendApplicationApprovedEmail,
} from "@/lib/email";

export type NotificationEvent =
  | {
      type: "APPLICATION_SUBMITTED";
      phone: string;
      email: string;
      name: string;
      businessName: string;
      regId: string;
    }
  | {
      type: "APPLICATION_QUERIED";
      phone: string;
      email: string;
      name: string;
      businessName: string;
      queryReason: string;
      regId: string;
      entitySlug: "llc" | "businesses";
    }
  | {
      type: "APPLICATION_APPROVED";
      phone: string;
      email: string;
      name: string;
      businessName: string;
      rcNumber: string;
    };

/**
 * Fires notifications asynchronously across Email & WhatsApp without blocking API handlers
 */
export function dispatchNotification(event: NotificationEvent): void {
  setTimeout(async () => {
    try {
      switch (event.type) {
        case "APPLICATION_SUBMITTED": {
          // 1. WhatsApp
          await sendWhatsAppTemplate({
            recipientPhone: event.phone,
            templateName: "cac_application_submitted",
            variables: [event.name, event.businessName, event.regId],
            buttonUrlVariable: `register/view/${event.regId}`,
          });

          // 2. Email
          await sendApplicationSubmittedEmail({
            to: event.email,
            name: event.name,
            businessName: event.businessName,
            regId: event.regId,
          });
          break;
        }

        case "APPLICATION_QUERIED": {
          // 1. WhatsApp
          await sendWhatsAppTemplate({
            recipientPhone: event.phone,
            templateName: "cac_application_queried",
            variables: [event.name, event.businessName, event.queryReason],
            buttonUrlVariable: `${event.entitySlug}/${event.regId}/queries`,
          });

          // 2. Email
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
          // 1. WhatsApp
          await sendWhatsAppTemplate({
            recipientPhone: event.phone,
            templateName: "cac_application_approved",
            variables: [event.name, event.businessName, event.rcNumber],
          });

          // 2. Email
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
