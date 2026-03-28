"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export function AddMealForm({ suggestions, date }: AddMealFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mealType, setMealType] = useState<string>("lunch");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [isFavourite, setIsFavourite] = useState(false);
  const [saving, setSaving] = useState(false);

  function fillFromSuggestion(s: Suggestion) {
    setName(s.name);
    setCalories(s.calories?.toString() ?? "");
    setProtein(s.proteinG?.toString() ?? "");
    setCarbs(s.carbsG?.toString() ?? "");
    setFat(s.fatG?.toString() ?? "");
    if (s.mealType) setMealType(s.mealType);
  }

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

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
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
                {s.isFavourite && <span className="text-[var(--primary)] text-xs">★</span>}
                {s.name}
              </button>
            ))}
          </div>
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

        {/* Recipe URL */}
        <div>
          <label className="text-xs text-[var(--muted-foreground)] mb-1 block font-medium">
            Recipe URL <span className="opacity-60">(optional)</span>
          </label>
          <Input
            type="url"
            placeholder="https://cook.bilaltariq.tech/..."
            value={recipeUrl}
            onChange={(e) => setRecipeUrl(e.target.value)}
          />
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
