"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { nanoid } from "nanoid";

interface Meal {
  name: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  mealType: string | null;
  isFavourite: boolean | null;
  recipeUrl: string | null;
}

export function QuickLogButton({ meal, date }: { meal: Meal; date: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLog() {
    setLoading(true);
    await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: nanoid(),
        date,
        name: meal.name,
        mealType: meal.mealType ?? undefined,
        calories: meal.calories ?? undefined,
        proteinG: meal.proteinG ?? undefined,
        carbsG: meal.carbsG ?? undefined,
        fatG: meal.fatG ?? undefined,
        recipeUrl: meal.recipeUrl ?? undefined,
        isFavourite: meal.isFavourite ?? false,
        loggedAt: new Date().toISOString(),
      }),
    });
    router.push("/nutrition");
    router.refresh();
  }

  return (
    <button
      onClick={handleLog}
      disabled={loading}
      className="h-9 px-3 rounded-[var(--radius)] bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:bg-[var(--accent)] transition-colors disabled:opacity-50 flex-shrink-0"
    >
      {loading ? "…" : "+ Log"}
    </button>
  );
}
