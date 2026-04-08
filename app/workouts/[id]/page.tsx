export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { sessions, sets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSessionDate, formatDuration, epley1RM } from "@/lib/utils";
import { formatWeight } from "@/lib/config";
import { getExercise, INTENT_LABELS } from "@/lib/programme";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
  if (!session) notFound();

  const sessionSets = await db
    .select()
    .from(sets)
    .where(eq(sets.sessionId, id))
    .orderBy(sets.setNumber);

  // Group sets by exercise
  const byExercise = sessionSets.reduce<Record<string, typeof sessionSets>>(
    (acc, s) => {
      if (!acc[s.exerciseId]) acc[s.exerciseId] = [];
      acc[s.exerciseId].push(s);
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
      {/* Back */}
      <Link
        href="/workouts"
        className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        All sessions
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="muted">{INTENT_LABELS[session.intent] ?? session.intent}</Badge>
          {!session.completedAt && <Badge variant="warning">incomplete</Badge>}
          <span className="text-xs text-[var(--muted-foreground)] font-mono ml-auto">v{session.programmeVersion}</span>
        </div>
        <h1 className="text-2xl font-semibold">{formatSessionDate(session.date)}</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          {sessionSets.length} sets
          {session.durationSeconds ? ` · ${formatDuration(session.durationSeconds)}` : ""}
          {" · "}
          {new Date(session.startedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Per-exercise breakdown */}
      {Object.entries(byExercise).map(([exerciseId, exSets]) => {
        let ex: ReturnType<typeof getExercise> | null = null;
        try { ex = getExercise(exerciseId); } catch { /* retired exercise */ }

        const name = ex?.name ?? exSets[0].exerciseName;
        const pattern = exSets[0].movementPattern;

        // Best set by estimated 1RM
        const best = exSets.reduce((b, s) => {
          const e1 = s.weightKg && s.reps ? epley1RM(s.weightKg, s.reps) : 0;
          const be1 = b.weightKg && b.reps ? epley1RM(b.weightKg, b.reps) : 0;
          return e1 > be1 ? s : b;
        }, exSets[0]);

        return (
          <Card key={exerciseId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{name}</h2>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {pattern.replace(/-/g, " ")}
                </span>
              </div>
              {best.weightKg && best.reps && (
                <p className="text-xs text-[var(--primary)] mt-0.5">
                  Best: {formatWeight(best.weightKg)} × {best.reps} reps
                  {" "}(~{formatWeight(epley1RM(best.weightKg, best.reps))} e1RM)
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {exSets.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 text-sm">
                    <span className="w-12 text-[var(--muted-foreground)] text-xs font-mono">
                      Set {s.setNumber}
                    </span>
                    <span className="flex-1">
                      {s.reps != null && `${s.reps} reps`}
                      {s.weightKg != null && ` @ ${formatWeight(s.weightKg)}`}
                      {s.distanceMetres != null && ` · ${s.distanceMetres}m`}
                    </span>
                    {s.rpe != null && (
                      <span className="text-xs text-[var(--muted-foreground)]">RPE {s.rpe}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {sessionSets.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-[var(--muted-foreground)] text-sm">No sets logged for this session.</p>
          </CardContent>
        </Card>
      )}

      {session.notes && (
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-[var(--muted-foreground)]">{session.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
