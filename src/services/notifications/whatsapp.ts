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

// 🛡️ BULLETPROOF META FORMATTER
// Meta strictly requires "23480XXXXXXXX" (No +, No leading 0)
function formatMetaPhone(phone: string): string | null {
  if (!phone) return null;
  let clean = phone.replace(/\D/g, ""); // Remove +, spaces, hyphens
  
  if (clean.startsWith("234")) return clean;
  if (clean.startsWith("0")) return "234" + clean.slice(1);
  if (clean.length === 10) return "234" + clean;
  
  return clean; // Fallback
}

export async function sendWhatsAppTemplate({
  recipientPhone,
  templateName,
  variables,
  buttonUrlVariable,
}: SendTemplateParams): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`💬 Attempting WhatsApp dispatch to ${recipientPhone} via template: ${templateName}`);

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      console.error("❌ WhatsApp Dispatch Aborted: Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env");
      return { success: false, error: "Missing API credentials" };
    }

    const formattedPhone = formatMetaPhone(recipientPhone);
    if (!formattedPhone) {
      console.error(`❌ WhatsApp Dispatch Aborted: Phone number format invalid -> [${recipientPhone}]`);
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
        index: "0", 
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
          code: "en_GB", 
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
      console.error(`❌ Meta API Error for ${formattedPhone}:`, JSON.stringify(data, null, 2));
      return { success: false, error: data.error?.message || "Meta API failure" };
    }

    console.log(`✅ WhatsApp sent successfully to ${formattedPhone}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ WhatsApp Dispatch Catch Error:", error.message);
    return { success: false, error: error.message };
  }
}
