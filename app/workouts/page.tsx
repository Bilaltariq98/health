import Link from "next/link";
import { db } from "@/lib/db/client";
import { sessions, sets } from "@/lib/db/schema";
import { PROGRAMME, getExercise, PROGRAMME_VERSION } from "@/lib/programme";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSessionDate, formatDuration } from "@/lib/utils";
import { desc, eq, count } from "drizzle-orm";

const intentLabels: Record<string, string> = {
  "lower-push": "Lower + Push",
  "upper-pull": "Upper + Pull",
  "full-body-power": "Full Body Power",
};

const patternColours: Record<string, string> = {
  "hip-hinge":       "bg-orange-500/15 text-orange-400",
  "squat":           "bg-yellow-500/15 text-yellow-400",
  "push-vertical":   "bg-blue-500/15 text-blue-400",
  "push-horizontal": "bg-blue-500/15 text-blue-400",
  "pull-vertical":   "bg-purple-500/15 text-purple-400",
  "pull-horizontal": "bg-purple-500/15 text-purple-400",
  "carry":           "bg-green-500/15 text-green-400",
  "anti-rotation":   "bg-teal-500/15 text-teal-400",
  "plyometric":      "bg-red-500/15 text-red-400",
  "ballistic":       "bg-red-500/15 text-red-400",
  "complex":         "bg-pink-500/15 text-pink-400",
};

export default async function WorkoutsPage() {
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long" }).toLowerCase();

  // Fetch recent sessions with set counts
  const recentSessions = await db
    .select({
      id: sessions.id,
      date: sessions.date,
      dayType: sessions.dayType,
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

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Programme</h1>
        <span className="text-xs text-[var(--muted-foreground)] font-mono">v{PROGRAMME_VERSION}</span>
      </div>

      {PROGRAMME.map((session) => {
        const isToday = session.key === today;
        return (
          <Card key={session.key} className={isToday ? "border-[var(--primary)]/40" : ""}>
            <CardHeader>
              <div className="flex items-center gap-2 flex-wrap">
                {isToday && <Badge variant="primary">Today</Badge>}
                <Badge variant="muted">{intentLabels[session.intent]}</Badge>
              </div>
              <h2 className="text-base font-semibold mt-2">{session.label}</h2>
              {session.notes && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1">{session.notes}</p>
              )}
            </CardHeader>
            <CardContent>
              {session.frequencyTopUp && session.frequencyTopUp.length > 0 && (
                <div className="mb-3 rounded-[var(--radius)] bg-[var(--secondary)] px-3 py-2">
                  <p className="text-xs text-[var(--muted-foreground)] font-medium mb-1">Warm-up top-up</p>
                  {session.frequencyTopUp.map((id) => {
                    const ex = getExercise(id);
                    return (
                      <p key={id} className="text-xs text-[var(--foreground)]">
                        {ex.sets} × {ex.reps} {ex.name}
                      </p>
                    );
                  })}
                </div>
              )}
              <ol className="space-y-3 mb-4">
                {session.exercises.map((id, i) => {
                  const ex = getExercise(id);
                  const patternClass = patternColours[ex.movementPattern] ?? "bg-[var(--secondary)] text-[var(--muted-foreground)]";
                  return (
                    <li key={id} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] text-xs flex items-center justify-center flex-shrink-0 font-mono mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{ex.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${patternClass}`}>
                            {ex.movementPattern.replace(/-/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                          {ex.sets} × {ex.reps}{ex.restSeconds > 0 && ` · ${ex.restSeconds}s rest`} · {ex.modality}
                        </p>
                        <ul className="mt-1 space-y-0.5 hidden md:block">
                          {ex.cues.map((cue, ci) => (
                            <li key={ci} className="text-xs text-[var(--muted-foreground)] flex items-start gap-1">
                              <span className="text-[var(--primary)] mt-0.5">·</span>{cue}
                            </li>
                          ))}
                        </ul>
                        {ex.swaps && ex.swaps.length > 0 && (
                          <p className="text-xs text-[var(--muted-foreground)] mt-1">
                            <span className="text-[var(--warning)]">↔</span>{" "}
                            {ex.swaps.map((s) => s.reason).join(" · ")}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <Link href={`/workouts/active?day=${session.key}`}>
                <Button size="lg" className="w-full" variant={isToday ? "primary" : "secondary"}>
                  {isToday ? "Start Today's Session" : `Start ${session.key.charAt(0).toUpperCase() + session.key.slice(1)}'s Session`}
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      })}

      {/* History */}
      <div className="pt-2">
        <h2 className="text-lg font-semibold mb-3">Recent Sessions</h2>
        {recentSessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-[var(--muted-foreground)] text-sm">No sessions logged yet.</p>
              <p className="text-[var(--muted-foreground)] text-xs mt-1">Start a session above to begin tracking.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((s) => (
              <Link key={s.id} href={`/workouts/${s.id}`}>
                <Card className="hover:border-[var(--primary)]/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{formatSessionDate(s.date)}</span>
                        <Badge variant="muted" className="text-[10px]">{intentLabels[s.intent] ?? s.intent}</Badge>
                        {!s.completedAt && <Badge variant="warning" className="text-[10px]">incomplete</Badge>}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        {setCountMap[s.id] ?? 0} sets
                        {s.durationSeconds ? ` · ${formatDuration(s.durationSeconds)}` : ""}
                        {" · "}v{s.programmeVersion}
                      </p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)] flex-shrink-0">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
