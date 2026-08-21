// src/services/notifications/index.ts

import { prisma } from "@/lib/prisma";
import { sendWhatsAppTemplate } from "./whatsapp";
import {
  sendApplicationSubmittedEmail,
  sendApplicationQueriedEmail,
  sendApplicationApprovedEmail,
  sendScumlProcessingEmail,
  sendScumlCompletedEmail,
  sendScumlFailedEmail,
  sendTaxIdCompletedEmail,
  sendTaxIdFailedEmail,
  sendNinValidationCompletedEmail,
  sendNinValidationFailedEmail,
  sendNinPersonalizationCompletedEmail,
  sendNinPersonalizationFailedEmail,
  sendWelcomeEmail,
  sendFirstWalletFundingEmail,
  sendAbandonedCacReminderEmail,
} from "@/lib/email";

export type NotificationEvent =
  | { type: "APPLICATION_SUBMITTED"; userId: string; phone: string; email: string; name: string; businessName: string; regId: string }
  | { type: "APPLICATION_QUERIED"; userId: string; phone: string; email: string; name: string; businessName: string; queryReason: string; regId: string; entitySlug: "llc" | "businesses" }
  | { 
      type: "APPLICATION_APPROVED"; 
      userId: string; phone: string; email: string; name: string; businessName: string; rcNumber: string;
      certificateUrl?: string; statusReportUrl?: string; memorandumUrl?: string; 
    }
  | { type: "SCUML_PROCESSING"; userId: string; email: string; name: string; companyName: string; transactionRef: string; }
  | { type: "SCUML_COMPLETED"; userId: string; phone: string; email: string; name: string; companyName: string; transactionRef: string; finalCertificateUrl: string; }
  | { type: "SCUML_FAILED"; userId: string; email: string; name: string; companyName: string; transactionRef: string; failureReason: string; refundAmount: number; }
  | { type: "TAXID_COMPLETED"; userId: string; email: string; name: string; requestType: string; taxIdNumber: string; transactionRef: string; taxIdImageUrl?: string; }
  | { type: "TAXID_FAILED"; userId: string; email: string; name: string; requestType: string; failureReason: string; refundAmount: number; transactionRef: string; }
  | { type: "NIN_VALIDATION_COMPLETED"; userId: string; email: string; name: string; category: string; nin: string; transactionRef: string; }
  | { type: "NIN_VALIDATION_FAILED"; userId: string; email: string; name: string; category: string; nin: string; failureReason: string; refundAmount: number; transactionRef: string; }
  | { type: "NIN_PERSONALIZATION_COMPLETED"; userId: string; email: string; name: string; trackingId: string; reference: string; }
  | { type: "NIN_PERSONALIZATION_FAILED"; userId: string; email: string; name: string; trackingId: string; reference: string; failureReason: string; refundAmount: number; }
  | { type: "WELCOME_EMAIL"; userId: string; email: string; firstName: string; baseUrl?: string; }
  | { type: "FIRST_WALLET_FUNDING_EMAIL"; userId: string; email: string; firstName: string; amount: number; balance: number; reference: string; baseUrl?: string; }
  | { type: "ABANDONED_CAC_EMAIL"; userId: string; email: string; firstName: string; businessName: string; entityType: string; trackingId: string; registrationId: string; continueUrl: string; };

export async function dispatchNotification(event: NotificationEvent): Promise<void> {
  switch (event.type) {
    
    // =====================================
    // CAC NOTIFICATIONS
    // =====================================
    case "APPLICATION_SUBMITTED": {
      await prisma.inAppNotification.create({
        data: {
          userId: event.userId,
          title: "Application Received 📄",
          message: `Payment confirmed for ${event.businessName}. Your filing is under review.`,
          type: "info",
          link: `/dashboard/cac`,
        },
      });

      const wa = await sendWhatsAppTemplate({
        recipientPhone: event.phone,
        templateName: "cac_application_submitted",
        variables: [event.name, event.businessName, event.regId],
        // ✅ FIX: Pass the regId so Meta can successfully build the URL button
        buttonUrlVariable: event.regId, 
      });
      if (!wa.success) console.error("⚠️ WhatsApp Sub Failed:", wa.error);

      await sendApplicationSubmittedEmail({
        to: event.email, name: event.name, businessName: event.businessName, regId: event.regId,
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
        buttonUrlVariable: `${event.entitySlug}/${event.regId}/queries`,
      });
      if (!wa.success) console.error("⚠️ WhatsApp Query Failed:", wa.error);

      await sendApplicationQueriedEmail({
        to: event.email, name: event.name, businessName: event.businessName,
        queryReason: event.queryReason, regId: event.regId, entitySlug: event.entitySlug,
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
        // NOTE: If you add a URL button to the 'approved' template in Meta later, 
        // you will need to change this to event.rcNumber or the dynamic slug.
        buttonUrlVariable: "",
      });
      if (!wa.success) console.error("⚠️ WhatsApp Appr Failed:", wa.error);

      await sendApplicationApprovedEmail({
        to: event.email, name: event.name, businessName: event.businessName, rcNumber: event.rcNumber,
        certificateUrl: event.certificateUrl, statusReportUrl: event.statusReportUrl, memorandumUrl: event.memorandumUrl        
      });
      break;
    }

    // =====================================
    // SCUML NOTIFICATIONS
    // =====================================
    case "SCUML_PROCESSING": {
      await prisma.inAppNotification.create({
        data: {
          userId: event.userId,
          title: "SCUML Processing ⚙️",
          message: `${event.companyName} is now being actively processed by the EFCC.`,
          type: "info",
          link: `/dashboard/scuml/history`,
        },
      });
      
      // Email Only
      await sendScumlProcessingEmail({
        to: event.email, name: event.name, companyName: event.companyName, transactionRef: event.transactionRef
      });
      break;
    }

    case "SCUML_COMPLETED": {
      await prisma.inAppNotification.create({
        data: {
          userId: event.userId,
          title: "SCUML Approved 🎉",
          message: `Your SCUML certificate for ${event.companyName} is ready for download!`,
          type: "success",
          link: `/dashboard/scuml/history`,
        },
      });
      
      // WhatsApp with DOCUMENT ATTACHMENT
      const wa = await sendWhatsAppTemplate({
        recipientPhone: event.phone,
        templateName: "scuml_application_approved",
        variables: [event.name, event.companyName], 
        buttonUrlVariable: "",
        mediaUrl: event.finalCertificateUrl // <-- Injects PDF URL into the Header Document
      });
      if (!wa.success) console.error("⚠️ WhatsApp SCUML Appr Failed:", wa.error);

      await sendScumlCompletedEmail({
        to: event.email, name: event.name, companyName: event.companyName, finalCertificateUrl: event.finalCertificateUrl
      });
      break;
    }

    case "SCUML_FAILED": {
      await prisma.inAppNotification.create({
        data: {
          userId: event.userId,
          title: "SCUML Failed ⚠️",
          message: `Your application for ${event.companyName} was rejected. See details.`,
          type: "warning",
          link: `/dashboard/scuml/history`,
        },
      });
      
      // Email Only for Failure
      await sendScumlFailedEmail({
        to: event.email, name: event.name, companyName: event.companyName, 
        failureReason: event.failureReason, refundAmount: event.refundAmount
      });
      break;
    }

    // =====================================
    // TAX ID NOTIFICATIONS
    // =====================================
    case "TAXID_COMPLETED": {
      await prisma.inAppNotification.create({
        data: {
          userId: event.userId,
          title: "Tax ID Generated 🎉",
          message: `Your ${event.requestType} Tax ID is: ${event.taxIdNumber}`,
          type: "success",
          link: `/dashboard/tax-id/history`,
        },
      });
      await sendTaxIdCompletedEmail({
        to: event.email, 
        name: event.name, 
        requestType: event.requestType, 
        taxIdNumber: event.taxIdNumber,
        taxIdImageUrl: event.taxIdImageUrl
      });
      break;
    }

    case "TAXID_FAILED": {
      await prisma.inAppNotification.create({
        data: {
          userId: event.userId,
          title: "Tax ID Failed ⚠️",
          message: `Your request was rejected. Reason: ${event.failureReason}`,
          type: "warning",
          link: `/dashboard/tax-id/history`,
        },
      });
      await sendTaxIdFailedEmail({
        to: event.email, name: event.name, requestType: event.requestType, 
        failureReason: event.failureReason, refundAmount: event.refundAmount
      });
      break;
    }

    // =====================================
    // NIN VALIDATION NOTIFICATIONS
    // =====================================
    case "NIN_VALIDATION_COMPLETED": {
      const masked = event.nin.length >= 4 ? `*******${event.nin.slice(-4)}` : event.nin;
      await prisma.inAppNotification.create({
        data: {
          userId: event.userId,
          title: "NIN Validation Successful! 🎉",
          message: `Your validation for ${event.category} (${masked}) is complete.`,
          type: "success",
          link: `/dashboard/nin/validation/history`,
        },
      });
      await sendNinValidationCompletedEmail({
        to: event.email,
        name: event.name,
        nin: event.nin,
        category: event.category,
        transactionRef: event.transactionRef,
      });
      break;
    }

    case "NIN_VALIDATION_FAILED": {
      const masked = event.nin.length >= 4 ? `*******${event.nin.slice(-4)}` : event.nin;
      await prisma.inAppNotification.create({
        data: {
          userId: event.userId,
          title: "NIN Validation Failed ⚠️",
          message: `Validation for ${event.category} (${masked}) could not be completed. Reason: ${event.failureReason}`,
          type: "warning",
          link: `/dashboard/nin/validation/history`,
        },
      });
      await sendNinValidationFailedEmail({
        to: event.email,
        name: event.name,
        nin: event.nin,
        category: event.category,
        transactionRef: event.transactionRef,
        failureReason: event.failureReason,
        refundAmount: event.refundAmount,
      });
      break;
    }

    // =====================================
    // NIN PERSONALIZATION NOTIFICATIONS
    // =====================================
    case "NIN_PERSONALIZATION_COMPLETED": {
      await prisma.inAppNotification.create({
        data: {
          userId: event.userId,
          title: "NIN Personalization Complete! 🎉",
          message: `Your personalization for Tracking ID ${event.trackingId} is complete. Your NIN is ready.`,
          type: "success",
          link: `/dashboard/nin/personalization/history`,
        },
      });
      await sendNinPersonalizationCompletedEmail({
        to: event.email,
        name: event.name,
        trackingId: event.trackingId,
        reference: event.reference,
      });
      break;
    }

    case "NIN_PERSONALIZATION_FAILED": {
      await prisma.inAppNotification.create({
        data: {
          userId: event.userId,
          title: "NIN Personalization Failed ⚠️",
          message: `Personalization for Tracking ID ${event.trackingId} could not be completed. Reason: ${event.failureReason}`,
          type: "warning",
          link: `/dashboard/nin/personalization/history`,
        },
      });
      await sendNinPersonalizationFailedEmail({
        to: event.email,
        name: event.name,
        trackingId: event.trackingId,
        reference: event.reference,
        failureReason: event.failureReason,
        refundAmount: event.refundAmount,
      });
      break;
    }

    // =====================================
    // AUTOMATED LIFECYCLE EMAILS (WITH DEDUP)
    // =====================================
    case "WELCOME_EMAIL": {
      try {
        const existing = await prisma.automatedEmailLog.findFirst({
          where: {
            userId: event.userId,
            emailType: "WELCOME",
          },
        });

        if (existing) {
          console.log(`ℹ️ Welcome email already sent to user ${event.userId}. Skipping duplicate.`);
          break;
        }

        await sendWelcomeEmail({
          to: event.email,
          firstName: event.firstName,
          baseUrl: event.baseUrl,
        });

        await prisma.automatedEmailLog.create({
          data: {
            userId: event.userId,
            email: event.email,
            emailType: "WELCOME",
            status: "SENT",
          },
        });
      } catch (err: any) {
        console.error("Failed to dispatch Welcome Email:", err);
      }
      break;
    }

    case "FIRST_WALLET_FUNDING_EMAIL": {
      try {
        const existing = await prisma.automatedEmailLog.findFirst({
          where: {
            userId: event.userId,
            emailType: "FIRST_WALLET_FUNDING",
          },
        });

        if (existing) {
          console.log(`ℹ️ First wallet funding email already sent to user ${event.userId}. Skipping duplicate.`);
          break;
        }

        await sendFirstWalletFundingEmail({
          to: event.email,
          firstName: event.firstName,
          amount: event.amount,
          balance: event.balance,
          reference: event.reference,
          baseUrl: event.baseUrl,
        });

        await prisma.automatedEmailLog.create({
          data: {
            userId: event.userId,
            email: event.email,
            emailType: "FIRST_WALLET_FUNDING",
            entityId: event.reference,
            status: "SENT",
          },
        });
      } catch (err: any) {
        console.error("Failed to dispatch First Wallet Funding Email:", err);
      }
      break;
    }

    case "ABANDONED_CAC_EMAIL": {
      try {
        const existing = await prisma.automatedEmailLog.findFirst({
          where: {
            userId: event.userId,
            emailType: "ABANDONED_CAC",
            entityId: event.registrationId,
          },
        });

        if (existing) {
          console.log(`ℹ️ Abandoned CAC reminder already sent for registration ${event.registrationId}. Skipping duplicate.`);
          break;
        }

        await sendAbandonedCacReminderEmail({
          to: event.email,
          firstName: event.firstName,
          businessName: event.businessName,
          entityType: event.entityType,
          trackingId: event.trackingId,
          continueUrl: event.continueUrl,
        });

        await prisma.automatedEmailLog.create({
          data: {
            userId: event.userId,
            email: event.email,
            emailType: "ABANDONED_CAC",
            entityId: event.registrationId,
            status: "SENT",
          },
        });
      } catch (err: any) {
        console.error("Failed to dispatch Abandoned CAC Reminder Email:", err);
      }
      break;
    }
  }
}
