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
  sendTaxIdFailedEmail
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
  | { type: "TAXID_FAILED"; userId: string; email: string; name: string; requestType: string; failureReason: string; refundAmount: number; transactionRef: string; };

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
        buttonUrlVariable: ``, 
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
  }
}
