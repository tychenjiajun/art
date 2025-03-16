import { LanguageModelV1 } from "ai";
import { openai } from "@ai-sdk/openai";
import { openaiCompatible } from "./providers/openai-compatible.js";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { xai } from "@ai-sdk/xai";

const AVAILABLE_PROVIDERS = [
  "openai",
  "openai-compatible",
  "anthropic",
  "google",
  "xai",
] as const;

type ProviderName = (typeof AVAILABLE_PROVIDERS)[number];

export function provider(p: string): (modelName: string) => LanguageModelV1 {
  switch (p as ProviderName) {
    case "openai": {
      return openai;
    }
    case "openai-compatible": {
      return openaiCompatible;
    }
    case "anthropic": {
      return anthropic;
    }
    case "google": {
      return google;
    }
    case "xai": {
      return xai;
    }
    default: {
      throw new Error(
        `Unsupported provider: ${p}. Available providers: ${AVAILABLE_PROVIDERS.join(", ")}`,
      );
    }
  }
}
