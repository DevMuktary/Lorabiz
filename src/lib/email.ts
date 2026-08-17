// src/lib/email.ts
import crypto from "crypto";
import { sanitizeEmailHtml } from "@/lib/sanitize-email";

export async function sendEmail({ 
  to, 
  subject, 
  htmlBody,
  attachments = [] 
}: { 
  to: string; 
  subject: string; 
  htmlBody: string;
  attachments?: { name: string; mime_type: string; content: string }[];
}) {
  const url = "https://api.zeptomail.com/v1.1/email";
  const token = process.env.ZEPTOMAIL_API_KEY;
  const sender = process.env.ZEPTOMAIL_SENDER;

  if (!token || !sender) {
    throw new Error("Missing ZeptoMail environment variables. Check your Railway settings.");
  }

  const payload: any = {
    from: { address: sender, name: "LoraBiz" },
    to: [{ email_address: { address: to } }],
    subject: subject,
    htmlbody: htmlBody,
  };

  if (attachments.length > 0) {
    payload.attachments = attachments;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": token,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.error("ZeptoMail Error Payload:", errorData);
    throw new Error("Failed to dispatch email via ZeptoMail");
  }

  return res.json();
}

// Helper function to fetch a PDF URL and convert it to Base64 for ZeptoMail
async function fetchPdfAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch file");
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (error) {
    console.error(`Error converting file to base64 (${url}):`, error);
    return null;
  }
}

// Reusable template layout wrapper using Bulletproof HTML Tables
function getBaseLayout(content: string, previewText: string = "") {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LoraBiz Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; color: #1e293b; -webkit-font-smoothing: antialiased;">
      
      <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; color: #f4f5f7; line-height: 1px;">
        ${previewText}
        &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f4f5f7; margin: 0; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="560" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; width: 100%; max-width: 560px; margin: 0 auto;">
              
              <tr>
                <td align="center" style="background-color: #0f172a; padding: 28px 32px;">
                  <img src="https://lorabiz.com/logo.png" alt="LoraBiz" width="150" height="auto" style="display: block; border: 0; outline: none; text-decoration: none;" />
                </td>
              </tr>

              <tr>
                <td style="padding: 32px; background-color: #ffffff;">
                  ${content}
                </td>
              </tr>

              <tr>
                <td align="center" style="padding: 0; background-color: #ffffff;">
                  <img src="https://lorabiz.com/lorabiz-footer.jpg" alt="LoraBiz Services" width="560" height="auto" style="display: block; border: 0; max-width: 100%; height: auto; outline: none;" />
                </td>
              </tr>

              <tr>
                <td align="center" style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #f1f5f9;">
                  <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.6; font-family: sans-serif;">
                    You received this email because of an active session on LoraBiz.<br/>
                    &copy; ${new Date().getFullYear()} Quadrox Technologies Limited. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ============================================================================
// REGISTRATION & ANTI-ENUMERATION
// ============================================================================

export async function sendVerificationOTP(to: string, otpCode: string) {
  const subject = `${otpCode} is your LoraBiz Registration Code`;
  const previewText = `Code: ${otpCode}. Use this to verify your email address.`;
  
  const content = `
    <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #ff3f7a; border-radius: 12px; border: 2px dashed #e2e8f0; margin-bottom: 24px; font-family: monospace;">
      ${otpCode}
    </div>
    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">Verify your email address</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 24px; font-size: 15px; font-family: sans-serif;">
      Welcome! Use the secure verification code above to complete your registration on LoraBiz. 
      <strong>This code expires in 10 minutes.</strong>
    </p>
    <p style="color: #94a3b8; font-size: 13px; margin: 0; font-family: sans-serif;">If you did not request this verification, please safely ignore this email.</p>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

export async function sendAccountExistsEmail(to: string) {
  const subject = "LoraBiz - Registration Attempt";
  const previewText = "Notice: Someone tried to register using your email address.";

  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">Registration Attempt</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 16px; font-size: 15px; font-family: sans-serif;">
      Someone (hopefully you) just tried to register a new LoraBiz account with this email address.
    </p>
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5; font-family: sans-serif;">
        <strong>Notice:</strong> You already have an account with us.
      </p>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 24px; font-size: 15px; font-family: sans-serif;">
      If you forgot your password, please go to the login page and click "Forgot Password". If you did not make this request, you can safely ignore this email.
    </p>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

// ============================================================================
// STANDARD USER LOGIN 2FA
// ============================================================================

export async function sendUserLoginOTP(to: string, otpCode: string) {
  const subject = `${otpCode} is your LoraBiz Login Code`;
  const previewText = `Code: ${otpCode}. Enter this to securely access your dashboard.`;

  const content = `
    <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #ff3f7a; border-radius: 12px; border: 2px dashed #e2e8f0; margin-bottom: 24px; font-family: monospace;">
      ${otpCode}
    </div>
    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">Verify your login attempt</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 24px; font-size: 15px; font-family: sans-serif;">
      A successful password entry was detected for your account. Please use the secure authorization code above to complete your login and access your dashboard. 
      <strong>This code expires in 10 minutes.</strong>
    </p>
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 8px;">
      <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5; font-family: sans-serif;">
        <strong>Security Notice:</strong> If you did not attempt to log in, your password may be compromised. Please reset your password immediately.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

// ============================================================================
// INTERNAL STAFF & MD TWO-FACTOR AUTHENTICATION PASSKEY
// ============================================================================

export async function send2FAPasskeyEmail(to: string, otpCode: string, role?: string) {
  const isExecutive = role === "ADMIN";
  const portalName = isExecutive ? "Managing Director Executive Control Plane" : "Staff Operations & Compliance Desk";
  const accentColor = isExecutive ? "#d97706" : "#0d9488"; 
  
  const subject = `[SECURITY] ${otpCode} - Admin Verification Passkey`;
  const previewText = `Code: ${otpCode}. Authorization required for ${portalName}.`;

  const content = `
    <div style="display: inline-block; background-color: #0f172a; color: ${accentColor}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 12px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #334155; font-family: sans-serif;">
      🛡️ Zero-Trust Identity Verification
    </div>
    <div style="background: #0f172a; padding: 20px; text-align: center; font-size: 40px; font-weight: 800; letter-spacing: 8px; color: ${accentColor}; border-radius: 12px; border: 1px solid #334155; margin-bottom: 24px; font-family: monospace;">
      ${otpCode}
    </div>
    <h2 style="color: #0f172a; margin: 0 0 12px; font-size: 20px; font-family: sans-serif;">Authorize Portal Access</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 24px; font-size: 14px; font-family: sans-serif;">
      An authentication attempt was initiated for your clearance tier on the <strong>${portalName}</strong>.<br/>
      Input the 6-digit cryptographic passkey above to verify your session. <strong>Valid for 10 minutes.</strong>
    </p>
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 8px;">
      <p style="margin: 0; font-size: 12px; color: #991b1b; line-height: 1.5; font-family: sans-serif;">
        <strong>Security Warning:</strong> LoraBiz IT personnel will never ask for this passkey. If you did not initiate this sign-in attempt, your administrative credentials may be compromised. Report this event to security operations immediately.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

// ============================================================================
// PROFILE SETTINGS & SECURITY OTPs
// ============================================================================

export async function sendPhoneChangeOTP(to: string, otpCode: string, newPhone: string) {
  const subject = `${otpCode} is your Phone Update Code`;
  const previewText = `Code: ${otpCode}. Verify your request to change phone number to ${newPhone}.`;

  const content = `
    <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #ff3f7a; border-radius: 12px; border: 2px dashed #e2e8f0; margin-bottom: 24px; font-family: monospace;">
      ${otpCode}
    </div>
    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">Verify your new phone number</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 24px; font-size: 15px; font-family: sans-serif;">
      You requested to change your account's primary phone number to <strong>${newPhone}</strong>. 
      Please use the authorization code above to confirm this change. 
      <strong>This code expires in 10 minutes.</strong>
    </p>
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 8px;">
      <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5; font-family: sans-serif;">
        <strong>Security Notice:</strong> You can only change your phone number once every 30 days. If you did not request this, please secure your account immediately.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

export async function sendPasswordChangeOTP(to: string, otpCode: string) {
  const subject = `${otpCode} is your Password Update Code`;
  const previewText = `Code: ${otpCode}. Verify your request to change your account password.`;

  const content = `
    <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #ff3f7a; border-radius: 12px; border: 2px dashed #e2e8f0; margin-bottom: 24px; font-family: monospace;">
      ${otpCode}
    </div>
    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">Verify your password change</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 24px; font-size: 15px; font-family: sans-serif;">
      You recently requested to update your account password. 
      Please use the secure authorization code above to confirm this critical security change. 
      <strong>This code expires in 10 minutes.</strong>
    </p>
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 8px;">
      <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5; font-family: sans-serif;">
        <strong>Security Notice:</strong> If you did not request a password change, please contact LoraBiz support immediately to lock down your account.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

// ============================================================================
// STATUS NOTIFICATIONS
// ============================================================================

export async function sendApplicationSubmittedEmail({
  to, name, businessName, regId,
}: { to: string; name: string; businessName: string; regId: string; }) {
  
  const subject = `Application Received: ${businessName}`;
  const previewText = `We have received your filing for ${businessName} (Ref: ${regId}).`;

  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">We've received your filing! 🎉</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      Your incorporation filing for <strong>${businessName}</strong> has been received and payment confirmed. Our compliance engine is currently processing your documents with the Corporate Affairs Commission (CAC).
    </p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px; font-family: sans-serif;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Registration Details</p>
      <p style="margin: 0; font-size: 15px; color: #0f172a;"><strong>Entity Name:</strong> ${businessName}</p>
      <p style="margin: 6px 0 0; font-size: 15px; color: #0f172a;"><strong>Tracking Ref:</strong> ${regId}</p>
    </div>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/cac" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Track Application Status</a>
    </div>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

export async function sendApplicationQueriedEmail({
  to, name, businessName, queryReason, regId, entitySlug,
}: { to: string; name: string; businessName: string; queryReason: string; regId: string; entitySlug: "llc" | "businesses"; }) {
  
  const subject = `Action Required: CAC Query on ${businessName}`;
  const previewText = `Action required: CAC has paused your registration for ${businessName}.`;

  const content = `
    <h2 style="color: #b45309; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">Action Required: CAC Query ⚠️</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      The Corporate Affairs Commission (CAC) examiner has paused your registration for <strong>${businessName}</strong> and requested corrections.
    </p>
    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 28px; font-family: sans-serif;">
      <p style="margin: 0 0 8px; font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Examiner Notes</p>
      <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6; white-space: pre-wrap;">"${queryReason}"</p>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px; font-family: sans-serif;">
      Please resolve this issue immediately using our interactive wizard. You will not be charged any additional fee to resubmit your corrections.
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/cac/${entitySlug}/${regId}/queries" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Resolve Query Now</a>
    </div>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

export async function sendApplicationApprovedEmail({
  to, name, businessName, rcNumber, certificateUrl, statusReportUrl, memorandumUrl
}: { 
  to: string; name: string; businessName: string; rcNumber: string; 
  certificateUrl?: string; statusReportUrl?: string; memorandumUrl?: string;
}) {
  
  const subject = `Incorporation Approved: ${businessName} 🎉`;
  const previewText = `Congratulations! ${businessName} is approved. RC Number: ${rcNumber}`;

  const content = `
    <h2 style="color: #15803d; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">Incorporation Approved! 🎉</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Congratulations <strong>${name}</strong>,<br/>
      Your business <strong>${businessName}</strong> has been officially approved and registered by the Corporate Affairs Commission.
    </p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px; font-family: sans-serif;">
      <p style="margin: 0 0 6px; font-size: 13px; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Official Registration Number</p>
      <p style="margin: 0; font-size: 28px; font-weight: 800; color: #15803d; letter-spacing: 1px;">${rcNumber}</p>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px; font-family: sans-serif;">
      We have safely attached your official CAC Certificate and other applicable incorporation documents directly to this email for your convenience. You can also view and download them anytime in your portal.
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/cac" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Go to CAC Dashboard</a>
    </div>
  `;

  const attachments: { name: string; mime_type: string; content: string }[] = [];
  
  if (certificateUrl) {
    const b64 = await fetchPdfAsBase64(certificateUrl);
    if (b64) attachments.push({ name: `CAC_Certificate_${rcNumber}.pdf`, mime_type: "application/pdf", content: b64 });
  }
  if (statusReportUrl) {
    const b64 = await fetchPdfAsBase64(statusReportUrl);
    if (b64) attachments.push({ name: `Status_Report_${rcNumber}.pdf`, mime_type: "application/pdf", content: b64 });
  }
  if (memorandumUrl) {
    const b64 = await fetchPdfAsBase64(memorandumUrl);
    if (b64) attachments.push({ name: `Memorandum_${rcNumber}.pdf`, mime_type: "application/pdf", content: b64 });
  }

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText), attachments });
}

// ============================================================================
// SCUML SUBMISSION NOTIFICATION
// ============================================================================

export async function sendScumlSubmittedEmail({
  to, name, companyName, regType, transactionRef,
}: { to: string; name: string; companyName: string; regType: string; transactionRef: string; }) {
  
  const subject = `SCUML Application Received: ${companyName}`;
  const previewText = `We have received your SCUML registration request for ${companyName} (Ref: ${transactionRef}).`;

  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">SCUML Application Received 🛡️</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      Your SCUML certificate registration request for <strong>${companyName}</strong> has been received and your payment is confirmed. Our compliance team is currently processing your documents with the relevant agencies.
    </p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px; font-family: sans-serif;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Application Details</p>
      <p style="margin: 0; font-size: 15px; color: #0f172a;"><strong>Entity Name:</strong> ${companyName}</p>
      <p style="margin: 6px 0 0; font-size: 15px; color: #0f172a;"><strong>Type:</strong> ${regType.replace('_', ' ')}</p>
      <p style="margin: 6px 0 0; font-size: 15px; color: #0f172a;"><strong>Tracking Ref:</strong> ${transactionRef}</p>
    </div>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/scuml/history" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Track Application Status</a>
    </div>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

export async function sendTaxIdSubmittedEmail({
  to, name, requestType, transactionRef,
}: { to: string; name: string; requestType: string; transactionRef: string; }) {
  const subject = `Tax ID Application Received`;
  const previewText = `We have received your Tax ID registration request (Ref: ${transactionRef}).`;

  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">Tax ID Request Received 📝</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      Your Tax Identification Number (TIN) request has been received and your payment is confirmed. Our team is currently processing it.
    </p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px; font-family: sans-serif;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Application Details</p>
      <p style="margin: 0; font-size: 15px; color: #0f172a;"><strong>Type:</strong> ${requestType}</p>
      <p style="margin: 6px 0 0; font-size: 15px; color: #0f172a;"><strong>Tracking Ref:</strong> ${transactionRef}</p>
    </div>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/tax-id/history" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Track Application Status</a>
    </div>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

// ============================================================================
// SCUML PIPELINE NOTIFICATIONS
// ============================================================================

export async function sendScumlProcessingEmail({
  to, name, companyName, transactionRef,
}: { to: string; name: string; companyName: string; transactionRef: string; }) {
  const subject = `SCUML Processing Initiated: ${companyName}`;
  const previewText = `Your SCUML application for ${companyName} is now being processed by the EFCC.`;

  const content = `
    <h2 style="color: #0284c7; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">Application Processing ⚙️</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      Great news! Your SCUML certificate registration for <strong>${companyName}</strong> (Ref: ${transactionRef}) has passed our internal compliance checks and is now being actively processed by the <strong>Economic and Financial Crimes Commission (EFCC)</strong>.
    </p>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px; font-family: sans-serif;">
      We will notify you immediately once the certificate is approved and ready for download.
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/scuml/history" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">View SCUML History</a>
    </div>
  `;
  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

export async function sendScumlCompletedEmail({
  to, name, companyName, finalCertificateUrl,
}: { to: string; name: string; companyName: string; finalCertificateUrl: string; }) {
  const subject = `SCUML Certificate Approved: ${companyName} 🎉`;
  const previewText = `Congratulations! Your SCUML Certificate for ${companyName} is ready.`;

  const content = `
    <h2 style="color: #15803d; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">SCUML Approved! 🎉</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Congratulations <strong>${name}</strong>,<br/>
      Your Special Control Unit Against Money Laundering (SCUML) certificate for <strong>${companyName}</strong> has been officially approved.
    </p>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px; font-family: sans-serif;">
      We have safely attached your official SCUML Certificate directly to this email. You can also download it anytime by logging into your portal, going to your <strong>SCUML History page</strong>, scrolling to this application, and clicking the Download button.
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/scuml/history" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Download from Dashboard</a>
    </div>
  `;

  const attachments: { name: string; mime_type: string; content: string }[] = [];
  const b64 = await fetchPdfAsBase64(finalCertificateUrl);
  if (b64) {
    attachments.push({ name: `SCUML_Certificate_${companyName.replace(/\s+/g, '_')}.pdf`, mime_type: "application/pdf", content: b64 });
  }

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText), attachments });
}

export async function sendScumlFailedEmail({
  to, name, companyName, failureReason, refundAmount
}: { to: string; name: string; companyName: string; failureReason: string; refundAmount: number; }) {
  const subject = `Update on SCUML Application: ${companyName}`;
  const previewText = `Your SCUML application was rejected. Please review the details.`;

  const content = `
    <h2 style="color: #b45309; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">Application Failed ⚠️</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      Unfortunately, your SCUML certificate application for <strong>${companyName}</strong> could not be completed and has been rejected by the authorities.
    </p>
    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px; font-family: sans-serif;">
      <p style="margin: 0 0 8px; font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Reason for Rejection</p>
      <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6; white-space: pre-wrap;">${failureReason}</p>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px; font-family: sans-serif;">
      ${refundAmount > 0 ? `A refund of <strong>₦${refundAmount.toLocaleString()}</strong> has been credited back to your Lorabiz Wallet.` : 'No refund was issued for this application.'} 
      Please check your <strong>Transaction History</strong> for full financial details.
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/transactions" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">View Transaction History</a>
    </div>
  `;
  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

// ============================================================================
// TAX ID NOTIFICATIONS (Pre-Built for upcoming feature)
// ============================================================================


export async function sendTaxIdCompletedEmail({
  to, name, taxIdNumber, requestType, taxIdImageUrl
}: { to: string; name: string; taxIdNumber: string; requestType: string; taxIdImageUrl?: string; }) {
  const subject = `Your Tax ID is Ready! 🎉`;
  const previewText = `Your ${requestType} Tax Identification Number is: ${taxIdNumber}`;

  const content = `
    <h2 style="color: #15803d; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">Tax ID Generated! 🎉</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Congratulations <strong>${name}</strong>,<br/>
      Your ${requestType} Tax Identification Number has been successfully generated.
    </p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px; font-family: sans-serif;">
      <p style="margin: 0 0 6px; font-size: 13px; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Official Tax ID Number (TIN)</p>
      <p style="margin: 0; font-size: 36px; font-weight: 800; color: #15803d; letter-spacing: 4px;">${taxIdNumber}</p>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px; font-family: sans-serif;">
      We have attached the official snapshot of your Tax ID to this email. You can safely download it, or copy the number directly from your dashboard.
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/tax-id/history" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Go to Tax ID History</a>
    </div>
  `;

  const attachments: { name: string; mime_type: string; content: string }[] = [];
  
  if (taxIdImageUrl) {
    const b64 = await fetchPdfAsBase64(taxIdImageUrl); // Reusing your existing fetch helper
    if (b64) {
      attachments.push({ 
        name: `Tax_ID_${taxIdNumber}.jpg`, 
        mime_type: "image/jpeg", 
        content: b64 
      });
    }
  }

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText), attachments });
} 
export async function sendTaxIdFailedEmail({
  to, name, failureReason, refundAmount, requestType
}: { to: string; name: string; failureReason: string; refundAmount: number; requestType: string; }) {
  const subject = `Update on Tax ID Request`;
  const previewText = `Your ${requestType} Tax ID request was rejected.`;

  const content = `
    <h2 style="color: #b45309; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">Application Failed</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      Unfortunately, your request for a ${requestType} Tax ID could not be completed.
    </p>
    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px; font-family: sans-serif;">
      <p style="margin: 0 0 8px; font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Reason for Rejection</p>
      <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6; white-space: pre-wrap;">${failureReason}</p>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px; font-family: sans-serif;">
      ${refundAmount > 0 ? `A refund of <strong>₦${refundAmount.toLocaleString()}</strong> has been credited back to your Lorabiz Wallet.` : 'No refund was issued for this application.'} 
      Please check your <strong>Transaction History</strong> for full financial details.
    </p>
  `;
  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

// ============================================================================
// NIMC IPE CLEARANCE NOTIFICATIONS
// ============================================================================

export async function sendNinIpeCompletedEmail({
  to, name, trackingId, reference
}: { to: string; name: string; trackingId: string; reference: string; }) {
  const subject = `Your IPE Clearance Request is Complete`;
  const previewText = `The In-Processing Error for Tracking ID ${trackingId} has been resolved.`;

  const content = `
    <h2 style="color: #047857; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">IPE Clearance Completed</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      Great news! Your NIMC IPE (In-Processing Error) clearance request has been successfully processed and resolved.
    </p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-family: sans-serif;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Tracking ID:</td>
          <td style="font-weight: 700; color: #0f172a; text-align: right; font-family: monospace;">${trackingId}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Reference:</td>
          <td style="font-weight: 600; color: #0f172a; text-align: right; font-family: monospace;">${reference}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Status:</td>
          <td style="font-weight: 700; color: #047857; text-align: right;">COMPLETED</td>
        </tr>
      </table>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px; font-family: sans-serif;">
      For your security and privacy, your National Identification Number (NIN) is not transmitted in email text. You can securely view and retrieve your resolved NIN and records directly from your dashboard.
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/nin/ipe/history" style="display: inline-block; background-color: #047857; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">View IPE Clearance Result</a>
    </div>
  `;
  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

export async function sendNinIpeFailedEmail({
  to, name, trackingId, reference, failureReason, refundAmount
}: { to: string; name: string; trackingId: string; reference: string; failureReason: string; refundAmount: number; }) {
  const subject = `Update on Your IPE Clearance Request`;
  const previewText = `Your IPE clearance request for Tracking ID ${trackingId} could not be completed.`;

  const content = `
    <h2 style="color: #b45309; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">IPE Clearance Request Failed</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      Your IPE Clearance request for Tracking ID <strong>${trackingId}</strong> (Reference: <code style="font-family: monospace;">${reference}</code>) could not be resolved by the identity service provider.
    </p>
    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px; font-family: sans-serif;">
      <p style="margin: 0 0 8px; font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Reason</p>
      <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6; white-space: pre-wrap;">${failureReason}</p>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px; font-family: sans-serif;">
      ${refundAmount > 0 ? `A refund of <strong>₦${refundAmount.toLocaleString()}</strong> has been credited back to your Lorabiz Wallet.` : 'Please check your dashboard for further details.'}
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/nin/ipe/history" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Go to IPE Clearance History</a>
    </div>
  `;
  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

// ============================================================================
// NIMC NIN VALIDATION NOTIFICATIONS
// ============================================================================

export async function sendNinValidationCompletedEmail({
  to, name, nin, category, transactionRef
}: { to: string; name: string; nin: string; category: string; transactionRef: string; }) {
  const maskedNin = nin.length >= 4 ? `*******${nin.slice(-4)}` : nin;
  const subject = `Your NIN Validation is Complete 🎉`;
  const previewText = `Your NIN (${maskedNin}) validation request for "${category}" has been successfully completed.`;

  const content = `
    <h2 style="color: #047857; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">NIN Validation Successful! 🎉</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      Great news! Your National Identification Number (NIN) validation request has been successfully resolved and processed.
    </p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-family: sans-serif;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Validation Category:</td>
          <td style="font-weight: 700; color: #0f172a; text-align: right;">${category}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">NIN:</td>
          <td style="font-weight: 700; color: #0f172a; text-align: right; font-family: monospace;">${maskedNin}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Reference:</td>
          <td style="font-weight: 600; color: #0f172a; text-align: right; font-family: monospace;">${transactionRef}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Status:</td>
          <td style="font-weight: 700; color: #047857; text-align: right;">COMPLETED</td>
        </tr>
      </table>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px; font-family: sans-serif;">
      Please note: While the validation is completed on our end, central database synchronization on official verification portals may take up to 72 hours to reflect nationwide.
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/nin/validation/history" style="display: inline-block; background-color: #047857; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Go to Validation History</a>
    </div>
  `;
  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

export async function sendNinValidationFailedEmail({
  to, name, nin, category, transactionRef, failureReason, refundAmount
}: { to: string; name: string; nin: string; category: string; transactionRef: string; failureReason: string; refundAmount: number; }) {
  const maskedNin = nin.length >= 4 ? `*******${nin.slice(-4)}` : nin;
  const subject = `Update on Your NIN Validation Request`;
  const previewText = `Your NIN validation request for "${category}" could not be completed.`;

  const content = `
    <h2 style="color: #b45309; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">NIN Validation Request Failed</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      Unfortunately, your NIN validation request for <strong>${category}</strong> (NIN: <code style="font-family: monospace;">${maskedNin}</code>) could not be completed.
    </p>
    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px; font-family: sans-serif;">
      <p style="margin: 0 0 8px; font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Reason</p>
      <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6; white-space: pre-wrap;">${failureReason}</p>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px; font-family: sans-serif;">
      ${refundAmount > 0 ? `A refund of <strong>₦${refundAmount.toLocaleString()}</strong> has been credited back to your Lorabiz Wallet.` : 'Please check your dashboard for full details.'}
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/nin/validation/history" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Go to Validation History</a>
    </div>
  `;
  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}


// ============================================================================
// EMAIL CAMPAIGN & BROADCAST UTILITIES
// ============================================================================

const UNSUBSCRIBE_SECRET = process.env.NEXTAUTH_SECRET || "lorabiz-campaign-unsubscribe-secret-salt";

export function generateUnsubscribeToken(userId: string, email: string): string {
  return crypto
    .createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(`${userId}:${email.toLowerCase().trim()}`)
    .digest("hex");
}

export function verifyUnsubscribeToken(userId: string, email: string, token: string): boolean {
  try {
    const expected = generateUnsubscribeToken(userId, email);
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
  } catch {
    return false;
  }
}

export function getCampaignLayout(content: string, previewText: string = "", unsubscribeUrl?: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LoraBiz Announcement</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; color: #1e293b; -webkit-font-smoothing: antialiased;">
      
      <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; color: #f4f5f7; line-height: 1px;">
        ${previewText}
        &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f4f5f7; margin: 0; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="560" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; width: 100%; max-width: 560px; margin: 0 auto;">
              
              <!-- Header -->
              <tr>
                <td align="center" style="background-color: #0f172a; padding: 28px 32px;">
                  <img src="https://lorabiz.com/logo.png" alt="LoraBiz" width="150" height="auto" style="display: block; border: 0; outline: none; text-decoration: none;" />
                </td>
              </tr>

              <!-- Main Body Content -->
              <tr>
                <td style="padding: 32px; background-color: #ffffff; color: #334155; line-height: 1.65; font-size: 15px; font-family: sans-serif;">
                  ${content}
                </td>
              </tr>

              <!-- Footer Banner -->
              <tr>
                <td align="center" style="padding: 0; background-color: #ffffff;">
                  <img src="https://lorabiz.com/lorabiz-footer.jpg" alt="LoraBiz Services" width="560" height="auto" style="display: block; border: 0; max-width: 100%; height: auto; outline: none;" />
                </td>
              </tr>

              <!-- Footer Details & Unsubscribe -->
              <tr>
                <td align="center" style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #f1f5f9;">
                  <p style="color: #64748b; font-size: 12px; margin: 0 0 10px; line-height: 1.6; font-family: sans-serif;">
                    You are receiving this email as a registered user of LoraBiz.<br/>
                    &copy; ${new Date().getFullYear()} Quadrox Technologies Limited. All rights reserved.
                  </p>
                  ${
                    unsubscribeUrl
                      ? `<p style="margin: 0; font-size: 11px; font-family: sans-serif;">
                          <a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe from marketing emails</a>
                         </p>`
                      : ""
                  }
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function interpolateMergeTags(
  template: string,
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    referralCode?: string | null;
  }
): string {
  const firstName = user.firstName?.trim() || "Valued Client";
  const lastName = user.lastName?.trim() || "";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Valued Client";
  const email = user.email;
  const referralCode = user.referralCode || "";

  return template
    .replace(/\{\{\s*firstName\s*\}\}/gi, firstName)
    .replace(/\{\{\s*first_name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*lastName\s*\}\}/gi, lastName)
    .replace(/\{\{\s*last_name\s*\}\}/gi, lastName)
    .replace(/\{\{\s*fullName\s*\}\}/gi, fullName)
    .replace(/\{\{\s*full_name\s*\}\}/gi, fullName)
    .replace(/\{\{\s*name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*email\s*\}\}/gi, email)
    .replace(/\{\{\s*referralCode\s*\}\}/gi, referralCode)
    .replace(/\{\{\s*referral_code\s*\}\}/gi, referralCode);
}

export async function sendCampaignBroadcastEmail({
  to,
  userId,
  subject,
  previewText,
  rawContent,
  userMetadata,
  baseUrl = "https://lorabiz.com",
}: {
  to: string;
  userId?: string;
  subject: string;
  previewText?: string;
  rawContent: string;
  userMetadata: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    referralCode?: string | null;
  };
  baseUrl?: string;
}) {
  const interpolatedSubject = interpolateMergeTags(subject, userMetadata);
  const interpolatedPreview = previewText ? interpolateMergeTags(previewText, userMetadata) : "";
  const interpolatedContent = interpolateMergeTags(rawContent, userMetadata);
  const sanitizedContent = sanitizeEmailHtml(interpolatedContent);

  let unsubscribeUrl: string | undefined;
  if (userId) {
    const token = generateUnsubscribeToken(userId, to);
    unsubscribeUrl = `${baseUrl.replace(/\/$/, "")}/unsubscribe?uid=${encodeURIComponent(userId)}&email=${encodeURIComponent(to)}&token=${token}`;
  }

  const htmlBody = getCampaignLayout(sanitizedContent, interpolatedPreview, unsubscribeUrl);

  return sendEmail({
    to,
    subject: interpolatedSubject,
    htmlBody,
  });
}

export async function sendTestCampaignEmail({
  to,
  subject,
  previewText,
  rawContent,
  sampleName = "Test Recipient",
  baseUrl = "https://lorabiz.com",
}: {
  to: string;
  subject: string;
  previewText?: string;
  rawContent: string;
  sampleName?: string;
  baseUrl?: string;
}) {
  const testMetadata = {
    firstName: sampleName.split(" ")[0] || "Jane",
    lastName: sampleName.split(" ")[1] || "Doe",
    email: to,
    referralCode: "TEST-REF-999",
  };

  const testSubject = `[TEST PREVIEW] ${interpolateMergeTags(subject, testMetadata)}`;
  const interpolatedPreview = previewText ? interpolateMergeTags(previewText, testMetadata) : "";
  const sanitizedContent = sanitizeEmailHtml(interpolateMergeTags(rawContent, testMetadata));
  const interpolatedContent = `
    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #92400e;">
      <strong>⚠️ Campaign Preview Mode:</strong> This is a test broadcast dispatched to ${to}. Placeholders have been populated with sample merge data.
    </div>
    ${sanitizedContent}
  `;

  const dummyUnsubscribeUrl = `${baseUrl.replace(/\/$/, "")}/unsubscribe?preview=true`;
  const htmlBody = getCampaignLayout(interpolatedContent, interpolatedPreview, dummyUnsubscribeUrl);

  return sendEmail({
    to,
    subject: testSubject,
    htmlBody,
  });
}

// ==========================================
// AUTOMATED LIFECYCLE EMAILS
// ==========================================

export async function sendWelcomeEmail({
  to,
  firstName = "Valued Client",
  baseUrl = "https://lorabiz.com",
}: {
  to: string;
  firstName?: string;
  baseUrl?: string;
}) {
  const cleanName = firstName || "Valued Client";
  const dashboardUrl = `${baseUrl.replace(/\/$/, "")}/dashboard`;
  const subject = "Welcome to LoraBiz – Let's Get Your Business Ready";
  const previewText = "Welcome aboard. Here is how to get started with CAC registration, Tax IDs, and more.";

  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Welcome to LoraBiz</h2>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Hello ${cleanName},</p>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Welcome to <strong>LoraBiz</strong>. We are glad to have you join our platform.</p>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">LoraBiz is designed to make business registration and compliance in Nigeria straightforward, fast, and completely digital. You no longer need to deal with slow manual processes or middle-man markups.</p>
    
    <p style="color: #0f172a; font-weight: 600; margin-top: 24px; font-size: 15px;">Here are the services currently available on your dashboard:</p>
    <ul style="padding-left: 20px; line-height: 1.8; color: #334155; font-size: 14px;">
      <li><strong>CAC Registration:</strong> Register your Business Name or Company (LLC) with full documentation and real-time status tracking.</li>
      <li><strong>SCUML Certificate:</strong> Process your Special Control Unit Against Money Laundering compliance certificate.</li>
      <li><strong>Tax ID (TIN):</strong> Apply for and retrieve your official Tax Identification Number.</li>
      <li><strong>NIMC Services:</strong> Instantly generate and download standard and premium NIN slips.</li>
      <li><strong>Airtime & Utilities:</strong> Quick airtime recharges directly from your wallet.</li>
    </ul>

    <p style="color: #334155; line-height: 1.6; font-size: 14px;">We are actively adding more corporate compliance and business tools to the platform, including Trademark registration, NAFDAC certification, and legal document generation.</p>
    <p style="color: #334155; line-height: 1.6; font-size: 14px;">To get started with any service, simply fund your LoraBiz wallet and submit your application in minutes.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" style="background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Access Your Dashboard</a>
    </div>

    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">If you have any questions or need guidance, our support team is available directly through the support icon on your dashboard.</p>
    <p style="color: #334155; font-size: 14px; margin-top: 24px;">Best regards,<br/><strong>The LoraBiz Team</strong></p>
  `;

  const htmlBody = getBaseLayout(sanitizeEmailHtml(content), previewText);

  return sendEmail({
    to,
    subject,
    htmlBody,
  });
}

export async function sendFirstWalletFundingEmail({
  to,
  firstName = "Valued Client",
  amount,
  balance,
  reference,
  baseUrl = "https://lorabiz.com",
}: {
  to: string;
  firstName?: string;
  amount: number;
  balance: number;
  reference: string;
  baseUrl?: string;
}) {
  const cleanName = firstName || "Valued Client";
  const walletUrl = `${baseUrl.replace(/\/$/, "")}/dashboard/wallet`;
  const formattedAmount = Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 });
  const formattedBalance = Number(balance).toLocaleString("en-NG", { minimumFractionDigits: 2 });
  const subject = "Wallet Funded Successfully – Welcome to LoraBiz Wallet";
  const previewText = `Your wallet has been credited with ₦${formattedAmount}. You are ready to access all LoraBiz services.`;

  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Wallet Funded Successfully</h2>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Hello ${cleanName},</p>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Your LoraBiz wallet has been successfully funded with <strong>₦${formattedAmount}</strong>.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 6px; font-size: 13px; color: #64748b;">Transaction Details:</p>
      <p style="margin: 0; font-size: 14px; color: #0f172a;">Reference: <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${reference}</code></p>
      <p style="margin: 6px 0 0; font-size: 15px; font-weight: 600; color: #059669;">Current Wallet Balance: ₦${formattedBalance}</p>
    </div>

    <p style="color: #334155; line-height: 1.6; font-size: 14px;">Now that your wallet is active, you can use your balance to seamlessly pay for any service on the platform without entering card details each time, including:</p>
    <ul style="padding-left: 20px; line-height: 1.8; color: #334155; font-size: 14px;">
      <li>Business Name & LLC registrations</li>
      <li>SCUML certification filings</li>
      <li>Tax ID (TIN) processing</li>
      <li>NIN slip generation & downloads</li>
      <li>Instant airtime purchases</li>
    </ul>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${walletUrl}" style="background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">View Wallet & Services</a>
    </div>

    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">If you encounter any difficulty with a transaction or have questions about our services, please click the support icon in your dashboard to reach us immediately.</p>
    <p style="color: #334155; font-size: 14px; margin-top: 24px;">Best regards,<br/><strong>The LoraBiz Team</strong></p>
  `;

  const htmlBody = getBaseLayout(sanitizeEmailHtml(content), previewText);

  return sendEmail({
    to,
    subject,
    htmlBody,
  });
}

export async function sendAbandonedCacReminderEmail({
  to,
  firstName = "Valued Client",
  businessName,
  entityType,
  trackingId,
  continueUrl,
}: {
  to: string;
  firstName?: string;
  businessName: string;
  entityType: string;
  trackingId: string;
  continueUrl: string;
}) {
  const cleanName = firstName || "Valued Client";
  const subject = `Continue Your ${entityType} Registration – "${businessName}"`;
  const previewText = `You started your CAC registration for ${businessName}. Pick up right where you left off.`;

  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Continue Your Registration</h2>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Hello ${cleanName},</p>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">We noticed you started your <strong>${entityType}</strong> registration for <strong>"${businessName}"</strong> on LoraBiz, but have not completed the submission yet.</p>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Your progress has been saved. You can easily pick up where you left off, review your details, and submit your filing for processing.</p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 6px; font-size: 13px; color: #64748b;">Application Summary:</p>
      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">${businessName}</p>
      <p style="margin: 6px 0 0; font-size: 13px; color: #475569;">Tracking ID: <strong>${trackingId}</strong> &bull; Type: <strong>${entityType}</strong></p>
    </div>

    <p style="color: #334155; line-height: 1.6; font-size: 14px;">Completing your registration protects your brand name and gives your business the official legal standing needed to open corporate bank accounts, apply for contracts, and build customer trust.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${continueUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Continue Registration</a>
    </div>

    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">If you ran into any issues or need help with proprietor details or document uploads, our support team is available via the dashboard to assist you.</p>
    <p style="color: #334155; font-size: 14px; margin-top: 24px;">Best regards,<br/><strong>The LoraBiz Team</strong></p>
  `;

  const htmlBody = getBaseLayout(sanitizeEmailHtml(content), previewText);

  return sendEmail({
    to,
    subject,
    htmlBody,
  });
}


