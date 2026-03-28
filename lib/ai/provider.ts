/**
 * Provider-agnostic AI model resolver.
 *
 * Set AI_PROVIDER env var to switch providers without code changes:
 *   - "google"    → Gemini 2.0 Flash  (cheapest, default)
 *   - "anthropic" → Claude Sonnet 4   (best quality)
 *   - "openai"    → GPT-4o-mini       (mid-range)
 *
 * Each provider reads its own API key from the environment automatically:
 *   - google:    GOOGLE_GENERATIVE_AI_API_KEY
 *   - anthropic: ANTHROPIC_API_KEY
 *   - openai:    OPENAI_API_KEY
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

export type AIProvider = "google" | "anthropic" | "openai";

const PROVIDER_CONFIG = {
  google: {
    envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    model: "gemini-2.5-flash",
    create: (apiKey: string) => createGoogleGenerativeAI({ apiKey }),
  },
  anthropic: {
    envKey: "ANTHROPIC_API_KEY",
    model: "claude-sonnet-4-20250514",
    create: (apiKey: string) => createAnthropic({ apiKey }),
  },
  openai: {
    envKey: "OPENAI_API_KEY",
    model: "gpt-4o-mini",
    create: (apiKey: string) => createOpenAI({ apiKey }),
  },
} as const;

function getProviderName(): AIProvider {
  const name = process.env.AI_PROVIDER ?? "google";
  if (!(name in PROVIDER_CONFIG)) {
    throw new Error(
      `Invalid AI_PROVIDER "${name}". Must be one of: ${Object.keys(PROVIDER_CONFIG).join(", ")}`
    );
  }
  return name as AIProvider;
}

/**
 * Returns a configured model instance for the current provider.
 * Call this per-request (not at module scope) so env var changes
 * are picked up without a restart during development.
 */
export function getModel() {
  const name = getProviderName();
  const cfg = PROVIDER_CONFIG[name];
  const apiKey = process.env[cfg.envKey];

  if (!apiKey) {
    throw new Error(
      `Missing ${cfg.envKey} for AI_PROVIDER="${name}". Set it in .env.local or your hosting secrets.`
    );
  }

  const provider = cfg.create(apiKey);
  return provider(cfg.model);
}

export function getProviderInfo() {
  const name = getProviderName();
  const cfg = PROVIDER_CONFIG[name];
  return { provider: name, model: cfg.model };
}
