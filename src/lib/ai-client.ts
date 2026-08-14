import OpenAI from "openai";

/**
 * Initializes and returns a configured OpenAI / AgentRouter client instance.
 * Credentials and model names are loaded dynamically from environment variables
 * to ensure zero hardcoding.
 */
export function getAIClient(): { client: OpenAI; model: string } {
  const apiKey = process.env.OPENAI_API_KEY || "";
  const baseURL = process.env.OPENAI_BASE_URL || "https://agentrouter.org/v1";
  const model = process.env.OPENAI_MODEL || "gpt-5.5";

  if (!apiKey) {
    console.warn("⚠️ Warning: OPENAI_API_KEY is not set in environment variables. AI features will fallback to rule-based templating.");
  }

  const client = new OpenAI({
    apiKey: apiKey || "dummy-key-for-initialization",
    baseURL: baseURL,
  });

  return { client, model };
}
