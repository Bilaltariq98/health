import { z } from "zod";

/**
 * Shared schema for AI nutrition estimates.
 * Used as both the `generateObject()` schema and the API response type.
 */
export const NutritionEstimateSchema = z.object({
  name: z.string().describe("Short meal name, e.g. 'Chicken tikka with rice'"),
  calories: z.number().int().nonnegative().describe("Estimated total calories (kcal)"),
  proteinG: z.number().nonnegative().describe("Protein in grams"),
  carbsG: z.number().nonnegative().describe("Carbohydrates in grams"),
  fatG: z.number().nonnegative().describe("Fat in grams"),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("Confidence in the estimate: high = clear identifiable meal, medium = some assumptions, low = hard to tell"),
  notes: z
    .string()
    .optional()
    .describe("Brief caveat if relevant, e.g. 'Portion assumed to be one standard plate'"),
});

export type NutritionEstimate = z.infer<typeof NutritionEstimateSchema>;
