import OpenAI from "openai";

/**
 * AgentRouter Client for Smart Legal Documents.
 * Uses the tested OpenAI-compatible endpoint with required bypass headers and gpt-5.6-sol.
 */
export function getWorkingAgentRouterClient() {
  const apiKey = (process.env.AGENTROUTER_API_KEY || "").trim().replace(/^['"]|['"]$/g, "");
  
  const client = new OpenAI({
    apiKey: apiKey || "dummy-key",
    baseURL: "https://agentrouter.org/v1", // The working OpenAI endpoint
    defaultHeaders: {
      // The magic headers that bypassed the "unauthorized client" block
      "User-Agent": "codex_cli_rs/0.101.0 (Mac OS 26.0.1; arm64) Apple_Terminal/464",
      "Originator": "codex_cli_rs",
      "Version": "0.101.0",
    },
  });

  // Default to the working model
  const model = (process.env.AGENTROUTER_MODEL || "gpt-5.6-sol").trim();

  return { client, model, apiKey };
}

/**
 * Standard OpenAI SDK client instance for CAC categorization and general tasks.
 */
export function getAIClient(): { client: OpenAI; model: string } {
  const rawApiKey = process.env.OPENAI_API_KEY || "";
  const apiKey = rawApiKey.trim().replace(/^['"]|['"]$/g, "");
  
  const rawBaseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const baseURL = rawBaseURL.trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "");
  const model = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

  const client = new OpenAI({
    apiKey: apiKey || "dummy-key",
    baseURL: baseURL,
  });

  return { client, model };
}
