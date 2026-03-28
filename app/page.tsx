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
} from "@/lib/programme";
import { config } from "@/lib/config";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatDuration } from "@/lib/utils";

const intentLabels: Record<string, string> = {
  "lower-push": "Lower + Push",
  "upper-pull": "Upper + Pull",
  "full-body-power": "Full Body Power",
};

export default async function DashboardPage() {
  // Fetch recent completed sessions for history-aware scheduling
  const recentSessions = await db
    .select({
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
            <span className="text-[var(--warning)] text-base mt-0.5">⚠</span>
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
                {isPreferredToday ? "Today" : `Next up · Session ${nextSession.index + 1}`}
              </Badge>
              <Badge variant="muted">{intentLabels[nextSession.intent]}</Badge>
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">v{PROGRAMME_VERSION}</span>
          </div>
          <h2 className="text-lg font-semibold mt-2">{nextSession.label}</h2>
          {!isPreferredToday && (
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Preferred day: {nextSession.preferredDayName} — but you can start it any time
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
                      {ex.sets} × {ex.reps}
                      {ex.restSeconds > 0
                        ? ` · ${ex.restSeconds >= 60 ? `${ex.restSeconds / 60}min` : `${ex.restSeconds}s`} rest`
                        : ""}
                    </span>
                  </div>
                  <Badge variant="muted" className="text-[10px] flex-shrink-0">
                    {ex.movementPattern.replace(/-/g, " ")}
                  </Badge>
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

      {/* Stats strip */}
      {totalSessions > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Sessions", value: totalSessions },
            { label: "Weeks training", value: weeksTraining },
            { label: "Avg duration", value: avgDuration ? formatDuration(avgDuration) : "—" },
          ].map(({ label, value }) => (
            <Card key={label} className="p-3 text-center">
              <p className="text-lg font-bold">{value}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Programme overview */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Programme
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {PROGRAMME.map((session) => {
              const isNext = session.index === nextSession.index;
              const doneThisWeek = recentSessions.some((s) => {
                const d = new Date(s.date);
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                return s.sessionIndex === session.index && d >= startOfWeek;
              });
              return (
                <Link key={session.index} href={`/workouts/active?session=${session.index}`}>
                  <div className={`rounded-[var(--radius)] p-3 text-center relative cursor-pointer transition-colors ${
                    isNext
                      ? "bg-[var(--primary)]/15 border border-[var(--primary)]/30"
                      : "bg-[var(--secondary)] hover:bg-[var(--muted)]"
                  }`}>
                    {doneThisWeek && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--success)]" />
                    )}
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                      S{session.index + 1}
                    </p>
                    <p className="text-xs mt-1 text-[var(--foreground)] leading-tight">
                      {intentLabels[session.intent]}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                      {session.preferredDayName}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/progress">
          <Card className="p-4 hover:border-[var(--primary)]/40 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[var(--radius)] bg-[var(--primary)]/15 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Progress</p>
                <p className="text-xs text-[var(--muted-foreground)]">Strength trends</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/workouts">
          <Card className="p-4 hover:border-[var(--primary)]/40 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[var(--radius)] bg-[var(--primary)]/15 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">History</p>
                <p className="text-xs text-[var(--muted-foreground)]">Past sessions</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
