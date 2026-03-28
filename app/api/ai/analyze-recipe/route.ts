import { generateObject } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/ai/provider";
import { NutritionEstimateSchema } from "@/lib/ai/schemas";
import { RECIPE_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { extractRecipeText } from "@/lib/ai/extract-recipe";
import { logAiUsage } from "@/lib/ai/log-usage";

const RequestSchema = z.object({
  url: z.string().url("Invalid URL"),
});

const FETCH_TIMEOUT_MS = 10_000;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Expected JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { url } = parsed.data;

  // Fetch the recipe page server-side (no CORS issues)
  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "HealthTracker/1.0 (nutrition analysis)",
        Accept: "text/html",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return Response.json(
        { error: `Failed to fetch recipe page (HTTP ${res.status})` },
        { status: 502 }
      );
    }

    html = await res.text();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return Response.json({ error: "Recipe page took too long to load" }, { status: 504 });
    }
    console.error("Recipe fetch failed:", err);
    return Response.json({ error: "Failed to fetch recipe page" }, { status: 502 });
  }

  const recipeText = extractRecipeText(html);
  if (!recipeText || recipeText.length < 50) {
    return Response.json(
      { error: "Could not extract meaningful content from that URL" },
      { status: 400 }
    );
  }

  try {
    const { object, usage } = await generateObject({
      model: getModel(),
      schema: NutritionEstimateSchema,
      system: RECIPE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is the recipe page content:\n\n${recipeText}\n\nEstimate the nutritional content per serving.`,
        },
      ],
    });

    await logAiUsage("ai_recipe_analysis", usage);

    return Response.json({ ...object, recipeUrl: url });
  } catch (err) {
    console.error("AI recipe analysis failed:", err);
    return Response.json(
      { error: "Failed to analyze recipe. Try again or enter manually." },
      { status: 502 }
    );
  }
}
