/**
 * Single source of truth for the training programme.
 *
 * To change the programme: edit this file and bump PROGRAMME_VERSION.
 *
 * Sessions are ordered by index (0, 1, 2…), not tied to specific days.
 * preferredDay is a hint for scheduling — the app tracks what was actually
 * done and when, so you can train on any day without breaking history.
 *
 * Historical sets store programmeVersion + sessionIndex at log time, so
 * progress charts remain coherent across routine changes.
 */

export const PROGRAMME_VERSION = "1.1.0";

// ─── Taxonomy ────────────────────────────────────────────────────────────────

export type MovementPattern =
  | "hip-hinge"
  | "squat"
  | "push-vertical"
  | "push-horizontal"
  | "pull-vertical"
  | "pull-horizontal"
  | "carry"
  | "anti-rotation"
  | "plyometric"
  | "ballistic"
  | "complex";

export type MuscleGroup =
  | "posterior-chain"
  | "glutes"
  | "quads"
  | "hamstrings"
  | "chest"
  | "upper-back"
  | "lats"
  | "shoulders"
  | "core"
  | "grip"
  | "hip-flexors"
  | "rotator-cuff";

export type Modality =
  | "bilateral"
  | "unilateral"
  | "loaded-carry"
  | "ballistic"
  | "isometric";

export type Equipment =
  | "trap-bar"
  | "barbell"
  | "dumbbell"
  | "cable"
  | "kettlebell"
  | "bodyweight"
  | "sled"
  | "battle-ropes"
  | "box"
  | "med-ball"
  | "band";

export type LoggingMode =
  | "reps-weight"
  | "reps-only"
  | "distance-weight"
  | "distance-only"
  | "duration"
  | "complex";

// ─── Exercise definition ──────────────────────────────────────────────────────

export interface Exercise {
  /** Stable identifier — used as FK in the database. Never rename. */
  id: string;
  name: string;
  movementPattern: MovementPattern;
  muscleGroups: [MuscleGroup, ...MuscleGroup[]];
  modality: Modality;
  equipment: Equipment[];
  loggingMode: LoggingMode;
  sets: number;
  reps: string;
  restSeconds: number;
  cues: string[];
  swaps?: { id: string; reason: string }[];
}

// ─── Warm-up / cool-down ─────────────────────────────────────────────────────

export interface WarmUpExercise {
  name: string;
  prescription: string;
  purpose: string;
}

export const WARMUP: WarmUpExercise[] = [
  { name: "World's Greatest Stretch", prescription: "5 per side", purpose: "Hip, thoracic, and ankle mobility" },
  { name: "Hip 90/90 Transitions", prescription: "5 per side", purpose: "Internal and external hip rotation" },
  { name: "Band Pull-Aparts", prescription: "15 reps", purpose: "Rear delt activation, scapular health" },
  { name: "Goblet Squat Hold", prescription: "30 seconds", purpose: "Deep squat mobility, ankle dorsiflexion" },
  { name: "Dead Bugs", prescription: "10 reps (5/side)", purpose: "Core activation, pelvic stability" },
];

export const COOLDOWN: WarmUpExercise[] = [
  { name: "90/90 Hip Stretch", prescription: "30 sec/side", purpose: "Hip internal and external rotation" },
  { name: "Couch Stretch", prescription: "30 sec/side", purpose: "Hip flexor and quad lengthening" },
  { name: "Dead Hang from Bar", prescription: "30–45 seconds", purpose: "Shoulder decompression, spinal traction" },
];

// ─── Exercise library ─────────────────────────────────────────────────────────

export const EXERCISES: Record<string, Exercise> = {
  "trap-bar-deadlift": {
    id: "trap-bar-deadlift",
    name: "Trap Bar Deadlift",
    movementPattern: "hip-hinge",
    muscleGroups: ["posterior-chain", "quads", "glutes", "grip"],
    modality: "bilateral",
    equipment: ["trap-bar"],
    loggingMode: "reps-weight",
    sets: 4, reps: "5", restSeconds: 150,
    cues: ["Low handles for full ROM", "Exhale as you drive through the floor", "Chest up, hips back to initiate"],
    swaps: [{ id: "conventional-deadlift", reason: "No trap bar available" }, { id: "romanian-deadlift", reason: "Lower back fatigue" }],
  },
  "bulgarian-split-squat": {
    id: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    movementPattern: "squat",
    muscleGroups: ["quads", "glutes", "hamstrings"],
    modality: "unilateral",
    equipment: ["dumbbell"],
    loggingMode: "reps-weight",
    sets: 3, reps: "8", restSeconds: 90,
    cues: ["2-second eccentric — control the descent", "Front knee tracks over toes", "Log reps per leg"],
  },
  "db-overhead-press": {
    id: "db-overhead-press",
    name: "DB Overhead Press (standing)",
    movementPattern: "push-vertical",
    muscleGroups: ["shoulders", "core", "upper-back"],
    modality: "bilateral",
    equipment: ["dumbbell"],
    loggingMode: "reps-weight",
    sets: 3, reps: "8", restSeconds: 90,
    cues: ["Standing — engages core throughout", "Exhale as you press", "Don't hyperextend the lower back"],
  },
  "cable-pallof-press": {
    id: "cable-pallof-press",
    name: "Cable Pallof Press",
    movementPattern: "anti-rotation",
    muscleGroups: ["core"],
    modality: "unilateral",
    equipment: ["cable"],
    loggingMode: "reps-weight",
    sets: 3, reps: "10", restSeconds: 60,
    cues: ["Resist rotation — the cable wants to pull you", "Log reps per side", "Brace before pressing out"],
  },
  "farmer-carries": {
    id: "farmer-carries",
    name: "Farmer Carries",
    movementPattern: "carry",
    muscleGroups: ["grip", "core", "upper-back", "glutes"],
    modality: "loaded-carry",
    equipment: ["dumbbell"],
    loggingMode: "distance-weight",
    sets: 3, reps: "30m", restSeconds: 60,
    cues: ["Target ~50% bodyweight total to start", "Tall posture, shoulders packed", "Log total weight carried (both hands)"],
  },
  "turkish-get-up": {
    id: "turkish-get-up",
    name: "Turkish Get-Up",
    movementPattern: "complex",
    muscleGroups: ["shoulders", "core", "rotator-cuff", "hip-flexors"],
    modality: "unilateral",
    equipment: ["kettlebell"],
    loggingMode: "complex",
    sets: 2, reps: "3", restSeconds: 0,
    cues: ["Done first — stabilisers are fresh", "Slow and controlled. Quality over speed", "Light weight — this is a movement skill", "Eye on the bell throughout"],
  },
  "pull-ups": {
    id: "pull-ups",
    name: "Pull-ups / Lat Pulldown",
    movementPattern: "pull-vertical",
    muscleGroups: ["lats", "upper-back", "grip"],
    modality: "bilateral",
    equipment: ["bodyweight", "cable"],
    loggingMode: "reps-weight",
    sets: 4, reps: "6–8", restSeconds: 120,
    cues: ["Pull-ups if you can; lat pulldown to build up", "Log 0kg for bodyweight pull-ups", "Full hang at the bottom"],
  },
  "db-bench-press": {
    id: "db-bench-press",
    name: "DB Bench Press",
    movementPattern: "push-horizontal",
    muscleGroups: ["chest", "shoulders", "upper-back"],
    modality: "bilateral",
    equipment: ["dumbbell"],
    loggingMode: "reps-weight",
    sets: 3, reps: "8", restSeconds: 90,
    cues: ["Full ROM — dumbbells allow greater stretch at the bottom", "Control the descent"],
  },
  "single-arm-cable-row": {
    id: "single-arm-cable-row",
    name: "Single-Arm Cable Row",
    movementPattern: "pull-horizontal",
    muscleGroups: ["upper-back", "lats", "core"],
    modality: "unilateral",
    equipment: ["cable"],
    loggingMode: "reps-weight",
    sets: 3, reps: "10", restSeconds: 60,
    cues: ["Unilateral — corrects left-right imbalances", "Log reps per side", "Initiate with the elbow, not the hand"],
  },
  "face-pulls": {
    id: "face-pulls",
    name: "Face Pulls",
    movementPattern: "pull-horizontal",
    muscleGroups: ["rotator-cuff", "upper-back", "shoulders"],
    modality: "bilateral",
    equipment: ["cable"],
    loggingMode: "reps-weight",
    sets: 3, reps: "15", restSeconds: 60,
    cues: ["Rope attachment", "Pull to forehead, elbows high", "Light weight, high quality"],
  },
  "kettlebell-swings": {
    id: "kettlebell-swings",
    name: "Kettlebell Swings",
    movementPattern: "ballistic",
    muscleGroups: ["posterior-chain", "glutes", "core"],
    modality: "bilateral",
    equipment: ["kettlebell"],
    loggingMode: "reps-weight",
    sets: 4, reps: "12", restSeconds: 60,
    cues: ["Russian-style — shoulder height", "Explosive hip hinge, not a squat", "Exhale sharply at the top"],
  },
  "box-jumps": {
    id: "box-jumps",
    name: "Box Jumps",
    movementPattern: "plyometric",
    muscleGroups: ["quads", "glutes", "posterior-chain"],
    modality: "bilateral",
    equipment: ["box"],
    loggingMode: "reps-only",
    sets: 3, reps: "5", restSeconds: 90,
    cues: ["Step down — don't jump down", "Full reset between reps"],
    swaps: [{ id: "med-ball-slams", reason: "Plantar fasciitis flare" }],
  },
  "push-up-variations": {
    id: "push-up-variations",
    name: "Push-Up Variations",
    movementPattern: "push-horizontal",
    muscleGroups: ["chest", "shoulders", "core"],
    modality: "bilateral",
    equipment: ["bodyweight"],
    loggingMode: "reps-only",
    sets: 3, reps: "10–12", restSeconds: 60,
    cues: ["Rotate: standard → diamond → feet-elevated across weeks", "Note which variation in the set notes"],
  },
  "romanian-deadlift": {
    id: "romanian-deadlift",
    name: "Romanian Deadlift (slow eccentric)",
    movementPattern: "hip-hinge",
    muscleGroups: ["hamstrings", "posterior-chain", "glutes"],
    modality: "bilateral",
    equipment: ["barbell", "dumbbell"],
    loggingMode: "reps-weight",
    sets: 3, reps: "8", restSeconds: 90,
    cues: ["3-second lowering phase", "Stop at mid-shin — don't round", "Feel the hamstring stretch at the bottom"],
  },
  "sled-push": {
    id: "sled-push",
    name: "Sled Push",
    movementPattern: "carry",
    muscleGroups: ["quads", "glutes", "posterior-chain", "core"],
    modality: "bilateral",
    equipment: ["sled"],
    loggingMode: "distance-weight",
    sets: 4, reps: "20m", restSeconds: 60,
    cues: ["Low drive angle", "Powerful leg drive"],
    swaps: [{ id: "battle-ropes", reason: "No sled available" }],
  },
  "light-pull-ups-topup": {
    id: "light-pull-ups-topup",
    name: "Pull-up Top-up (light)",
    movementPattern: "pull-vertical",
    muscleGroups: ["lats", "upper-back"],
    modality: "bilateral",
    equipment: ["bodyweight", "cable"],
    loggingMode: "reps-weight",
    sets: 2, reps: "5", restSeconds: 0,
    cues: ["Added to session 1 warm-up for frequency", "Light — not a working set"],
  },
  "light-goblet-squat-topup": {
    id: "light-goblet-squat-topup",
    name: "Goblet Squat Top-up (light)",
    movementPattern: "squat",
    muscleGroups: ["quads", "glutes", "core"],
    modality: "bilateral",
    equipment: ["dumbbell", "kettlebell"],
    loggingMode: "reps-weight",
    sets: 2, reps: "8", restSeconds: 0,
    cues: ["Added to session 2 warm-up for frequency", "Light — mobility focus"],
  },
};

// ─── Session definitions ──────────────────────────────────────────────────────
//
// Sessions are ordered by index. preferredDay is a scheduling hint only —
// the app uses history to determine what's next, not the calendar.
// To change the schedule: update preferredDay here. To add/remove sessions:
// add/remove entries and bump PROGRAMME_VERSION.

export type SessionIntent = "lower-push" | "upper-pull" | "full-body-power";

export interface ProgrammeSession {
  /** Stable 0-based index. Used as FK in DB. Never reorder without bumping PROGRAMME_VERSION. */
  index: number;
  label: string;
  /** The training intent — stable across programme versions for chart aggregation. */
  intent: SessionIntent;
  /** Preferred day of week (0=Sun … 6=Sat). Hint only — not enforced. */
  preferredDay: number;
  preferredDayName: string;
  exercises: string[];
  frequencyTopUp?: string[];
  notes?: string;
}

export const PROGRAMME: ProgrammeSession[] = [
  {
    index: 0,
    label: "Session 1 — Lower Body + Push",
    intent: "lower-push",
    preferredDay: 2, // Tuesday
    preferredDayName: "Tuesday",
    frequencyTopUp: ["light-pull-ups-topup"],
    exercises: [
      "trap-bar-deadlift",
      "bulgarian-split-squat",
      "db-overhead-press",
      "cable-pallof-press",
      "farmer-carries",
    ],
  },
  {
    index: 1,
    label: "Session 2 — Upper Body + Pull",
    intent: "upper-pull",
    preferredDay: 3, // Wednesday
    preferredDayName: "Wednesday",
    frequencyTopUp: ["light-goblet-squat-topup"],
    exercises: [
      "turkish-get-up",
      "pull-ups",
      "db-bench-press",
      "single-arm-cable-row",
      "face-pulls",
    ],
    notes: "TGU is done first when stabilisers are fresh.",
  },
  {
    index: 2,
    label: "Session 3 — Full Body Power + Conditioning",
    intent: "full-body-power",
    preferredDay: 5, // Friday
    preferredDayName: "Friday",
    exercises: [
      "kettlebell-swings",
      "box-jumps",
      "push-up-variations",
      "romanian-deadlift",
      "sled-push",
    ],
  },
];

// ─── Intent display helpers (derived from PROGRAMME) ─────────────────────────

/** Short display label per intent, e.g. "Lower + Push". */
export const INTENT_LABELS: Record<string, string> = {
  "lower-push": "Lower + Push",
  "upper-pull": "Upper + Pull",
  "full-body-power": "Full Body Power",
};

/** Single-char icon per intent for compact UI. */
export const INTENT_ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(INTENT_LABELS).map(([k, v]) => [k, v[0]])
);

// ─── Scheduling helpers ───────────────────────────────────────────────────────

/**
 * Returns the next session to do, based on the last completed session index.
 * If no history: returns session 0.
 * Cycles: 0 → 1 → 2 → 0 → …
 */
export function getNextSession(lastSessionIndex: number | null): ProgrammeSession {
  if (lastSessionIndex === null) return PROGRAMME[0];
  const nextIndex = (lastSessionIndex + 1) % PROGRAMME.length;
  return PROGRAMME[nextIndex];
}

/**
 * Returns the session suggested for today based on preferred days.
 * Returns null if today isn't a preferred day for any session.
 */
export function getTodayPreferredSession(): ProgrammeSession | null {
  const todayDow = new Date().getDay();
  return PROGRAMME.find((s) => s.preferredDay === todayDow) ?? null;
}

/** Resolves a session by index. Throws if out of range. */
export function getSession(index: number): ProgrammeSession {
  const s = PROGRAMME[index];
  if (!s) throw new Error(`Session index ${index} not found in programme`);
  return s;
}

/** Resolves an exercise ID to its definition. Throws if not found. */
export function getExercise(id: string): Exercise {
  const ex = EXERCISES[id];
  if (!ex) throw new Error(`Exercise "${id}" not found in programme config`);
  return ex;
}

export function getExercisesByPattern(pattern: MovementPattern): Exercise[] {
  return Object.values(EXERCISES).filter((e) => e.movementPattern === pattern);
}

export function getExercisesByMuscleGroup(group: MuscleGroup): Exercise[] {
  return Object.values(EXERCISES).filter((e) => e.muscleGroups.includes(group));
}

/**
 * Deload detection: counts distinct training weeks since last rest gap.
 * Resets on any 7-day gap between sessions (proxy for a deload/rest week).
 */
export function isDeloadDue(
  sessionDates: string[],
  deloadEveryWeeks: number
): { due: boolean; weeksTraining: number } {
  if (sessionDates.length === 0) return { due: false, weeksTraining: 0 };

  const sorted = [...sessionDates].sort();
  const weeks = new Set<string>();
  let lastDate: Date | null = null;

  for (const dateStr of sorted) {
    const date = new Date(dateStr);
    if (lastDate) {
      const gap = (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      if (gap >= 7) weeks.clear();
    }
    const jan4 = new Date(date.getFullYear(), 0, 4);
    const week = Math.ceil(((date.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7);
    weeks.add(`${date.getFullYear()}-W${week}`);
    lastDate = date;
  }

  const weeksTraining = weeks.size;
  return { due: weeksTraining >= deloadEveryWeeks, weeksTraining };
}
