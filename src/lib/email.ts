// src/lib/email.ts

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
      We will notify you immediately once the certificate is generated and ready for download.
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
      Your Special Control Unit Against Money Laundering (SCUML) certificate for <strong>${companyName}</strong> has been officially generated.
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
  to, name, taxIdNumber, requestType
}: { to: string; name: string; taxIdNumber: string; requestType: string; }) {
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
      You can easily copy this digit directly from your <strong>Tax ID History</strong> page on the Lorabiz dashboard.
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/tax-id/history" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; font-family: sans-serif;">Go to Tax ID History</a>
    </div>
  `;
  return sendEmail({ to, subject, htmlBody: getBaseLayout(content, previewText) });
}

export async function sendTaxIdFailedEmail({
  to, name, failureReason, refundAmount, requestType
}: { to: string; name: string; failureReason: string; refundAmount: number; requestType: string; }) {
  const subject = `Update on Tax ID Request`;
  const previewText = `Your ${requestType} Tax ID request was rejected.`;

  const content = `
    <h2 style="color: #b45309; margin: 0 0 16px; font-size: 20px; font-family: sans-serif;">Application Failed ⚠️</h2>
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
