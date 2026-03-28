import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EXERCISES } from "@/lib/programme";

// Group exercises by movement pattern for the "what will be tracked" preview
const patternGroups = Object.values(EXERCISES).reduce<Record<string, string[]>>(
  (acc, ex) => {
    const p = ex.movementPattern;
    if (!acc[p]) acc[p] = [];
    if (!acc[p].includes(ex.name)) acc[p].push(ex.name);
    return acc;
  },
  {}
);

export default function ProgressPage() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Progress</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Charts aggregate by movement pattern — strength trends survive routine changes.
        </p>
      </div>

      {/* Movement pattern groups — shows what will be tracked */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Tracked by pattern
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(patternGroups).map(([pattern, names]) => (
              <div key={pattern} className="flex items-start gap-3">
                <span className="text-xs font-mono text-[var(--primary)] w-32 flex-shrink-0 pt-0.5">
                  {pattern.replace(/-/g, " ")}
                </span>
                <span className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  {names.join(", ")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-[var(--muted-foreground)] text-sm">Charts available after first session.</p>
          <p className="text-[var(--muted-foreground)] text-xs mt-1">
            1RM estimates, volume trends, bodyweight — coming in Phase 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
