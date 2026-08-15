import OpenAI from "openai";

/**
 * Configuration structure for AI requests
 */
export interface AIProviderConfig {
  provider: "agentrouter-anthropic" | "agentrouter-openai" | "openai-direct";
  apiKey: string;
  baseURL: string;
  model: string;
}

/**
 * Resolves the primary and fallback AI configurations based on environment variables.
 * Priority:
 * 1. Dedicated Document Key / AgentRouter (ANTHROPIC_AUTH_TOKEN, DOC_ANTHROPIC_AUTH_TOKEN, AGENTROUTER_API_KEY, ANTHROPIC_API_KEY, DOC_OPEN_AI_KEY)
 * 2. General OPENAI_API_KEY (used as fallback if available)
 */
export function getDocumentAIProviders(): AIProviderConfig[] {
  const providers: AIProviderConfig[] = [];

  // Dedicated AgentRouter / Anthropic Keys
  const anthropicKey = (
    process.env.ANTHROPIC_AUTH_TOKEN ||
    process.env.DOC_ANTHROPIC_AUTH_TOKEN ||
    process.env.AGENTROUTER_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.DOC_OPEN_AI_KEY ||
    ""
  ).trim().replace(/^['"]|['"]$/g, "");

  const generalOpenAIKey = (
    process.env.OPENAI_API_KEY ||
    ""
  ).trim().replace(/^['"]|['"]$/g, "");

  // 1. Primary Priority: Dedicated AgentRouter Claude (Anthropic Messages API)
  if (anthropicKey) {
    const rawBaseURL = process.env.ANTHROPIC_BASE_URL || "https://agentrouter.org";
    const cleanBaseURL = rawBaseURL.trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "").replace(/\/v1$/, "");
    const anthropicModel = (process.env.ANTHROPIC_MODEL || "claude-opus-4-6").trim().replace(/^['"]|['"]$/g, "");

    // Primary: Anthropic Messages API on AgentRouter
    providers.push({
      provider: "agentrouter-anthropic",
      apiKey: anthropicKey,
      baseURL: cleanBaseURL,
      model: anthropicModel,
    });

    // Secondary fallback: OpenAI-compatible endpoint on AgentRouter
    providers.push({
      provider: "agentrouter-openai",
      apiKey: anthropicKey,
      baseURL: `${cleanBaseURL}/v1`,
      model: anthropicModel,
    });
  }

  // 2. Tertiary Fallback: General OPENAI_API_KEY (if provided and different from anthropicKey)
  if (generalOpenAIKey && generalOpenAIKey !== anthropicKey) {
    const isProjectKey = generalOpenAIKey.startsWith("sk-proj-") || generalOpenAIKey.startsWith("sk-");
    const openAIBase = process.env.OPENAI_BASE_URL
      ? process.env.OPENAI_BASE_URL.trim().replace(/\/+$/, "")
      : isProjectKey
      ? "https://api.openai.com/v1"
      : "https://agentrouter.org/v1";

    const defaultModel = isProjectKey ? "gpt-4o-mini" : (process.env.OPENAI_MODEL || "gpt-4o-mini");

    providers.push({
      provider: "openai-direct",
      apiKey: generalOpenAIKey,
      baseURL: openAIBase,
      model: defaultModel,
    });
  }

  return providers;
}

/**
 * Initializes a standard OpenAI SDK client instance for general usage (e.g. categorization).
 */
export function getAIClient(): { client: OpenAI; model: string } {
  const rawApiKey = process.env.OPENAI_API_KEY || "";
  const apiKey = rawApiKey.trim().replace(/^['"]|['"]$/g, "");
  const isProjectKey = apiKey.startsWith("sk-proj-") || apiKey.startsWith("sk-");
  
  const rawBaseURL = process.env.OPENAI_BASE_URL || (isProjectKey ? "https://api.openai.com/v1" : "https://agentrouter.org/v1");
  const baseURL = rawBaseURL.trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "");
  const model = (process.env.OPENAI_MODEL || (isProjectKey ? "gpt-4o-mini" : "gpt-4o-mini")).trim();

  const client = new OpenAI({
    apiKey: apiKey || "dummy-key",
    baseURL: baseURL,
    defaultHeaders: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Lorabiz/1.0",
      "Accept": "application/json",
    },
  });

  return { client, model };
}

/**
 * Calls Anthropic Messages API (AgentRouter / Claude) via HTTP.
 */
export async function callAnthropicMessages(
  baseURL: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const cleanBase = baseURL.trim().replace(/\/+$/, "").replace(/\/v1$/, "");
  const endpoint = `${cleanBase}/v1/messages`;
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "User-Agent": "Lorabiz/1.0 (Node.js)",
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 3000,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic/AgentRouter HTTP ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text || "";
  return text;
}
