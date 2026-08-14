import OpenAI from "openai";

/**
 * Initializes and returns a configured OpenAI / AgentRouter client instance.
 * Credentials and model names are loaded dynamically from environment variables
 * to ensure zero hardcoding.
 */
export function getAIClient(): { client: OpenAI; model: string } {
  const rawApiKey = process.env.OPENAI_API_KEY || "";
  const rawBaseURL = process.env.OPENAI_BASE_URL || "https://agentrouter.org/v1";
  const rawModel = process.env.OPENAI_MODEL || "gpt-5.5";

  // Sanitize and trim environment variables (remove extraneous quotes and whitespace)
  const apiKey = rawApiKey.trim().replace(/^['"]|['"]$/g, "");
  const baseURL = rawBaseURL.trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "");
  const model = rawModel.trim().replace(/^['"]|['"]$/g, "");

  if (!apiKey) {
    console.warn("⚠️ Warning: OPENAI_API_KEY is not set in environment variables. AI features will fallback to CAMA 2020 deterministic templating.");
  }

  const client = new OpenAI({
    apiKey: apiKey || "dummy-key-for-initialization",
    baseURL: baseURL,
    defaultHeaders: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "application/json",
    },
  });

  return { client, model };
}
