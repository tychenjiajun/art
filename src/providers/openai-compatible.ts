import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const openaiCompatible = createOpenAICompatible({
  baseURL: process.env.OPENAI_BASE_URL ?? "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
  name: "openai-compatible",
  headers: {
    "HTTP-Referer": "https://github.com/tychenjiajun/art", // Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "Art", // Optional. Site title for rankings on openrouter.ai.
  },
});
