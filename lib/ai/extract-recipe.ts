import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";

const MAX_TEXT_LENGTH = 8000;

/**
 * Extracts clean article text from raw HTML using Mozilla Readability.
 * Falls back to tag-stripping if Readability can't parse it.
 * Truncates to ~8000 chars to control LLM token costs.
 */
export function extractRecipeText(html: string): string {
  try {
    const { document } = parseHTML(html);
    const reader = new Readability(document);
    const article = reader.parse();

    if (article?.textContent) {
      return truncate(article.textContent);
    }
  } catch {
    // Readability failed — fall through to tag stripping
  }

  return truncate(stripTags(html));
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string): string {
  if (text.length <= MAX_TEXT_LENGTH) return text;
  return text.slice(0, MAX_TEXT_LENGTH) + "\n\n[Text truncated]";
}
