// src/lib/email.ts

export async function sendEmail({ 
  to, 
  subject, 
  htmlBody 
}: { 
  to: string; 
  subject: string; 
  htmlBody: string 
}) {
  const url = "https://api.zeptomail.com/v1.1/email";
  const token = process.env.ZEPTOMAIL_API_KEY;
  const sender = process.env.ZEPTOMAIL_SENDER;

  if (!token || !sender) {
    throw new Error("Missing ZeptoMail environment variables. Check your Railway settings.");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": token,
    },
    body: JSON.stringify({
      from: { address: sender, name: "LoraBiz" },
      to: [{ email_address: { address: to } }],
      subject: subject,
      htmlbody: htmlBody,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.error("ZeptoMail Error Payload:", errorData);
    throw new Error("Failed to dispatch email via ZeptoMail");
  }

  return res.json();
}

// Reusable template layout wrapper
function getBaseLayout(content: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; padding: 40px 16px; color: #1e293b;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
        
        <div style="background-color: #0f172a; padding: 28px 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">LoraBiz<span style="color: #ff3f7a;">.</span></h1>
        </div>

        <div style="padding: 32px;">
          ${content}
        </div>

        <div style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.6;">
            You received this email because of an active registration on LoraBiz.<br/>
            &copy; ${new Date().getFullYear()} LoraBiz Corporate Services. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  `;
}

// Standard Client Registration OTP
export async function sendVerificationOTP(to: string, otpCode: string) {
  const subject = "Your LoraBiz Verification Code";
  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px;">Verify your email address</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 24px; font-size: 15px;">
      Use the secure verification code below to complete your registration on LoraBiz. 
      <strong>This code expires in 10 minutes.</strong>
    </p>
    <div style="background: #f8fafc; padding: 24px; text-align: center; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ff3f7a; border-radius: 12px; border: 2px dashed #e2e8f0; margin-bottom: 24px;">
      ${otpCode}
    </div>
    <p style="color: #94a3b8; font-size: 13px; margin: 0;">If you did not request this verification, please safely ignore this email.</p>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content) });
}

// ============================================================================
// NEW: INTERNAL STAFF & MD TWO-FACTOR AUTHENTICATION PASSKEY
// ============================================================================
export async function send2FAPasskeyEmail(to: string, otpCode: string, role?: string) {
  const isExecutive = role === "ADMIN";
  const portalName = isExecutive ? "Managing Director Executive Control Plane" : "Staff Operations & Compliance Desk";
  const accentColor = isExecutive ? "#d97706" : "#0d9488"; // Executive Amber vs Staff Teal

  const subject = `[SECURITY] Your 2FA Verification Passkey - LoraBiz Ops`;
  const content = `
    <div style="display: inline-block; background-color: #0f172a; color: ${accentColor}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 12px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #334155;">
      🔒 Zero-Trust Identity Verification
    </div>
    <h2 style="color: #0f172a; margin: 0 0 12px; font-size: 20px;">Authorize Portal Access</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 24px; font-size: 14px;">
      An authentication attempt was initiated for your clearance tier on the <strong>${portalName}</strong>.<br/>
      Input the 6-digit cryptographic passkey below to verify your session. <strong>Valid for 10 minutes.</strong>
    </p>
    <div style="background: #0f172a; padding: 24px; text-align: center; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: ${accentColor}; border-radius: 12px; border: 1px solid #334155; margin-bottom: 24px; font-family: monospace;">
      ${otpCode}
    </div>
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 12px; color: #991b1b; line-height: 1.5;">
        <strong>Security Warning:</strong> LoraBiz IT personnel will never ask for this passkey. If you did not initiate this sign-in attempt, your administrative credentials may be compromised. Report this event to security operations immediately.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content) });
}

export async function sendApplicationSubmittedEmail({
  to,
  name,
  businessName,
  regId,
}: {
  to: string;
  name: string;
  businessName: string;
  regId: string;
}) {
  const subject = `Application Received: ${businessName}`;
  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px;">We've received your filing! 📄</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px;">
      Hello <strong>${name}</strong>,<br/>
      Your incorporation filing for <strong>${businessName}</strong> has been received and payment confirmed. Our compliance engine is currently processing your documents with the Corporate Affairs Commission (CAC).
    </p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Registration Details</p>
      <p style="margin: 0; font-size: 15px; color: #0f172a;"><strong>Entity Name:</strong> ${businessName}</p>
      <p style="margin: 6px 0 0; font-size: 15px; color: #0f172a;"><strong>Tracking Ref:</strong> ${regId}</p>
    </div>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/cac/register/view/${regId}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px;">Track Application Status</a>
    </div>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content) });
}

export async function sendApplicationQueriedEmail({
  to,
  name,
  businessName,
  queryReason,
  regId,
  entitySlug,
}: {
  to: string;
  name: string;
  businessName: string;
  queryReason: string;
  regId: string;
  entitySlug: "llc" | "businesses";
}) {
  const subject = `Action Required: CAC Query on ${businessName}`;
  const content = `
    <h2 style="color: #b45309; margin: 0 0 16px; font-size: 20px;">Action Required: CAC Query ⚠️</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px;">
      Hello <strong>${name}</strong>,<br/>
      The Corporate Affairs Commission (CAC) examiner has paused your registration for <strong>${businessName}</strong> and requested corrections.
    </p>
    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 28px;">
      <p style="margin: 0 0 8px; font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Examiner Notes</p>
      <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6; white-space: pre-wrap;">"${queryReason}"</p>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px;">
      Please resolve this issue immediately using our interactive wizard. You will not be charged any additional fee to resubmit your corrections.
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/cac/${entitySlug}/${regId}/queries" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px;">Resolve Query Now</a>
    </div>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content) });
}

export async function sendApplicationApprovedEmail({
  to,
  name,
  businessName,
  rcNumber,
}: {
  to: string;
  name: string;
  businessName: string;
  rcNumber: string;
}) {
  const subject = `Incorporation Approved: ${businessName} 🎉`;
  const content = `
    <h2 style="color: #15803d; margin: 0 0 16px; font-size: 20px;">Incorporation Approved! 🎉</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px;">
      Congratulations <strong>${name}</strong>,<br/>
      Your business <strong>${businessName}</strong> has been officially approved and registered by the Corporate Affairs Commission.
    </p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
      <p style="margin: 0 0 6px; font-size: 13px; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Official Registration Number</p>
      <p style="margin: 0; font-size: 28px; font-weight: 800; color: #15803d; letter-spacing: 1px;">${rcNumber}</p>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 28px; font-size: 14px;">
      Your statutory CAC Certificate, Status Report, and official documents are ready for download in your portal.
    </p>
    <div style="text-align: center;">
      <a href="https://lorabiz.com/dashboard/cac/new-incorporation" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px;">Download Official Documents</a>
    </div>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content) });
}

// ============================================================================
// NEW: STANDARD USER LOGIN 2FA
// ============================================================================
export async function sendUserLoginOTP(to: string, otpCode: string) {
  const subject = "Login Verification Code - LoraBiz";
  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px;">Verify your login attempt</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 24px; font-size: 15px;">
      A successful password entry was detected for your account. Please use the secure authorization code below to complete your login and access your dashboard. 
      <strong>This code expires in 10 minutes.</strong>
    </p>
    <div style="background: #f8fafc; padding: 24px; text-align: center; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ff3f7a; border-radius: 12px; border: 2px dashed #e2e8f0; margin-bottom: 24px;">
      ${otpCode}
    </div>
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5;">
        <strong>Security Notice:</strong> If you did not attempt to log in, your password may be compromised. Please reset your password immediately.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, htmlBody: getBaseLayout(content) });
}
