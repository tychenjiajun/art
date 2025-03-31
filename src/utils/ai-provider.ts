/**
 * Centralized AI provider configuration and error handling
 */

import { provider } from "../provider.js";

export function handleProviderSetup(providerName: string, model: string) {
  try {
    return provider(providerName)(model);
  } catch (error: unknown) {
    throw new Error(
      `AI configuration error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
