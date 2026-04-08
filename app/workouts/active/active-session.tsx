"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import {
  getExercise,
  getSession,
  WARMUP,
  COOLDOWN,
  PROGRAMME_VERSION,
  type Exercise,
  type ProgrammeSession,
} from "@/lib/programme";
import { config, formatWeight, weightPlaceholder } from "@/lib/config";
import { today } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RestTimer } from "@/components/rest-timer";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoggedSet {
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  distanceMetres: number | null;
  side: "left" | "right" | null;
  rpe: number | null;
  completedAt: string;
  notes: string;
}

interface ExerciseLog {
  exerciseId: string;
  sets: LoggedSet[];
}

type Phase = "loading" | "warmup" | "workout" | "cooldown" | "complete";

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiPost(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error(`POST ${path} failed`, await res.text());
  return res;
}

async function apiPatch(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error(`PATCH ${path} failed`, await res.text());
  return res;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActiveSession({ sessionIndex, resumeSessionId }: { sessionIndex: number; resumeSessionId?: string }) {
  const router = useRouter();
  const session: ProgrammeSession = getSession(sessionIndex);
  const exercises = session.exercises.map(getExercise);

  const [phase, setPhase] = useState<Phase>(resumeSessionId ? "loading" : "warmup");
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [logs, setLogs] = useState<ExerciseLog[]>(
    exercises.map((ex) => ({ exerciseId: ex.id, sets: [] }))
  );
  const [showTimer, setShowTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [draft, setDraft] = useState({ reps: "", weight: "", distance: "", rpe: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const sessionIdRef = useRef<string | null>(resumeSessionId ?? null);
  const startedAtRef = useRef<string | null>(null);

  // Resume an in-progress session — fetch existing sets and reconstruct state
  useEffect(() => {
    if (!resumeSessionId) return;

    async function resume() {
      const res = await fetch(`/api/sessions/${resumeSessionId}`);
      if (!res.ok) {
        // Session not found — fall back to fresh warmup
        setPhase("warmup");
        return;
      }
      const data = await res.json();
      startedAtRef.current = data.startedAt;
      sessionIdRef.current = data.id;

      // Reconstruct logs from saved sets
      const existingSets: Array<{
        exerciseId: string;
        setNumber: number;
        reps: number | null;
        weightKg: number | null;
        distanceMetres: number | null;
        side: string | null;
        rpe: number | null;
        completedAt: string;
        notes: string | null;
      }> = data.sets ?? [];

      const restoredLogs: ExerciseLog[] = exercises.map((ex) => {
        const exSets = existingSets
          .filter((s) => s.exerciseId === ex.id)
          .sort((a, b) => a.setNumber - b.setNumber)
          .map((s) => ({
            setNumber: s.setNumber,
            reps: s.reps,
            weightKg: s.weightKg,
            distanceMetres: s.distanceMetres,
            side: (s.side as "left" | "right" | null) ?? null,
            rpe: s.rpe,
            completedAt: s.completedAt,
            notes: s.notes ?? "",
          }));
        return { exerciseId: ex.id, sets: exSets };
      });

      setLogs(restoredLogs);

      // Find the first exercise that still needs sets
      let resumeExIdx = exercises.length - 1;
      for (let i = 0; i < exercises.length; i++) {
        if (restoredLogs[i].sets.length < exercises[i].sets) {
          resumeExIdx = i;
          break;
        }
      }
      setExerciseIndex(resumeExIdx);
      setPhase("workout");
    }

    resume();
  }, [resumeSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentExercise = exercises[exerciseIndex];
  const currentLog = logs[exerciseIndex];
  const setsLogged = currentLog.sets.length;
  const targetSets = currentExercise.sets;
  const exerciseDone = setsLogged >= targetSets;
  const lastSet = currentLog.sets[currentLog.sets.length - 1] ?? null;

  async function startWorkout() {
    const id = nanoid();
    const startedAt = new Date().toISOString();
    sessionIdRef.current = id;
    startedAtRef.current = startedAt;

    await apiPost("/api/sessions", {
      id,
      date: today(),
      sessionIndex: session.index,
      preferredDay: session.preferredDayName,
      intent: session.intent,
      programmeVersion: PROGRAMME_VERSION,
      startedAt,
    });

    setPhase("workout");
  }

  async function logSet() {
    const set: LoggedSet = {
      setNumber: setsLogged + 1,
      reps: draft.reps ? parseInt(draft.reps) : null,
      weightKg: draft.weight ? parseFloat(draft.weight) : null,
      distanceMetres: draft.distance ? parseFloat(draft.distance) : null,
      side: null,
      rpe: draft.rpe ? parseInt(draft.rpe) : null,
      completedAt: new Date().toISOString(),
      notes: draft.notes,
    };

    setLogs((prev) =>
      prev.map((l, i) => (i === exerciseIndex ? { ...l, sets: [...l.sets, set] } : l))
    );
    setDraft((d) => ({ ...d, reps: "", rpe: "", notes: "" }));

    if (sessionIdRef.current) {
      const ex = currentExercise;
      await apiPost("/api/sets", {
        id: nanoid(),
        sessionId: sessionIdRef.current,
        exerciseId: ex.id,
        exerciseName: ex.name,
        movementPattern: ex.movementPattern,
        muscleGroupPrimary: ex.muscleGroups[0],
        setNumber: set.setNumber,
        reps: set.reps ?? undefined,
        weightKg: set.weightKg ?? undefined,
        distanceMetres: set.distanceMetres ?? undefined,
        side: set.side ?? undefined,
        rpe: set.rpe ?? undefined,
        completedAt: set.completedAt,
        notes: set.notes || undefined,
      });
    }

    const restSecs = currentExercise.restSeconds || config.restTimerPresets[1];
    if (restSecs > 0) {
      setTimerSeconds(restSecs);
      setShowTimer(true);
    }
  }

  function nextExercise() {
    setShowTimer(false);
    if (exerciseIndex < exercises.length - 1) {
      setExerciseIndex((i) => i + 1);
      setDraft({ reps: "", weight: "", distance: "", rpe: "", notes: "" });
    } else {
      setPhase("cooldown");
    }
  }

  async function finishSession() {
    setSaving(true);
    if (sessionIdRef.current && startedAtRef.current) {
      const completedAt = new Date().toISOString();
      const durationSeconds = Math.round(
        (new Date(completedAt).getTime() - new Date(startedAtRef.current).getTime()) / 1000
      );
      await apiPatch(`/api/sessions/${sessionIdRef.current}`, { completedAt, durationSeconds });
    }
    setSaving(false);
    setPhase("complete");
  }

  // ── Loading (resuming session) ─────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <FullScreenShell onExit={() => router.back()}>
        <div className="flex flex-col h-full items-center justify-center px-5">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--muted-foreground)] mt-4">Resuming session…</p>
        </div>
      </FullScreenShell>
    );
  }

  // ── Warm-up ────────────────────────────────────────────────────────────────
  if (phase === "warmup") {
    return (
      <FullScreenShell onExit={() => router.back()}>
        <div className="flex flex-col h-full px-5 pt-6 pb-8">
          <PhaseHeader label="Warm-up" sublabel="10 minutes · do this every session" />
          <div className="flex-1 overflow-y-auto space-y-3 mt-4">
            {WARMUP.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--secondary)]">
                <span className="w-6 h-6 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] text-xs flex items-center justify-center flex-shrink-0 font-mono mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{item.prescription}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{item.purpose}</p>
                </div>
              </div>
            ))}
            {session.frequencyTopUp && session.frequencyTopUp.length > 0 && (
              <div className="rounded-[var(--radius-lg)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 p-3">
                <p className="text-xs font-semibold text-[var(--primary)] mb-2">Frequency top-up</p>
                {session.frequencyTopUp.map((id) => {
                  const ex = getExercise(id);
                  return <p key={id} className="text-sm">{ex.sets} × {ex.reps} {ex.name}</p>;
                })}
              </div>
            )}
          </div>
          <Button size="xl" className="w-full mt-6" onClick={startWorkout}>
            Warm-up done → Start workout
          </Button>
        </div>
      </FullScreenShell>
    );
  }

  // ── Cool-down ──────────────────────────────────────────────────────────────
  if (phase === "cooldown") {
    return (
      <FullScreenShell onExit={() => router.back()}>
        <div className="flex flex-col h-full px-5 pt-6 pb-8">
          <PhaseHeader label="Cool-down" sublabel="5 minutes · don't skip this" />
          <div className="flex-1 overflow-y-auto space-y-3 mt-4">
            {COOLDOWN.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--secondary)]">
                <span className="w-6 h-6 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] text-xs flex items-center justify-center flex-shrink-0 font-mono mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{item.prescription}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{item.purpose}</p>
                </div>
              </div>
            ))}
          </div>
          <Button size="xl" className="w-full mt-6" onClick={finishSession} disabled={saving}>
            {saving ? "Saving…" : "Done → Finish session"}
          </Button>
        </div>
      </FullScreenShell>
    );
  }

  // ── Complete ───────────────────────────────────────────────────────────────
  if (phase === "complete") {
    const totalSets = logs.reduce((acc, l) => acc + l.sets.length, 0);
    return (
      <FullScreenShell onExit={() => router.push("/")}>
        <div className="flex flex-col h-full items-center justify-center px-5 text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Session complete</h2>
            <p className="text-[var(--muted-foreground)] mt-2">{totalSets} sets · {session.label}</p>
          </div>
          <div className="w-full space-y-2 text-left">
            {logs.map((log) => {
              if (log.sets.length === 0) return null;
              const ex = getExercise(log.exerciseId);
              const best = log.sets.reduce((b, s) => ((s.weightKg ?? 0) > (b.weightKg ?? 0) ? s : b), log.sets[0]);
              return (
                <div key={log.exerciseId} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">{ex.name}</span>
                  <span className="font-medium">{log.sets.length} sets{best.weightKg ? ` · top ${formatWeight(best.weightKg)}` : ""}</span>
                </div>
              );
            })}
          </div>
          <Button size="xl" className="w-full" onClick={() => router.push("/workouts")}>View history →</Button>
        </div>
      </FullScreenShell>
    );
  }

  // ── Workout ────────────────────────────────────────────────────────────────
  return (
    <FullScreenShell onExit={() => router.back()}>
      {showTimer && (
        <RestTimer
          key={timerSeconds}
          seconds={timerSeconds}
          presets={[...config.restTimerPresets]}
          onComplete={() => setShowTimer(false)}
          onDismiss={() => setShowTimer(false)}
          onChangePreset={(s) => setTimerSeconds(s)}
        />
      )}
      <div className="flex flex-col h-full">
        <div className="h-1 bg-[var(--secondary)]">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-500"
            style={{ width: `${((exerciseIndex + (exerciseDone ? 1 : setsLogged / targetSets)) / exercises.length) * 100}%` }}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[var(--muted-foreground)] tabular-nums">Exercise {exerciseIndex + 1} of {exercises.length}</span>
              <Badge variant="muted">{currentExercise.movementPattern.replace(/-/g, " ")}</Badge>
            </div>
            <h2 className="text-2xl font-bold leading-tight">{currentExercise.name}</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {currentExercise.sets} sets × {currentExercise.reps}
              {currentExercise.restSeconds > 0 && ` · ${currentExercise.restSeconds}s rest`}
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] bg-[var(--secondary)] px-4 py-3 space-y-1">
            {currentExercise.cues.map((cue, i) => (
              <p key={i} className="text-sm text-[var(--muted-foreground)] flex items-start gap-2">
                <span className="text-[var(--primary)] mt-0.5 flex-shrink-0">·</span>{cue}
              </p>
            ))}
          </div>
          <SetTracker total={targetSets} logged={setsLogged} sets={currentLog.sets} />
          {!exerciseDone && (
            <SetLogForm
              exercise={currentExercise}
              setNumber={setsLogged + 1}
              lastSet={lastSet}
              draft={draft}
              onChange={setDraft}
              onLog={logSet}
            />
          )}
          {currentExercise.swaps && currentExercise.swaps.length > 0 && (
            <div className="rounded-[var(--radius)] bg-[var(--warning)]/10 border border-[var(--warning)]/20 px-3 py-2">
              <p className="text-xs text-[var(--warning)] font-medium mb-1">Swap options</p>
              {currentExercise.swaps.map((s) => (
                <p key={s.id} className="text-xs text-[var(--muted-foreground)]">↔ {s.id.replace(/-/g, " ")} — {s.reason}</p>
              ))}
            </div>
          )}
        </div>
        <div className="px-5 pb-8 pt-3 border-t border-[var(--border)]">
          {exerciseDone ? (
            <Button size="xl" className="w-full" onClick={nextExercise}>
              {exerciseIndex < exercises.length - 1 ? `Next: ${exercises[exerciseIndex + 1].name} →` : "Finish workout →"}
            </Button>
          ) : (
            <button
              onClick={() => { setTimerSeconds(currentExercise.restSeconds || config.restTimerPresets[1]); setShowTimer(true); }}
              className="w-full text-center text-sm text-[var(--muted-foreground)] min-h-[44px] flex items-center justify-center"
            >
              Start rest timer manually
            </button>
          )}
        </div>
      </div>
    </FullScreenShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FullScreenShell({ children, onExit }: { children: React.ReactNode; onExit: () => void }) {
  return (
    <div className="fixed inset-0 z-40 bg-[var(--background)] flex flex-col safe-top">
      <div className="flex items-center justify-between px-4 h-12 border-b border-[var(--border)] flex-shrink-0">
        <button onClick={onExit} className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] pointer-hover:text-[var(--foreground)] transition-[color] duration-150 min-h-[44px] min-w-[44px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Exit
        </button>
        <span className="text-xs text-[var(--muted-foreground)] font-mono">
          {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
    </div>
  );
}

function PhaseHeader({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{label}</h1>
      <p className="text-sm text-[var(--muted-foreground)] mt-1">{sublabel}</p>
    </div>
  );
}

function SetTracker({ total, logged, sets }: { total: number; logged: number; sets: LoggedSet[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium">Sets</span>
        <span className="text-sm text-[var(--muted-foreground)] tabular-nums">{logged}/{total}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: total }).map((_, i) => {
          const set = sets[i];
          const done = !!set;
          const current = i === logged;
          return (
            <div key={i} className={cn(
              "flex flex-col items-center justify-center rounded-[var(--radius)] transition-all w-16 h-16",
              done ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : current ? "border-2 border-[var(--primary)] text-[var(--primary)]"
                : "border border-[var(--border)] text-[var(--muted-foreground)] opacity-50"
            )}>
              <span className="text-xs font-medium">Set {i + 1}</span>
              {done && set.weightKg != null && <span className="text-xs font-bold mt-0.5 tabular-nums">{formatWeight(set.weightKg)}</span>}
              {done && set.reps != null && <span className="text-[10px] opacity-80 tabular-nums">{set.reps} reps</span>}
              {!done && current && <span className="text-[10px] mt-0.5">now</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DraftState { reps: string; weight: string; distance: string; rpe: string; notes: string; }

function SetLogForm({ exercise, setNumber, lastSet, draft, onChange, onLog }: {
  exercise: Exercise; setNumber: number; lastSet: LoggedSet | null;
  draft: DraftState; onChange: (d: DraftState) => void; onLog: () => void;
}) {
  const mode = exercise.loggingMode;
  const showWeight = mode === "reps-weight" || mode === "distance-weight";
  const showReps = mode === "reps-weight" || mode === "reps-only" || mode === "complex";
  const showDistance = mode === "distance-weight" || mode === "distance-only";
  const canLog = (showReps && draft.reps !== "") || (showDistance && draft.distance !== "") || mode === "duration";

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--card)] border border-[var(--border)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Set {setNumber}</span>
        {lastSet && (
          <button
            onClick={() => onChange({ ...draft, reps: lastSet.reps?.toString() ?? "", weight: lastSet.weightKg?.toString() ?? "", distance: lastSet.distanceMetres?.toString() ?? "" })}
            className="text-xs text-[var(--primary)] pointer-hover:underline min-h-[44px] flex items-center"
          >Copy last set</button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {showReps && (
          <div>
            <label className="text-xs text-[var(--muted-foreground)] mb-1 block">{mode === "complex" ? "Reps / side" : "Reps"}</label>
            <Input type="number" inputMode="numeric" placeholder={lastSet?.reps?.toString() ?? "0"} value={draft.reps} onChange={(e) => onChange({ ...draft, reps: e.target.value })} />
          </div>
        )}
        {showWeight && (
          <div>
            <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Weight ({weightPlaceholder})</label>
            <Input type="number" inputMode="decimal" placeholder={lastSet?.weightKg?.toString() ?? weightPlaceholder} value={draft.weight} onChange={(e) => onChange({ ...draft, weight: e.target.value })} />
          </div>
        )}
        {showDistance && (
          <div>
            <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Distance (m)</label>
            <Input type="number" inputMode="decimal" placeholder="30" value={draft.distance} onChange={(e) => onChange({ ...draft, distance: e.target.value })} />
          </div>
        )}
        <div>
          <label className="text-xs text-[var(--muted-foreground)] mb-1 block">RPE <span className="opacity-60">(optional)</span></label>
          <Input type="number" inputMode="numeric" placeholder="1–10" min={1} max={10} value={draft.rpe} onChange={(e) => onChange({ ...draft, rpe: e.target.value })} />
        </div>
      </div>
      <Button size="lg" className="w-full" onClick={onLog} disabled={!canLog}>Log set {setNumber}</Button>
    </div>
  );
}
