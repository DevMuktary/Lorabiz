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
      from: { address: sender, name: "Lumebiz" },
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

// Reusable template specifically for OTPs
export async function sendVerificationOTP(to: string, otpCode: string) {
  const subject = "Your Lumebiz Verification Code";
  const htmlBody = `
    <div style="font-family: sans-serif; max-w: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #111; margin: 0;">Verify your email</h2>
      </div>
      <p style="color: #555; line-height: 1.6;">
        Use the secure code below to complete your registration on Lumebiz. 
        <strong>This code expires in 10 minutes.</strong>
      </p>
      <div style="background: #f9f9f9; padding: 20px; text-align: center; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ff3f7a; border-radius: 8px; margin: 24px 0; border: 1px dashed #ff3f7a40;">
        ${otpCode}
      </div>
      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
        If you didn't request this code, please ignore this email. <br/>
        &copy; ${new Date().getFullYear()} Quadrox Technologies Limited
      </p>
    </div>
  `;

  return sendEmail({ to, subject, htmlBody });
}
