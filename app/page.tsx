export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { desc, isNotNull } from "drizzle-orm";
import {
  getNextSession,
  getTodayPreferredSession,
  getExercise,
  WARMUP,
  PROGRAMME,
  PROGRAMME_VERSION,
  isDeloadDue,
  INTENT_LABELS,
} from "@/lib/programme";
import { config } from "@/lib/config";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatDuration } from "@/lib/utils";

export default async function DashboardPage() {
  // Fetch recent completed sessions for history-aware scheduling
  const recentSessions = await db
    .select({
      id: sessions.id,
      date: sessions.date,
      sessionIndex: sessions.sessionIndex,
      completedAt: sessions.completedAt,
      durationSeconds: sessions.durationSeconds,
      intent: sessions.intent,
      preferredDay: sessions.preferredDay,
    })
    .from(sessions)
    .where(isNotNull(sessions.completedAt))
    .orderBy(desc(sessions.startedAt))
    .limit(50);

  // Next session: based on last completed session index, not the calendar
  const lastIndex = recentSessions[0]?.sessionIndex ?? null;
  const nextSession = getNextSession(lastIndex);

  // Is today a preferred day for any session?
  const todayPreferred = getTodayPreferredSession();
  const isPreferredToday = todayPreferred?.index === nextSession.index;

  const { due: deloadDue, weeksTraining } = isDeloadDue(
    recentSessions.map((s) => s.date),
    config.deloadEveryWeeks
  );

  const totalSessions = recentSessions.length;
  const avgDuration =
    recentSessions.filter((s) => s.durationSeconds).length > 0
      ? Math.round(
          recentSessions.reduce((a, s) => a + (s.durationSeconds ?? 0), 0) /
            recentSessions.filter((s) => s.durationSeconds).length
        )
      : null;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // This week's completion
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const weekStart = startOfWeek.toISOString().split("T")[0];
  const doneThisWeek = new Set(
    recentSessions.filter((s) => s.date >= weekStart).map((s) => s.sessionIndex)
  );

  // Last 5 sessions for recent activity
  const recentActivity = recentSessions.slice(0, 5);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">{greeting}</p>
          <h1 className="text-2xl font-semibold mt-0.5">
            {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </h1>
        </div>
        <ThemeToggle />
      </div>

      {/* Deload reminder */}
      {deloadDue && (
        <div className="rounded-[var(--radius-lg)] bg-[var(--warning)]/10 border border-[var(--warning)]/30 px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="text-[var(--warning)] text-base mt-0.5">!</span>
            <div>
              <p className="text-sm font-semibold text-[var(--warning)]">Deload week due</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {weeksTraining} weeks of training logged. Reduce all weights by{" "}
                {Math.round((1 - config.deloadFactor) * 100)}% this week and focus on movement quality.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next session card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={isPreferredToday ? "primary" : "muted"}>
                {isPreferredToday ? "Today" : `Next up`}
              </Badge>
              <Badge variant="muted">{INTENT_LABELS[nextSession.intent]}</Badge>
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">v{PROGRAMME_VERSION}</span>
          </div>
          <h2 className="text-lg font-semibold mt-2">{nextSession.label}</h2>
          {!isPreferredToday && (
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Preferred day: {nextSession.preferredDayName} — start it any time
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 mb-4">
            {nextSession.exercises.map((id, i) => {
              const ex = getExercise(id);
              return (
                <li key={id} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] text-xs flex items-center justify-center flex-shrink-0 font-mono">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{ex.name}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {ex.sets} x {ex.reps}
                      {ex.restSeconds > 0
                        ? ` · ${ex.restSeconds >= 60 ? `${ex.restSeconds / 60}min` : `${ex.restSeconds}s`} rest`
                        : ""}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="rounded-[var(--radius)] bg-[var(--secondary)] px-3 py-2 mb-4">
            <p className="text-xs text-[var(--muted-foreground)]">
              <span className="font-medium text-[var(--foreground)]">Warm-up first · 10 min</span>
              {" — "}
              {WARMUP.map((w) => w.name).join(", ")}
            </p>
          </div>

          <Link href={`/workouts/active?session=${nextSession.index}`} className="block">
            <Button size="xl" className="w-full">
              {isPreferredToday ? "Start Today's Session" : "Start Session"}
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Week at a glance + stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* Week progress */}
        <Card className="p-4">
          <p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wider mb-2">
            This week
          </p>
          <div className="flex gap-2">
            {PROGRAMME.map((session) => {
              const done = doneThisWeek.has(session.index);
              const isNext = session.index === nextSession.index;
              return (
                <div
                  key={session.index}
                  className={`flex-1 h-2 rounded-full ${
                    done
                      ? "bg-[var(--success)]"
                      : isNext
                        ? "bg-[var(--primary)]/40"
                        : "bg-[var(--secondary)]"
                  }`}
                />
              );
            })}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">
            {doneThisWeek.size}/{PROGRAMME.length} sessions
          </p>
        </Card>

        {/* Stats */}
        <Card className="p-4">
          <p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wider mb-2">
            Overall
          </p>
          <p className="text-lg font-bold">{totalSessions} <span className="text-xs font-normal text-[var(--muted-foreground)]">sessions</span></p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {weeksTraining} weeks · avg {avgDuration ? formatDuration(avgDuration) : "—"}
          </p>
        </Card>
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Recent
            </h2>
            <Link href="/workouts" className="text-xs text-[var(--primary)] hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentActivity.map((s) => (
              <Link key={s.id} href={`/workouts/${s.id}`}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-full bg-[var(--secondary)] flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[9px] text-[var(--muted-foreground)] leading-none font-medium">
                      {new Date(s.date).toLocaleDateString("en-GB", { weekday: "short" })}
                    </span>
                    <span className="text-xs font-bold leading-tight">
                      {new Date(s.date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{INTENT_LABELS[s.intent]}</span>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {s.durationSeconds ? formatDuration(s.durationSeconds) : "—"}
                    </p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)] flex-shrink-0">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
