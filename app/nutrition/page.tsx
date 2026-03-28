import Link from "next/link";
import { db } from "@/lib/db/client";
import { meals, water } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { today } from "@/lib/utils";
import { config } from "@/lib/config";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MacroRing } from "@/components/macro-ring";
import { WaterCounter } from "@/components/water-counter";
import { DeleteMealButton } from "./delete-meal-button";

const mealTypeOrder = ["breakfast", "lunch", "dinner", "snack", null];
const mealTypeLabel: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export default async function NutritionPage() {
  const date = today();
  const { nutrition } = config;

  const [todayMeals, waterRow] = await Promise.all([
    db.select().from(meals).where(eq(meals.date, date)).orderBy(desc(meals.loggedAt)),
    db.select().from(water).where(eq(water.date, date)),
  ]);

  const totals = todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + (m.proteinG ?? 0),
      carbs: acc.carbs + (m.carbsG ?? 0),
      fat: acc.fat + (m.fatG ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const waterGlasses = waterRow[0]?.glasses ?? 0;

  // Group meals by type
  const grouped = mealTypeOrder.reduce<Record<string, typeof todayMeals>>(
    (acc, type) => {
      const key = type ?? "other";
      acc[key] = todayMeals.filter((m) => (m.mealType ?? null) === type);
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nutrition</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <Link href="/nutrition/new">
          <Button size="md">+ Add meal</Button>
        </Link>
      </div>

      {/* Macro summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Today</h2>
            <span className="text-lg font-bold">{Math.round(totals.calories)}<span className="text-sm font-normal text-[var(--muted-foreground)]"> / {nutrition.caloriesTarget} kcal</span></span>
          </div>
          {/* Calorie bar */}
          <div className="mt-2 h-2 rounded-full bg-[var(--secondary)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((totals.calories / nutrition.caloriesTarget) * 100, 100)}%`,
                backgroundColor: totals.calories > nutrition.caloriesTarget ? "var(--destructive)" : "var(--primary)",
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-around">
            <MacroRing label="Protein" value={totals.protein} target={nutrition.proteinTargetG} unit="g" colour="var(--primary)" />
            <MacroRing label="Carbs" value={totals.carbs} target={nutrition.carbsTargetG} unit="g" colour="#60a5fa" />
            <MacroRing label="Fat" value={totals.fat} target={nutrition.fatTargetG} unit="g" colour="#f59e0b" />
          </div>
        </CardContent>
      </Card>

      {/* Water */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Water</h2>
        </CardHeader>
        <CardContent>
          <WaterCounter initialGlasses={waterGlasses} />
        </CardContent>
      </Card>

      {/* Meals by type */}
      {todayMeals.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-[var(--muted-foreground)] text-sm">No meals logged today.</p>
            <Link href="/nutrition/new" className="block mt-3">
              <Button variant="secondary" size="md">Log your first meal</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        mealTypeOrder.map((type) => {
          const key = type ?? "other";
          const group = grouped[key];
          if (!group || group.length === 0) return null;
          return (
            <div key={key}>
              <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                {type ? mealTypeLabel[type] : "Other"}
              </h2>
              <div className="space-y-2">
                {group.map((meal) => (
                  <Card key={meal.id}>
                    <div className="flex items-start gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{meal.name}</span>
                          {meal.isFavourite && (
                            <span className="text-[var(--primary)] text-xs">★</span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                          {[
                            meal.calories != null && `${meal.calories} kcal`,
                            meal.proteinG != null && `${meal.proteinG}g protein`,
                            meal.carbsG != null && `${meal.carbsG}g carbs`,
                            meal.fatG != null && `${meal.fatG}g fat`,
                          ].filter(Boolean).join(" · ")}
                        </p>
                        {meal.recipeUrl && (
                          <a href={meal.recipeUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-[var(--primary)] hover:underline mt-0.5 block">
                            View recipe ↗
                          </a>
                        )}
                      </div>
                      <DeleteMealButton id={meal.id} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Favourites shortcut */}
      <Link href="/nutrition/favourites">
        <Card className="hover:border-[var(--primary)]/30 transition-colors cursor-pointer">
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-[var(--primary)]">★</span>
            <span className="text-sm font-medium flex-1">Favourites &amp; recents</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)]">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </Card>
      </Link>
    </div>
  );
}
