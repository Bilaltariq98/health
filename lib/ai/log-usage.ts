import { nanoid } from "nanoid";
import { db } from "@/lib/db/client";
import { events } from "@/lib/db/schema";
import { getProviderInfo } from "./provider";

interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * Logs an AI usage event to the events table.
 * Fire-and-forget — errors are swallowed so they never break the main request.
 */
export async function logAiUsage(
  eventName: "ai_photo_analysis" | "ai_recipe_analysis",
  usage: TokenUsage
) {
  try {
    const { provider, model } = getProviderInfo();
    await db.insert(events).values({
      id: nanoid(),
      name: eventName,
      properties: JSON.stringify({
        provider,
        model,
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
      }),
      occurredAt: new Date().toISOString(),
    });
  } catch {
    // Never let logging break the response
  }
}
