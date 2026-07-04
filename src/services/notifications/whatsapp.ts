import { formatWhatsAppPhone } from "@/utils/phone";

// Meta WhatsApp Cloud API Configuration
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const GRAPH_API_VERSION = "v18.0";

interface SendTemplateParams {
  recipientPhone: string;
  templateName: "cac_application_submitted" | "cac_application_queried" | "cac_application_approved";
  variables: string[]; // Order matches {{1}}, {{2}}, {{3}} in Meta template
  buttonUrlVariable?: string; // Passes dynamic ID slug to the CTA button URL
}

export async function sendWhatsAppTemplate({
  recipientPhone,
  templateName,
  variables,
  buttonUrlVariable,
}: SendTemplateParams): Promise<{ success: boolean; error?: string }> {
  try {
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      console.warn("⚠️ WhatsApp API environment variables missing. Skipping notification.");
      return { success: false, error: "Missing API credentials" };
    }

    const formattedPhone = formatWhatsAppPhone(recipientPhone);
    if (!formattedPhone) {
      return { success: false, error: "Invalid phone number provided" };
    }

    // Build standard body component parameters
    const bodyParameters = variables.map((val) => ({
      type: "text",
      text: val || "N/A",
    }));

    const components: any[] = [
      {
        type: "body",
        parameters: bodyParameters,
      },
    ];

    // If template has a dynamic URL button, append button parameter
    if (buttonUrlVariable) {
      components.push({
        type: "button",
        sub_type: "url",
        index: "0", // First button
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
      to: formattedPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "en_GB", // Matches your English (UK) template submission
        },
        components,
      },
    };

    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Meta API Error:", JSON.stringify(data, null, 2));
      return { success: false, error: data.error?.message || "Meta API failure" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("❌ WhatsApp Dispatch Error:", error.message);
    return { success: false, error: error.message };
  }
}
