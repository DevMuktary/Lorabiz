// src/services/notifications/whatsapp.ts

export async function sendWhatsAppTemplate({
  recipientPhone,
  templateName,
  variables,
  buttonUrlVariable,
  mediaUrl, // <-- NEW: Accepts the PDF URL for Document Headers
}: {
  recipientPhone: string;
  templateName: string;
  variables: string[];
  buttonUrlVariable?: string;
  mediaUrl?: string; 
}) {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.warn("⚠️ WhatsApp variables missing. Skipping WhatsApp dispatch.");
    return { success: false, error: "Missing Env Variables" };
  }

  // Format phone number to E.164 without the plus sign (Meta requirement)
  let cleanPhone = recipientPhone.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "234" + cleanPhone.slice(1);
  }

  // Dynamically build the template components based on what was passed in
  const components: any[] = [];

  // 1. Attach Document Header if mediaUrl is provided
  if (mediaUrl) {
    components.push({
      type: "header",
      parameters: [
        {
          type: "document",
          document: {
            link: mediaUrl,
            filename: "Official_Certificate.pdf" // Default display name in WhatsApp
          }
        }
      ]
    });
  }

  // 2. Attach Body Text Variables
  if (variables && variables.length > 0) {
    components.push({
      type: "body",
      parameters: variables.map((text) => ({
        type: "text",
        text: String(text),
      })),
    });
  }

  // 3. Attach Dynamic Button URL variables (if applicable)
  if (buttonUrlVariable) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0", // Assumes the first button is the dynamic URL button
      parameters: [
        {
          type: "text",
          text: buttonUrlVariable,
        },
      ],
    });
  }

  const payload = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: "en_GB", // Strictly English UK as requested
      },
      components: components.length > 0 ? components : undefined,
    },
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("WhatsApp API Error Response:", data);
      throw new Error(data.error?.message || "Failed to send WhatsApp message");
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("WhatsApp Dispatch Error:", error.message);
    return { success: false, error: error.message };
  }
}
