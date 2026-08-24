// src/lib/email.ts
import { createHmac, timingSafeEqual } from "crypto";
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

export async function sendPasswordResetLinkEmail({
  to,
  name,
  resetUrl,
  expiresInMinutes = 60,
}: {
  to: string;
  name?: string | null;
  resetUrl: string;
  expiresInMinutes?: number;
}) {
  const subject = "Reset Your LoraBiz Password";
  const previewText = "Use this link to reset your account password.";

  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px; font-weight: 700; font-family: sans-serif;">
      Reset your password
    </h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello ${name ? `<strong>${name}</strong>` : "there"},<br/>
      We received a request to reset the password for your LoraBiz account. Click the button below to set a new password:
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" style="background-color: #ff3f7a; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(255, 63, 122, 0.25);">
        Reset My Password &rarr;
      </a>
    </div>

    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 20px; font-family: sans-serif;">
      If the button above does not work, copy and paste this link into your browser:<br/>
      <a href="${resetUrl}" style="color: #0284c7; word-break: break-all; font-size: 12px;">${resetUrl}</a>
    </p>

    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 12px;">
      <p style="margin: 0; font-size: 12.5px; color: #92400e; line-height: 1.5; font-family: sans-serif;">
        <strong>Important:</strong> This password reset link is valid for <strong>${expiresInMinutes} minutes</strong> and can only be used once.<br/>
        If you did not make this request, you can safely ignore this email — your password will remain unchanged.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

export async function sendPasswordResetSuccessEmail({
  to,
  name,
}: {
  to: string;
  name?: string | null;
}) {
  const subject = "Security Alert: Your Password Was Changed";
  const previewText = "The password for your LoraBiz account was successfully updated.";

  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px; font-weight: 700; font-family: sans-serif;">
      Password changed successfully
    </h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello ${name ? `<strong>${name}</strong>` : "there"},<br/>
      This is a confirmation that the password for your LoraBiz account (<strong>${to}</strong>) has been successfully changed.
    </p>

    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 13px; color: #065f46; line-height: 1.5; font-family: sans-serif;">
        ✅ <strong>Security Status:</strong> You can now log in using your new password.
      </p>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="https://lorabiz.com/auth/login" style="background-color: #0f172a; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none; display: inline-block;">
        Log In to Dashboard &rarr;
      </a>
    </div>

    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 12.5px; color: #991b1b; line-height: 1.5; font-family: sans-serif;">
        <strong>Didn't make this change?</strong> If you did not change your password, someone else may have accessed your account. Please contact LoraBiz Support immediately to lock your account.
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
// NIMC NIN PERSONALIZATION NOTIFICATIONS
// ============================================================================

export async function sendNinPersonalizationCompletedEmail({
  to, name, trackingId, reference
}: { to: string; name: string; trackingId: string; reference: string; }) {
  const subject = `Your NIN Personalization is Complete 🎉`;
  const previewText = `Your enrollment Tracking ID ${trackingId} has been successfully personalized and your NIN is ready.`;

  const content = `
    <h2 style="color: #047857; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">NIN Personalization Complete! 🎉</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      Great news! Your NIN Personalization request for Tracking ID <strong>${trackingId}</strong> has been successfully processed and completed.
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
      Your full personal identity record and official printable NIN slip are now available on your dashboard.
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/nin/personalization/history" style="display: inline-block; background-color: #047857; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">View Slip & Record</a>
    </div>
  `;
  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

export async function sendNinPersonalizationFailedEmail({
  to, name, trackingId, reference, failureReason, refundAmount
}: { to: string; name: string; trackingId: string; reference: string; failureReason: string; refundAmount: number; }) {
  const subject = `Update on Your NIN Personalization Request`;
  const previewText = `Your NIN personalization request for Tracking ID ${trackingId} could not be completed.`;

  const content = `
    <h2 style="color: #b45309; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">NIN Personalization Request Failed</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      Unfortunately, your NIN personalization request for Tracking ID <strong>${trackingId}</strong> (Reference: <code style="font-family: monospace;">${reference}</code>) could not be completed.
    </p>
    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px; font-family: sans-serif;">
      <p style="margin: 0 0 8px; font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Reason</p>
      <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6; white-space: pre-wrap;">${failureReason}</p>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px; font-family: sans-serif;">
      ${refundAmount > 0 ? `A full refund of <strong>₦${refundAmount.toLocaleString()}</strong> has been credited back to your Lorabiz Wallet.` : 'Please check your dashboard for full details.'}
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/nin/personalization/history" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Go to Personalization History</a>
    </div>
  `;
  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

// ============================================================================
// NIN MODIFICATION EMAILS
// ============================================================================

const MODIFICATION_TYPE_TITLES: Record<string, string> = {
  CHANGE_OF_NAME: "Change of Name",
  CHANGE_OF_PHONE: "Change of Phone Number",
  CHANGE_OF_ADDRESS: "Change of Address",
};

export async function sendNinModificationSubmittedEmail({
  to, name, trackingId, type, amount
}: { to: string; name: string; trackingId: string; type: string; amount: number; }) {
  const typeLabel = MODIFICATION_TYPE_TITLES[type] || "NIN Modification";
  const subject = `NIN Modification Request Received - ${trackingId}`;
  const previewText = `We have received your NIN ${typeLabel} request (${trackingId}).`;

  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">NIN Modification Request Received</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      We have received your request for <strong>NIN ${typeLabel}</strong>. Our processing team is reviewing your submission.
    </p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-family: sans-serif;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Tracking ID:</td>
          <td style="font-weight: 700; color: #0f172a; text-align: right; font-family: monospace;">${trackingId}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Service Type:</td>
          <td style="font-weight: 600; color: #0f172a; text-align: right;">${typeLabel}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Amount Paid:</td>
          <td style="font-weight: 600; color: #0f172a; text-align: right;">₦${amount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Initial Status:</td>
          <td style="font-weight: 700; color: #d97706; text-align: right;">PENDING</td>
        </tr>
      </table>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px; font-family: sans-serif;">
      You will receive real-time email notifications as your request moves to processing and completion.
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/nin/modification" style="display: inline-block; background-color: #047857; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Track Request on Dashboard</a>
    </div>
  `;
  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

export async function sendNinModificationProcessingEmail({
  to, name, trackingId, type
}: { to: string; name: string; trackingId: string; type: string; }) {
  const typeLabel = MODIFICATION_TYPE_TITLES[type] || "NIN Modification";
  const subject = `Your NIN Modification Request is in Processing - ${trackingId}`;
  const previewText = `Your NIN ${typeLabel} request (${trackingId}) is now being processed.`;

  const content = `
    <h2 style="color: #0369a1; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">NIN Modification In Processing</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      Great news! Your request for <strong>NIN ${typeLabel}</strong> (Tracking ID: <strong>${trackingId}</strong>) has been picked up and is actively being processed with the identity registry.
    </p>
    <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-family: sans-serif;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="color: #0369a1; padding: 6px 0;">Tracking ID:</td>
          <td style="font-weight: 700; color: #0f172a; text-align: right; font-family: monospace;">${trackingId}</td>
        </tr>
        <tr>
          <td style="color: #0369a1; padding: 6px 0;">Modification:</td>
          <td style="font-weight: 600; color: #0f172a; text-align: right;">${typeLabel}</td>
        </tr>
        <tr>
          <td style="color: #0369a1; padding: 6px 0;">Status:</td>
          <td style="font-weight: 700; color: #0284c7; text-align: right;">PROCESSING</td>
        </tr>
      </table>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px; font-family: sans-serif;">
      You will receive another update once the modification is concluded and your official transaction slip is ready.
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/nin/modification" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">View Dashboard</a>
    </div>
  `;
  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

export async function sendNinModificationCompletedEmail({
  to, name, trackingId, type, slipUrl
}: { to: string; name: string; trackingId: string; type: string; slipUrl?: string; }) {
  const typeLabel = MODIFICATION_TYPE_TITLES[type] || "NIN Modification";
  const subject = `NIN Modification Completed - ${trackingId}`;
  const previewText = `Your NIN ${typeLabel} is complete. Download your official modification slip.`;

  const content = `
    <h2 style="color: #047857; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">NIN Modification Successfully Completed 🎉</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      Your request for <strong>NIN ${typeLabel}</strong> (Tracking ID: <strong>${trackingId}</strong>) has been successfully concluded and finalized!
    </p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-family: sans-serif;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Tracking ID:</td>
          <td style="font-weight: 700; color: #0f172a; text-align: right; font-family: monospace;">${trackingId}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Service Type:</td>
          <td style="font-weight: 600; color: #0f172a; text-align: right;">${typeLabel}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Status:</td>
          <td style="font-weight: 700; color: #047857; text-align: right;">COMPLETED</td>
        </tr>
      </table>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px; font-family: sans-serif;">
      Your official modification slip has been generated. You can download and save it directly from your dashboard.
    </p>
    <div style="text-align: center; margin-bottom: 20px;">
      ${slipUrl ? `<a href="${slipUrl}" target="_blank" style="display: inline-block; background-color: #047857; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif; margin-right: 10px;">Download Modification Slip</a>` : ''}
      <a href="https://lorabiz.com/dashboard/nin/modification" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">View on Dashboard</a>
    </div>
    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
      Please note: Third-party systems (such as commercial banks or telecom providers) may require additional synchronization cycles to reflect the new update across their network.
    </p>
  `;
  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

export async function sendNinModificationRejectedEmail({
  to, name, trackingId, type, reason, refundAmount
}: { to: string; name: string; trackingId: string; type: string; reason: string; refundAmount?: number; }) {
  const typeLabel = MODIFICATION_TYPE_TITLES[type] || "NIN Modification";
  const subject = `Update on Your NIN Modification Request - ${trackingId}`;
  const previewText = `Your NIN ${typeLabel} request (${trackingId}) could not be completed.`;

  const content = `
    <h2 style="color: #b45309; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">NIN Modification Request Update</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px; font-family: sans-serif;">
      Hello <strong>${name}</strong>,<br/>
      Your request for <strong>NIN ${typeLabel}</strong> (Tracking ID: <strong>${trackingId}</strong>) could not be completed due to the following reason:
    </p>
    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px; font-family: sans-serif;">
      <p style="margin: 0 0 8px; font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Reason for Rejection</p>
      <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6; white-space: pre-wrap;">${reason}</p>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px; font-family: sans-serif;">
      ${(refundAmount && refundAmount > 0) ? `A refund of <strong>₦${refundAmount.toLocaleString()}</strong> has been credited back to your LoraBiz Wallet.` : 'Please review the reason above and reach out to support if you need further clarification.'}
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/nin/modification" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Go to Modification Dashboard</a>
    </div>
  `;
  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}



// ============================================================================
// EMAIL CAMPAIGN & BROADCAST UTILITIES
// ============================================================================

const UNSUBSCRIBE_SECRET = process.env.NEXTAUTH_SECRET || "lorabiz-campaign-unsubscribe-secret-salt";

export function generateUnsubscribeToken(userId: string, email: string): string {
  return createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(`${userId}:${email.toLowerCase().trim()}`)
    .digest("hex");
}

export function verifyUnsubscribeToken(userId: string, email: string, token: string): boolean {
  try {
    const expected = generateUnsubscribeToken(userId, email);
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
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
                  ${unsubscribeUrl
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
      <li><strong>Airtime &amp; Utilities:</strong> Quick airtime and data recharges directly from your wallet.</li>
    </ul>

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

export async function sendWalletFundedEmail({
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
  const subject = `Wallet Credit Alert – ₦${formattedAmount}`;
  const previewText = `Your LoraBiz wallet has been credited with ₦${formattedAmount}. Current balance: ₦${formattedBalance}.`;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background-color: #ecfdf5; color: #059669; font-size: 24px; margin-bottom: 8px;">✓</div>
      <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 800;">Wallet Credited Successfully</h2>
      <p style="color: #059669; font-size: 28px; font-weight: 800; margin: 8px 0 0 0;">+₦${formattedAmount}</p>
    </div>

    <p style="color: #334155; line-height: 1.6; font-size: 14px;">Hello <strong>${cleanName}</strong>,</p>
    <p style="color: #334155; line-height: 1.6; font-size: 14px;">We have received your payment. Your LoraBiz wallet has been credited and is available for instant use.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Amount Credited:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">₦${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Transaction Reference:</td>
          <td style="padding: 6px 0; color: #0f172a; font-family: monospace; text-align: right;">${reference}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Channel:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">Online Gateway (KoraPay)</td>
        </tr>
        <tr style="border-top: 1px solid #e2e8f0;">
          <td style="padding: 10px 0 0; color: #0f172a; font-weight: 700;">New Wallet Balance:</td>
          <td style="padding: 10px 0 0; color: #059669; font-weight: 800; font-size: 15px; text-align: right;">₦${formattedBalance}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${walletUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">Go to Wallet &amp; Dashboard</a>
    </div>

    <p style="color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px;">This is an automated transaction receipt. If you did not authorize this transaction, please contact support immediately.</p>
    <p style="color: #334155; font-size: 13px; margin-top: 16px;">Best regards,<br/><strong>The LoraBiz Team</strong></p>
  `;

  const htmlBody = getBaseLayout(sanitizeEmailHtml(content), previewText);

  return sendEmail({
    to,
    subject,
    htmlBody,
  });
}

export const sendFirstWalletFundingEmail = sendWalletFundedEmail;

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

// ============================================================================
// BVN RETRIEVAL NOTIFICATIONS
// ============================================================================

export async function sendBvnRetrievalSubmittedEmail({
  to,
  firstName = "Valued Client",
  trackingId,
  fullName,
  phone,
  amountPaid,
}: {
  to: string;
  firstName?: string;
  trackingId: string;
  fullName: string;
  phone: string;
  amountPaid: string | number;
}) {
  const cleanName = firstName || "Valued Client";
  const subject = `BVN Retrieval Request Received – [${trackingId}]`;
  const previewText = `Your BVN Retrieval request (${trackingId}) has been queued. Expected turnaround: 1 to 24 hours.`;

  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">BVN Retrieval Request Submitted</h2>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Hello ${cleanName},</p>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">We have received your Bank Verification Number (BVN) Retrieval request on LoraBiz and it has been queued for processing.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; color: #334155;">
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Tracking ID:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right;">${trackingId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Full Name on BVN:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">${fullName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Linked Phone Number:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">${phone}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Amount Paid:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #059669; text-align: right;">&#8358;${Number(amountPaid).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Processing Timeline:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">1 – 24 Working Hours</td>
        </tr>
      </table>
    </div>

    <p style="color: #334155; line-height: 1.6; font-size: 14px;">Once your retrieval record is matched and verified, you will receive an instant notification email containing your 11-digit BVN and your dashboard history will be updated immediately.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://lorabiz.com/dashboard/bvn/retrieval/history" style="background-color: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">Track Request Status</a>
    </div>

    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">If you have any questions or need further clarification, our support team is always available to help.</p>
    <p style="color: #334155; font-size: 14px; margin-top: 24px;">Best regards,<br/><strong>The LoraBiz Team</strong></p>
  `;

  const htmlBody = getBaseLayout(sanitizeEmailHtml(content), previewText);
  return sendEmail({ to, subject, htmlBody });
}

export async function sendBvnRetrievalCompletedEmail({
  to,
  firstName = "Valued Client",
  trackingId,
  fullName,
  retrievedBvn,
  slipUrl,
}: {
  to: string;
  firstName?: string;
  trackingId: string;
  fullName: string;
  retrievedBvn: string;
  slipUrl?: string | null;
}) {
  const cleanName = firstName || "Valued Client";
  const subject = `BVN Retrieval Completed – [${trackingId}]`;
  const previewText = `Your BVN has been successfully retrieved: ${retrievedBvn}`;

  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">BVN Successfully Retrieved</h2>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Hello ${cleanName},</p>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Good news! Your Bank Verification Number (BVN) retrieval request <strong>${trackingId}</strong> has been successfully processed.</p>
    
    <div style="background-color: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #065f46; text-transform: uppercase; letter-spacing: 1px;">Your 11-Digit BVN</p>
      <p style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: 4px; color: #047857; font-family: monospace;">${retrievedBvn}</p>
      <p style="margin: 10px 0 0; font-size: 13px; color: #065f46;">Account Name: <strong>${fullName}</strong></p>
    </div>

    ${slipUrl ? `
      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="${slipUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; margin-right: 8px;">Download Slip</a>
        <a href="https://lorabiz.com/dashboard/bvn/retrieval/history" style="background-color: #f1f5f9; color: #334155; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; border: 1px solid #cbd5e1;">View in Dashboard</a>
      </div>
    ` : `
      <div style="text-align: center; margin: 28px 0;">
        <a href="https://lorabiz.com/dashboard/bvn/retrieval/history" style="background-color: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">View in Dashboard</a>
      </div>
    `}

    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Please keep this BVN safe and confidential. Do not share your BVN or sensitive banking details with unauthorized parties.</p>
    <p style="color: #334155; font-size: 14px; margin-top: 24px;">Best regards,<br/><strong>The LoraBiz Team</strong></p>
  `;

  const htmlBody = getBaseLayout(sanitizeEmailHtml(content), previewText);
  return sendEmail({ to, subject, htmlBody });
}

export async function sendBvnRetrievalFailedEmail({
  to,
  firstName = "Valued Client",
  trackingId,
  fullName,
  reason,
  refundAmount,
  isRefunded = false,
}: {
  to: string;
  firstName?: string;
  trackingId: string;
  fullName: string;
  reason: string;
  refundAmount?: string | number | null;
  isRefunded?: boolean;
}) {
  const cleanName = firstName || "Valued Client";
  const subject = `Update on BVN Retrieval Request – [${trackingId}]`;
  const previewText = `Your BVN Retrieval request could not be completed. Reason: ${reason}`;

  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">BVN Retrieval Unsuccessful</h2>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Hello ${cleanName},</p>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">We regret to inform you that your BVN Retrieval request <strong>${trackingId}</strong> for <strong>${fullName}</strong> could not be completed.</p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #991b1b; text-transform: uppercase;">Reason for Failure</p>
      <p style="margin: 0; font-size: 14px; color: #7f1d1d; line-height: 1.6;">${reason}</p>
    </div>

    ${isRefunded && refundAmount ? `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 600;">
          &#10004; A refund of <strong>&#8358;${Number(refundAmount).toLocaleString()}</strong> has been credited back to your LoraBiz wallet.
        </p>
      </div>
    ` : ''}

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://lorabiz.com/dashboard/bvn/retrieval" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Try Again</a>
    </div>

    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">If you believe this was in error or need assistance reviewing your submitted details, please reach out to our support team.</p>
    <p style="color: #334155; font-size: 14px; margin-top: 24px;">Best regards,<br/><strong>The LoraBiz Team</strong></p>
  `;

  const htmlBody = getBaseLayout(sanitizeEmailHtml(content), previewText);
  return sendEmail({ to, subject, htmlBody });
}

// ============================================================================
// BVN MODIFICATION NOTIFICATIONS
// ============================================================================

export async function sendBvnModificationSubmittedEmail({
  to,
  firstName = "Valued Client",
  trackingId,
  modificationType,
  enrollingBank,
  bvn,
  amountPaid,
}: {
  to: string;
  firstName?: string;
  trackingId: string;
  modificationType: string;
  enrollingBank: string;
  bvn: string;
  amountPaid: string | number;
}) {
  const cleanName = firstName || "Valued Client";
  const subject = `BVN Modification Request Queued – [${trackingId}]`;
  const previewText = `Your BVN Modification request (${trackingId}) has been received and queued for compliance processing.`;

  const maskedBvn = bvn ? `${bvn.slice(0, 3)}****${bvn.slice(-4)}` : "BVN";

  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">BVN Modification Request Received</h2>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Hello ${cleanName},</p>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Your Bank Verification Number (BVN) modification request has been successfully submitted and registered in our queue.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; color: #334155;">
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Tracking ID:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right;">${trackingId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Enrolling Bank:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">${enrollingBank}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Modification Type:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">${modificationType}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">BVN Number:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right; font-family: monospace;">${maskedBvn}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Amount Paid:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #059669; text-align: right;">&#8358;${Number(amountPaid).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Estimated Turnaround:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">72 Hours – 7 Days</td>
        </tr>
      </table>
    </div>

    <p style="color: #334155; line-height: 1.6; font-size: 14px;">Our verification desk will process your request on NIBSS. You will receive real-time email updates as your application progresses.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://lorabiz.com/dashboard/bvn/modification/history" style="background-color: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">Track Modification Status</a>
    </div>

    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Best regards,<br/><strong>The LoraBiz Team</strong></p>
  `;

  const htmlBody = getBaseLayout(sanitizeEmailHtml(content), previewText);
  return sendEmail({ to, subject, htmlBody });
}

export async function sendBvnModificationProcessingEmail({
  to,
  firstName = "Valued Client",
  trackingId,
  modificationType,
  bvn,
  adminNotes,
}: {
  to: string;
  firstName?: string;
  trackingId: string;
  modificationType: string;
  bvn: string;
  adminNotes?: string | null;
}) {
  const cleanName = firstName || "Valued Client";
  const subject = `BVN Modification In Progress – [${trackingId}]`;
  const previewText = `Your BVN modification (${trackingId}) is actively processing on the NIBSS portal.`;

  const maskedBvn = bvn ? `${bvn.slice(0, 3)}****${bvn.slice(-4)}` : "BVN";

  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">BVN Modification In Progress</h2>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Hello ${cleanName},</p>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Your BVN Modification request <strong>${trackingId}</strong> for <strong>${maskedBvn}</strong> is now actively processing on the NIBSS portal.</p>
    
    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #0369a1; text-transform: uppercase;">Current Status</p>
      <p style="margin: 0; font-size: 14px; color: #0c4a6e; line-height: 1.6;">
        Processing with NIBSS Gateway. Details are being synchronized with your primary banking profile.
      </p>
      ${adminNotes ? `
        <p style="margin: 12px 0 0; font-size: 13px; color: #0284c7;">
          <strong>Admin Note:</strong> ${adminNotes}
        </p>
      ` : ''}
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://lorabiz.com/dashboard/bvn/modification/history" style="background-color: #0284c7; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">View Progress in Dashboard</a>
    </div>

    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">You will be notified immediately once the modification is concluded and your updated slip is ready.</p>
    <p style="color: #334155; font-size: 14px; margin-top: 24px;">Best regards,<br/><strong>The LoraBiz Team</strong></p>
  `;

  const htmlBody = getBaseLayout(sanitizeEmailHtml(content), previewText);
  return sendEmail({ to, subject, htmlBody });
}

export async function sendBvnModificationCompletedEmail({
  to,
  firstName = "Valued Client",
  trackingId,
  modificationType,
  bvn,
  slipUrl,
  adminNotes,
}: {
  to: string;
  firstName?: string;
  trackingId: string;
  modificationType: string;
  bvn: string;
  slipUrl?: string | null;
  adminNotes?: string | null;
}) {
  const cleanName = firstName || "Valued Client";
  const subject = `BVN Modification Completed! 🎉 – [${trackingId}]`;
  const previewText = `Your BVN modification request (${trackingId}) has been successfully updated on NIBSS.`;

  const maskedBvn = bvn ? `${bvn.slice(0, 3)}****${bvn.slice(-4)}` : "BVN";

  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">BVN Modification Concluded</h2>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Hello ${cleanName},</p>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Great news! Your Bank Verification Number (BVN) modification request <strong>${trackingId}</strong> for <strong>${maskedBvn}</strong> has been successfully processed and updated on NIBSS.</p>
    
    <div style="background-color: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #065f46; text-transform: uppercase; letter-spacing: 1px;">Service Completed</p>
      <p style="margin: 0; font-size: 24px; font-weight: 900; color: #047857;">${modificationType}</p>
      <p style="margin: 10px 0 0; font-size: 13px; color: #065f46;">Target BVN: <strong>${maskedBvn}</strong></p>
    </div>

    ${slipUrl ? `
      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="${slipUrl}" style="background-color: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; margin-right: 8px;">Download Updated BVN Slip</a>
        <a href="https://lorabiz.com/dashboard/bvn/modification/history" style="background-color: #f1f5f9; color: #334155; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; border: 1px solid #cbd5e1;">View in Dashboard</a>
      </div>
    ` : `
      <div style="text-align: center; margin: 28px 0;">
        <a href="https://lorabiz.com/dashboard/bvn/modification/history" style="background-color: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">View in Dashboard</a>
      </div>
    `}

    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Your records are now active across financial institutions. If you need any further modifications or services, we are always here to assist.</p>
    <p style="color: #334155; font-size: 14px; margin-top: 24px;">Best regards,<br/><strong>The LoraBiz Team</strong></p>
  `;

  const htmlBody = getBaseLayout(sanitizeEmailHtml(content), previewText);
  return sendEmail({ to, subject, htmlBody });
}

export async function sendBvnModificationRejectedEmail({
  to,
  firstName = "Valued Client",
  trackingId,
  modificationType,
  bvn,
  reason,
  refundAmount,
  isRefunded = false,
}: {
  to: string;
  firstName?: string;
  trackingId: string;
  modificationType: string;
  bvn: string;
  reason: string;
  refundAmount?: string | number | null;
  isRefunded?: boolean;
}) {
  const cleanName = firstName || "Valued Client";
  const subject = `Update on BVN Modification Request – [${trackingId}]`;
  const previewText = `Your BVN modification request could not be completed. Reason: ${reason}`;

  const maskedBvn = bvn ? `${bvn.slice(0, 3)}****${bvn.slice(-4)}` : "BVN";

  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">BVN Modification Request Declined</h2>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">Hello ${cleanName},</p>
    <p style="color: #334155; line-height: 1.6; font-size: 15px;">We regret to inform you that your BVN Modification request <strong>${trackingId}</strong> for <strong>${maskedBvn}</strong> could not be processed on NIBSS.</p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #991b1b; text-transform: uppercase;">Reason for Decline</p>
      <p style="margin: 0; font-size: 14px; color: #7f1d1d; line-height: 1.6;">${reason}</p>
    </div>

    ${isRefunded && refundAmount ? `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 600;">
          &#10004; A refund of <strong>&#8358;${Number(refundAmount).toLocaleString()}</strong> has been credited back to your LoraBiz wallet.
        </p>
      </div>
    ` : ''}

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://lorabiz.com/dashboard/bvn/modification" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Start New Modification</a>
    </div>

    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Please ensure that your details are strictly accurate and reflecting on your NIN/VNIN before submitting. If you have questions, our support team is available to assist.</p>
    <p style="color: #334155; font-size: 14px; margin-top: 24px;">Best regards,<br/><strong>The LoraBiz Team</strong></p>
  `;

  const htmlBody = getBaseLayout(sanitizeEmailHtml(content), previewText);
  return sendEmail({ to, subject, htmlBody });
}
