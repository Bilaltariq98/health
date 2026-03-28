"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NutritionEstimate } from "@/lib/ai/schemas";

type Suggestion = {
  id: string;
  name: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  mealType: string | null;
  isFavourite: boolean | null;
};

interface AddMealFormProps {
  suggestions: Suggestion[];
  date: string;
}

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

const MAX_IMAGE_DIMENSION = 1024;

// ─── Image resize helper ────────────────────────────────────────────────────

function resizeImage(file: File, maxDim: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AddMealForm({ suggestions, date }: AddMealFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState("");
  const [mealType, setMealType] = useState<string>("lunch");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [isFavourite, setIsFavourite] = useState(false);
  const [saving, setSaving] = useState(false);

  // AI state
  const [analyzing, setAnalyzing] = useState<"photo" | "recipe" | null>(null);
  const [aiResult, setAiResult] = useState<NutritionEstimate | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  function fillFromEstimate(est: NutritionEstimate) {
    setName(est.name);
    setCalories(est.calories.toString());
    setProtein(Math.round(est.proteinG).toString());
    setCarbs(Math.round(est.carbsG).toString());
    setFat(Math.round(est.fatG).toString());
    setAiResult(est);
    setAiError(null);
  }

  function fillFromSuggestion(s: Suggestion) {
    setName(s.name);
    setCalories(s.calories?.toString() ?? "");
    setProtein(s.proteinG?.toString() ?? "");
    setCarbs(s.carbsG?.toString() ?? "");
    setFat(s.fatG?.toString() ?? "");
    if (s.mealType) setMealType(s.mealType);
    setAiResult(null);
    setAiError(null);
  }

  // ── Photo analysis ──────────────────────────────────────────────────────

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing("photo");
    setAiError(null);
    setAiResult(null);

    try {
      const resized = await resizeImage(file, MAX_IMAGE_DIMENSION);
      const formData = new FormData();
      formData.append("image", resized, "meal.jpg");

      const res = await fetch("/api/ai/analyze-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error ?? "Photo analysis failed");
        return;
      }

      fillFromEstimate(data as NutritionEstimate);
    } catch {
      setAiError("Photo analysis failed. Try again or enter manually.");
    } finally {
      setAnalyzing(null);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Recipe URL analysis ─────────────────────────────────────────────────

  async function handleAnalyzeRecipe() {
    if (!recipeUrl.trim()) return;

    setAnalyzing("recipe");
    setAiError(null);
    setAiResult(null);

    try {
      const res = await fetch("/api/ai/analyze-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: recipeUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error ?? "Recipe analysis failed");
        return;
      }

      fillFromEstimate(data as NutritionEstimate);
      // Keep the recipe URL in the field
      if (data.recipeUrl) setRecipeUrl(data.recipeUrl);
    } catch {
      setAiError("Recipe analysis failed. Try again or enter manually.");
    } finally {
      setAnalyzing(null);
    }
  }

  // ── Form submit ─────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: nanoid(),
        date,
        name: name.trim(),
        mealType: mealType || undefined,
        calories: calories ? parseInt(calories) : undefined,
        proteinG: protein ? parseFloat(protein) : undefined,
        carbsG: carbs ? parseFloat(carbs) : undefined,
        fatG: fat ? parseFloat(fat) : undefined,
        recipeUrl: recipeUrl.trim() || undefined,
        isFavourite,
        loggedAt: new Date().toISOString(),
      }),
    });

    router.push("/nutrition");
    router.refresh();
  }

  const isValidUrl = (() => {
    try {
      return recipeUrl.trim() !== "" && Boolean(new URL(recipeUrl.trim()));
    } catch {
      return false;
    }
  })();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold">Add meal</h1>
      </div>

      {/* Quick-add from favourites/recents */}
      {suggestions.length > 0 && (
        <div>
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold mb-2">
            Quick add
          </p>
          <div className="flex gap-2 flex-wrap">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => fillFromSuggestion(s)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--secondary)] text-sm hover:bg-[var(--muted)] transition-colors"
              >
                {s.isFavourite && <span className="text-[var(--primary)] text-xs">*</span>}
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Photo scan button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelect}
          className="hidden"
          aria-label="Take or select a meal photo"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={analyzing === "photo"}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)] bg-[var(--card)] text-sm font-medium transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {analyzing === "photo" ? (
            <>
              <Spinner />
              Analyzing photo...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Scan meal photo
            </>
          )}
        </button>
      </div>

      {/* AI error */}
      {aiError && (
        <div className="rounded-[var(--radius)] bg-[var(--destructive)]/10 border border-[var(--destructive)]/30 px-3 py-2">
          <p className="text-xs text-[var(--destructive)]">{aiError}</p>
        </div>
      )}

      {/* AI confidence indicator */}
      {aiResult && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] bg-[var(--secondary)]">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              aiResult.confidence === "high"
                ? "bg-[var(--success)]"
                : aiResult.confidence === "medium"
                  ? "bg-[var(--warning)]"
                  : "bg-[var(--destructive)]"
            }`}
          />
          <p className="text-xs text-[var(--muted-foreground)]">
            <span className="font-medium text-[var(--foreground)]">AI estimated</span>
            {" — "}
            {aiResult.confidence} confidence
            {aiResult.notes && ` — ${aiResult.notes}`}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-xs text-[var(--muted-foreground)] mb-1 block font-medium">
            Meal name <span className="text-[var(--destructive)]">*</span>
          </label>
          <Input
            placeholder="e.g. Chicken and rice"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Meal type */}
        <div>
          <label className="text-xs text-[var(--muted-foreground)] mb-2 block font-medium">Type</label>
          <div className="flex gap-2 flex-wrap">
            {MEAL_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMealType(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  mealType === t
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Macros — 2-column grid */}
        <div>
          <label className="text-xs text-[var(--muted-foreground)] mb-2 block font-medium">
            Macros <span className="opacity-60">(all optional)</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Calories (kcal)</label>
              <Input type="number" inputMode="numeric" placeholder="0" value={calories} onChange={(e) => setCalories(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Protein (g)</label>
              <Input type="number" inputMode="decimal" placeholder="0" value={protein} onChange={(e) => setProtein(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Carbs (g)</label>
              <Input type="number" inputMode="decimal" placeholder="0" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Fat (g)</label>
              <Input type="number" inputMode="decimal" placeholder="0" value={fat} onChange={(e) => setFat(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Recipe URL with inline Analyze button */}
        <div>
          <label className="text-xs text-[var(--muted-foreground)] mb-1 block font-medium">
            Recipe URL <span className="opacity-60">(optional)</span>
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="url"
                placeholder="https://cook.bilaltariq.tech/..."
                value={recipeUrl}
                onChange={(e) => setRecipeUrl(e.target.value)}
              />
            </div>
            {isValidUrl && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleAnalyzeRecipe}
                disabled={analyzing === "recipe"}
                className="flex-shrink-0"
              >
                {analyzing === "recipe" ? <Spinner /> : "Analyze"}
              </Button>
            )}
          </div>
        </div>

        {/* Favourite toggle */}
        <button
          type="button"
          onClick={() => setIsFavourite((f) => !f)}
          className={`flex items-center gap-2 text-sm transition-colors ${
            isFavourite ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
          }`}
        >
          <span className="text-base">{isFavourite ? "★" : "☆"}</span>
          Save as favourite
        </button>

        <Button type="submit" size="xl" className="w-full" disabled={saving || !name.trim()}>
          {saving ? "Saving…" : "Log meal"}
        </Button>
      </form>
    </div>
  );
}

// ─── Small components ───────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
