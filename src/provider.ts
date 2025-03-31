import { LanguageModelV1 } from "ai";
import { openai } from "@ai-sdk/openai";
import { openaiCompatible } from "./providers/openai-compatible.js";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { xai } from "@ai-sdk/xai";
import { mistral } from "@ai-sdk/mistral";
import { deepinfra } from "@ai-sdk/deepinfra";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { azure } from "@ai-sdk/azure";
import { fireworks } from "@ai-sdk/fireworks";
import { togetherai } from "@ai-sdk/togetherai";

const AVAILABLE_PROVIDERS = [
  "openai",
  "openai-compatible",
  "anthropic",
  "google",
  "xai",
  "mistral",
  "deepinfra",
  "bedrock",
  "azure",
  "fireworks",
  "togetherai",
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
    case "mistral": {
      return mistral;
    }
    case "deepinfra": {
      return deepinfra;
    }
    case "bedrock": {
      return bedrock;
    }
    case "azure": {
      return azure;
    }
    case "fireworks": {
      return fireworks;
    }
    case "togetherai": {
      return togetherai;
    }
    default: {
      throw new Error(
        `Unsupported provider: ${p}. Available providers: ${AVAILABLE_PROVIDERS.join(", ")}`,
      );
    }
  }
}
