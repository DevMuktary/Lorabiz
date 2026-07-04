import { sendWhatsAppTemplate } from "./whatsapp";
// Note: You can import your ZeptoMail client here alongside WhatsApp

export type NotificationEvent =
  | { type: "APPLICATION_SUBMITTED"; phone: string; email: string; name: string; businessName: string; regId: string }
  | { type: "APPLICATION_QUERIED"; phone: string; email: string; name: string; businessName: string; queryReason: string; regId: string; entitySlug: "llc" | "businesses" }
  | { type: "APPLICATION_APPROVED"; phone: string; email: string; name: string; businessName: string; rcNumber: string };

/**
 * Fires notifications asynchronously without blocking API responses
 */
export function dispatchNotification(event: NotificationEvent): void {
  // Execute asynchronously in background
  setTimeout(async () => {
    try {
      switch (event.type) {
        case "APPLICATION_SUBMITTED": {
          await sendWhatsAppTemplate({
            recipientPhone: event.phone,
            templateName: "cac_application_submitted",
            variables: [event.name, event.businessName, event.regId],
            buttonUrlVariable: `register/view/${event.regId}`,
          });
          break;
        }

        case "APPLICATION_QUERIED": {
          await sendWhatsAppTemplate({
            recipientPhone: event.phone,
            templateName: "cac_application_queried",
            variables: [event.name, event.businessName, event.queryReason],
            buttonUrlVariable: `${event.entitySlug}/${event.regId}/queries`,
          });
          break;
        }

        case "APPLICATION_APPROVED": {
          await sendWhatsAppTemplate({
            recipientPhone: event.phone,
            templateName: "cac_application_approved",
            variables: [event.name, event.businessName, event.rcNumber],
          });
          break;
        }
      }
    } catch (err) {
      console.error(`Error dispatching notification [${event.type}]:`, err);
    }
  }, 0);
}
