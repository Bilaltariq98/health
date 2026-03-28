import Link from "next/link";
import { db } from "@/lib/db/client";
import { meals } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickLogButton } from "./quick-log-button";
import { today } from "@/lib/utils";

export default async function FavouritesPage() {
  const favourites = await db
    .select()
    .from(meals)
    .where(eq(meals.isFavourite, true))
    .orderBy(desc(meals.loggedAt))
    .limit(30);

  const recents = await db
    .select()
    .from(meals)
    .orderBy(desc(meals.loggedAt))
    .limit(20);

  const seen = new Set(favourites.map((f) => f.name));
  const recentOnly = recents.filter((r) => !seen.has(r.name));

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/nutrition" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <h1 className="text-xl font-semibold">Favourites &amp; recents</h1>
      </div>

      {favourites.length > 0 && (
        <div>
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold mb-2">Favourites</p>
          <div className="space-y-2">
            {favourites.map((m) => (
              <MealRow key={m.id} meal={m} date={today()} />
            ))}
          </div>
        </div>
      )}

      {recentOnly.length > 0 && (
        <div>
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold mb-2">Recent</p>
          <div className="space-y-2">
            {recentOnly.map((m) => (
              <MealRow key={m.id} meal={m} date={today()} />
            ))}
          </div>
        </div>
      )}

      {favourites.length === 0 && recentOnly.length === 0 && (
        <Card>
          <div className="py-10 text-center px-4">
            <p className="text-[var(--muted-foreground)] text-sm">No favourites yet.</p>
            <p className="text-[var(--muted-foreground)] text-xs mt-1">Star a meal when logging to save it here.</p>
            <Link href="/nutrition/new" className="block mt-4">
              <Button variant="secondary" size="md">Log a meal</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function MealRow({ meal, date }: { meal: { id: string; name: string; calories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null; mealType: string | null; isFavourite: boolean | null; recipeUrl: string | null }; date: string }) {
  return (
    <Card>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {meal.isFavourite && <span className="text-[var(--primary)] text-xs">★</span>}
            <span className="text-sm font-medium">{meal.name}</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {[
              meal.calories != null && `${meal.calories} kcal`,
              meal.proteinG != null && `${meal.proteinG}g P`,
              meal.carbsG != null && `${meal.carbsG}g C`,
              meal.fatG != null && `${meal.fatG}g F`,
            ].filter(Boolean).join(" · ")}
          </p>
        </div>
        <QuickLogButton meal={meal} date={date} />
      </div>
    </Card>
  );
}
