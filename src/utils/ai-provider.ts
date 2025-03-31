/**
 * Centralized AI provider configuration and error handling
 */

import { provider } from "../provider.js";

export function handleProviderSetup(providerName: string, model: string) {
  try {
    return provider(providerName)(model);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("not supported")) {
        throw new Error(
          `Provider ${providerName} not supported. Available: openai, openai-compatible, anthropic, google, xai`,
        );
      }
      if (error.message.includes("model")) {
        throw new Error(
          `Model ${model} not supported by ${providerName}. Check available models.`,
        );
      }
    }
    throw new Error(
      `AI configuration error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
