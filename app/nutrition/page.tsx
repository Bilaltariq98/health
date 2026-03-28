import { Card, CardContent } from "@/components/ui/card";

export default function NutritionPage() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
      <h1 className="text-2xl font-semibold">Nutrition</h1>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-[var(--muted-foreground)] text-sm">Coming in Phase 2.</p>
          <p className="text-[var(--muted-foreground)] text-xs mt-1">
            Macro tracking, meal log, water counter.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
