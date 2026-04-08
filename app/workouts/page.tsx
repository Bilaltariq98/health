export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db/client";
import { sessions, sets } from "@/lib/db/schema";
import { PROGRAMME, getExercise, PROGRAMME_VERSION, getNextSession, INTENT_LABELS, INTENT_ICONS } from "@/lib/programme";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import { formatWeight } from "@/lib/config";
import { desc, count, isNotNull } from "drizzle-orm";
import { InProgressSessions } from "./in-progress-sessions";

export default async function WorkoutsPage() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const weekStart = startOfWeek.toISOString().split("T")[0];

  // Fetch recent sessions with set counts
  const recentSessions = await db
    .select({
      id: sessions.id,
      date: sessions.date,
      sessionIndex: sessions.sessionIndex,
      preferredDay: sessions.preferredDay,
      intent: sessions.intent,
      startedAt: sessions.startedAt,
      completedAt: sessions.completedAt,
      durationSeconds: sessions.durationSeconds,
      programmeVersion: sessions.programmeVersion,
    })
    .from(sessions)
    .orderBy(desc(sessions.startedAt))
    .limit(20);

  // Get set counts per session
  const setCounts = await db
    .select({ sessionId: sets.sessionId, count: count() })
    .from(sets)
    .groupBy(sets.sessionId);
  const setCountMap = Object.fromEntries(setCounts.map((r) => [r.sessionId, r.count]));

  // Best set per session (heaviest weight logged)
  const bestSets = await db
    .select({
      sessionId: sets.sessionId,
      exerciseName: sets.exerciseName,
      weightKg: sets.weightKg,
      reps: sets.reps,
    })
    .from(sets)
    .where(isNotNull(sets.weightKg))
    .orderBy(desc(sets.weightKg))
    .limit(200);

  const bestSetMap: Record<string, { exerciseName: string; weightKg: number; reps: number | null }> = {};
  for (const s of bestSets) {
    if (!bestSetMap[s.sessionId] && s.weightKg != null) {
      bestSetMap[s.sessionId] = {
        exerciseName: s.exerciseName,
        weightKg: s.weightKg,
        reps: s.reps,
      };
    }
  }

  // Determine next session and what's done this week
  const lastCompleted = recentSessions.find((s) => s.completedAt);
  const nextSession = getNextSession(lastCompleted?.sessionIndex ?? null);

  const doneThisWeek = new Set(
    recentSessions
      .filter((s) => s.completedAt && s.date >= weekStart)
      .map((s) => s.sessionIndex)
  );

  // Split sessions into completed and in-progress
  const inProgress = recentSessions.filter((s) => !s.completedAt);
  const completed = recentSessions.filter((s) => s.completedAt);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Workouts</h1>
        <span className="text-xs text-[var(--muted-foreground)] font-mono">v{PROGRAMME_VERSION}</span>
      </div>

      {/* Session picker — compact strip */}
      <div className="grid grid-cols-3 gap-2">
        {PROGRAMME.map((session) => {
          const isNext = session.index === nextSession.index;
          const done = doneThisWeek.has(session.index);
          // If there's an in-progress session for this index, link to resume it
          const existing = inProgress.find((s) => s.sessionIndex === session.index);
          const href = existing
            ? `/workouts/active?session=${session.index}&id=${existing.id}`
            : `/workouts/active?session=${session.index}`;
          return (
            <Link key={session.index} href={href}>
              <div
                className={`relative rounded-[var(--radius-lg)] p-3 text-center cursor-pointer transition-all ${
                  isNext
                    ? "bg-[var(--primary)]/15 border-2 border-[var(--primary)]/40"
                    : "bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]/30"
                }`}
              >
                {(done || isNext) && (
                  <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${
                    done ? "bg-[var(--success)]" : "bg-[var(--primary)]"
                  }`} />
                )}
                <div
                  className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-sm font-bold ${
                    isNext
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                  }`}
                >
                  {INTENT_ICONS[session.intent]}
                </div>
                <p className="text-xs font-medium mt-2 leading-tight">
                  {INTENT_LABELS[session.intent]}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                  {session.preferredDayName}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* In-progress sessions — surface these prominently */}
      {inProgress.length > 0 && (
        <InProgressSessions sessions={inProgress} setCountMap={setCountMap} />
      )}

      {/* Recent sessions — the main content */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
          Recent sessions
        </h2>
        {completed.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--secondary)] mx-auto flex items-center justify-center mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12" />
                </svg>
              </div>
              <p className="text-[var(--muted-foreground)] text-sm">No sessions completed yet.</p>
              <p className="text-[var(--muted-foreground)] text-xs mt-1">
                Tap a session above to start tracking.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {completed.map((s) => {
              const best = bestSetMap[s.id];
              const dayName = new Date(s.date).toLocaleDateString("en-GB", { weekday: "short" });
              return (
                <Link key={s.id} href={`/workouts/${s.id}`}>
                  <Card className="hover:border-[var(--primary)]/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Day circle */}
                      <div className="w-10 h-10 rounded-full bg-[var(--secondary)] flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-[var(--muted-foreground)] leading-none font-medium">
                          {dayName}
                        </span>
                        <span className="text-sm font-bold leading-tight">
                          {new Date(s.date).getDate()}
                        </span>
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {INTENT_LABELS[s.intent] ?? s.intent}
                          </span>
                          <Badge variant="muted" className="text-[10px]">
                            S{s.sessionIndex + 1}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                          {setCountMap[s.id] ?? 0} sets
                          {s.durationSeconds ? ` · ${formatDuration(s.durationSeconds)}` : ""}
                          {best ? ` · ${formatWeight(best.weightKg)} ${best.exerciseName.split(" ")[0]}` : ""}
                        </p>
                      </div>
                      {/* Chevron */}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)] flex-shrink-0">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Programme reference — compact, collapsible-style */}
      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer list-none text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider py-2 [&::-webkit-details-marker]:hidden">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-open:rotate-90"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          Programme reference
        </summary>
        <div className="space-y-3 pt-2">
          {PROGRAMME.map((session) => (
            <Card key={session.index}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="muted">S{session.index + 1}</Badge>
                  <span className="text-sm font-semibold">{INTENT_LABELS[session.intent]}</span>
                  <span className="text-xs text-[var(--muted-foreground)] ml-auto">
                    {session.preferredDayName}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ol className="space-y-1.5">
                  {session.exercises.map((id, i) => {
                    const ex = getExercise(id);
                    return (
                      <li key={id} className="flex items-center gap-2 text-sm">
                        <span className="w-4 text-xs text-[var(--muted-foreground)] font-mono text-right">
                          {i + 1}
                        </span>
                        <span className="flex-1 truncate">{ex.name}</span>
                        <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">
                          {ex.sets} x {ex.reps}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      </details>
    </div>
  );
}
