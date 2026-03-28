export const dynamic = "force-dynamic";

import { AddMealForm } from "./add-meal-form";
import { db } from "@/lib/db/client";
import { meals } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { today } from "@/lib/utils";

export default async function AddMealPage() {
  // Fetch favourites + recent meals for quick-add
  const favourites = await db
    .select()
    .from(meals)
    .where(eq(meals.isFavourite, true))
    .orderBy(desc(meals.loggedAt))
    .limit(10);

  const recents = await db
    .select()
    .from(meals)
    .orderBy(desc(meals.loggedAt))
    .limit(10);

  // Deduplicate by name, favourites first
  const seen = new Set<string>();
  const suggestions = [...favourites, ...recents].filter((m) => {
    if (seen.has(m.name)) return false;
    seen.add(m.name);
    return true;
  }).slice(0, 8);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <AddMealForm suggestions={suggestions} date={today()} />
    </div>
  );
}
