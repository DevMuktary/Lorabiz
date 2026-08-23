/**
 * Central Telegram Admin Notification Engine
 * Sends non-blocking, beautiful HTML-formatted alerts to your Telegram Admin chat/channel.
 */

interface TelegramAlertPayload {
  title: string;
  category: "WALLET" | "CAC" | "SERVICES" | "SLIPS" | "AUTH" | "SECURITY" | "UTILITY";
  user?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  details: Record<string, string | number | undefined | null>;
  actionUrl?: string;
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

/**
 * Sends raw HTML formatted message to Telegram Bot API.
 * 100% non-blocking & crash-safe.
 */
export async function sendTelegramMessage(htmlText: string): Promise<boolean> {
  const token = BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = ADMIN_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    // Fail silently in development/staging if not configured
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.warn("[Telegram Alert] Failed to send message:", errBody);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Telegram Alert] Network error dispatching Telegram alert:", error);
    return false;
  }
}

/**
 * Formats and dispatches a structured admin alert
 */
export async function notifyAdminTelegram(payload: TelegramAlertPayload): Promise<void> {
  // Execute asynchronously without blocking the main event loop
  setImmediate(async () => {
    try {
      const categoryIcon = {
        WALLET: "💰",
        CAC: "🏢",
        SERVICES: "⚡",
        SLIPS: "📄",
        UTILITY: "📱",
        AUTH: "👤",
        SECURITY: "🛡️",
      }[payload.category] || "🔔";

      const lines: string[] = [
        `${categoryIcon} <b>${escapeHtml(payload.title)}</b>`,
        `━━━━━━━━━━━━━━━━━━`,
      ];

      if (payload.user) {
        const userName = payload.user.name || "Customer";
        const userEmail = payload.user.email ? ` (<code>${escapeHtml(payload.user.email)}</code>)` : "";
        lines.push(`👤 <b>User:</b> ${escapeHtml(userName)}${userEmail}`);
      }

      for (const [key, val] of Object.entries(payload.details)) {
        if (val !== undefined && val !== null && val !== "") {
          lines.push(`• <b>${escapeHtml(key)}:</b> <code>${escapeHtml(String(val))}</code>`);
        }
      }

      const now = new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" });
      lines.push(`━━━━━━━━━━━━━━━━━━`);
      lines.push(`🕒 <i>${now} (WAT)</i>`);

      const message = lines.join("\n");
      await sendTelegramMessage(message);
    } catch (err) {
      console.warn("[Telegram Alert] Error in notifyAdminTelegram:", err);
    }
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
