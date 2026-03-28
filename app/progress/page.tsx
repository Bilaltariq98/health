export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db/client";
import { sets, measurements } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EXERCISES, type MovementPattern } from "@/lib/programme";
import { epley1RM } from "@/lib/utils";
import { formatWeight } from "@/lib/config";
import { StrengthChart } from "@/components/charts/strength-chart";
import { BodyweightChart } from "@/components/charts/bodyweight-chart";

// Patterns to show charts for — ordered by training priority
const CHART_PATTERNS: MovementPattern[] = [
  "hip-hinge",
  "pull-vertical",
  "push-horizontal",
  "squat",
  "pull-horizontal",
  "push-vertical",
  "ballistic",
  "carry",
];

export default async function ProgressPage() {
  const [allSets, allMeasurements] = await Promise.all([
    db.select().from(sets).orderBy(desc(sets.completedAt)).limit(2000),
    db.select().from(measurements).orderBy(desc(measurements.date)).limit(100),
  ]);

  // ── Strength data: best e1RM per day per movement pattern ─────────────────
  // Group sets by pattern → date → pick best e1RM
  const patternData: Record<string, { date: string; e1rm: number; exerciseName: string; weight: number; reps: number }[]> = {};

  for (const set of allSets) {
    if (!set.weightKg || !set.reps) continue;
    const e1rm = epley1RM(set.weightKg, set.reps);
    const date = set.completedAt.split("T")[0];
    const pattern = set.movementPattern;

    if (!patternData[pattern]) patternData[pattern] = [];

    // Keep only the best e1RM per day per pattern
    const existing = patternData[pattern].find((d) => d.date === date);
    if (!existing || e1rm > existing.e1rm) {
      if (existing) {
        existing.e1rm = e1rm;
        existing.exerciseName = set.exerciseName;
        existing.weight = set.weightKg;
        existing.reps = set.reps;
      } else {
        patternData[pattern].push({ date, e1rm, exerciseName: set.exerciseName, weight: set.weightKg, reps: set.reps });
      }
    }
  }

  // Sort each pattern's data chronologically and format dates
  for (const pattern of Object.keys(patternData)) {
    patternData[pattern].sort((a, b) => a.date.localeCompare(b.date));
    patternData[pattern] = patternData[pattern].map((d) => ({
      ...d,
      date: new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    }));
  }

  // ── Bodyweight data ────────────────────────────────────────────────────────
  const bwData = allMeasurements
    .filter((m) => m.weightKg != null)
    .map((m) => ({
      date: new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      weightKg: m.weightKg!,
    }))
    .reverse();

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalSessions = new Set(allSets.map((s) => s.sessionId)).size;
  const totalSetsCount = allSets.length;
  const latestBW = allMeasurements.find((m) => m.weightKg != null);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Progress</h1>
        <div className="flex gap-2">
          <Link href="/progress/body">
            <Button variant="secondary" size="sm">Log weight</Button>
          </Link>
          <a href="/api/export?format=json" download>
            <Button variant="ghost" size="sm">Export</Button>
          </a>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Sessions", value: totalSessions },
          { label: "Sets logged", value: totalSetsCount },
          { label: "Bodyweight", value: latestBW?.weightKg ? formatWeight(latestBW.weightKg) : "—" },
        ].map(({ label, value }) => (
          <Card key={label} className="p-3 text-center">
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Bodyweight trend */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Bodyweight</h2>
            <Link href="/progress/body" className="text-xs text-[var(--primary)] hover:underline">
              + Log
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <BodyweightChart data={bwData} />
        </CardContent>
      </Card>

      {/* Strength charts by movement pattern */}
      {CHART_PATTERNS.map((pattern) => {
        const data = patternData[pattern] ?? [];
        // Find exercises in this pattern for the subtitle
        const exNames = Object.values(EXERCISES)
          .filter((e) => e.movementPattern === pattern)
          .map((e) => e.name);

        return (
          <Card key={pattern}>
            <CardHeader>
              <h2 className="text-sm font-semibold capitalize">{pattern.replace(/-/g, " ")}</h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-relaxed">
                {exNames.join(", ")}
              </p>
            </CardHeader>
            <CardContent>
              <StrengthChart data={data} pattern={pattern} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
