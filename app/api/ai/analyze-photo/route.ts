import { generateObject } from "ai";
import { getModel } from "@/lib/ai/provider";
import { NutritionEstimateSchema } from "@/lib/ai/schemas";
import { PHOTO_SYSTEM_PROMPT } from "@/lib/ai/prompts";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("image");
  if (!file || !(file instanceof File)) {
    return Response.json({ error: "Missing 'image' field" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return Response.json({ error: `Invalid file type: ${file.type}` }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "Image exceeds 10MB limit" }, { status: 413 });
  }

  // Convert to Uint8Array for the AI SDK
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: NutritionEstimateSchema,
      system: PHOTO_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: bytes, mediaType: file.type },
            { type: "text", text: "Estimate the nutritional content of this meal." },
          ],
        },
      ],
    });

    return Response.json(object);
  } catch (err) {
    console.error("AI photo analysis failed:", err);
    return Response.json(
      { error: "Failed to analyze photo. Try again or enter manually." },
      { status: 502 }
    );
  }
}
