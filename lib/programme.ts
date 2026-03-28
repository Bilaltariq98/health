/**
 * Single source of truth for the training programme.
 *
 * To change the programme: edit this file and bump PROGRAMME_VERSION.
 * Historical sets store programmeVersion at log time, so progress charts
 * remain coherent across routine changes — aggregated by movementPattern
 * and muscleGroups rather than exercise name.
 */

export const PROGRAMME_VERSION = "1.0.0";

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
  | "complex"; // multi-pattern (e.g. Turkish Get-Up)

export type MuscleGroup =
  | "posterior-chain" // hamstrings, glutes, lower back as a system
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
  | "reps-weight" // standard: sets × reps @ weight
  | "reps-only" // bodyweight movements
  | "distance-weight" // carries: distance @ weight
  | "distance-only" // sled push (bodyweight + sled)
  | "duration" // holds, hangs
  | "complex"; // TGU: reps per side

// ─── Exercise definition ──────────────────────────────────────────────────────

export interface Exercise {
  /** Stable identifier — used as FK in the database. Never rename. */
  id: string;
  name: string;
  movementPattern: MovementPattern;
  /** Primary + secondary muscle groups. First entry = primary. */
  muscleGroups: [MuscleGroup, ...MuscleGroup[]];
  modality: Modality;
  equipment: Equipment[];
  loggingMode: LoggingMode;
  /** Prescribed sets for this exercise in its session. */
  sets: number;
  /** Rep target as a string to allow ranges ("6–8") or fixed ("5"). */
  reps: string;
  /** Rest in seconds. */
  restSeconds: number;
  /** Coaching notes shown during the active session. */
  cues: string[];
  /** Swap-in alternatives if equipment unavailable or injury flares. */
  swaps?: { id: string; reason: string }[];
}

// ─── Warm-up ─────────────────────────────────────────────────────────────────

export interface WarmUpExercise {
  name: string;
  prescription: string; // "5 per side", "30 seconds", etc.
  purpose: string;
}

export const WARMUP: WarmUpExercise[] = [
  {
    name: "World's Greatest Stretch",
    prescription: "5 per side",
    purpose: "Hip, thoracic, and ankle mobility",
  },
  {
    name: "Hip 90/90 Transitions",
    prescription: "5 per side",
    purpose: "Internal and external hip rotation",
  },
  {
    name: "Band Pull-Aparts",
    prescription: "15 reps",
    purpose: "Rear delt activation, scapular health",
  },
  {
    name: "Goblet Squat Hold",
    prescription: "30 seconds",
    purpose: "Deep squat mobility, ankle dorsiflexion",
  },
  {
    name: "Dead Bugs",
    prescription: "10 reps (5/side)",
    purpose: "Core activation, pelvic stability",
  },
];

export const COOLDOWN: WarmUpExercise[] = [
  {
    name: "90/90 Hip Stretch",
    prescription: "30 sec/side",
    purpose: "Hip internal and external rotation",
  },
  {
    name: "Couch Stretch",
    prescription: "30 sec/side",
    purpose: "Hip flexor and quad lengthening",
  },
  {
    name: "Dead Hang from Bar",
    prescription: "30–45 seconds",
    purpose: "Shoulder decompression, spinal traction",
  },
];

// ─── Exercise library ─────────────────────────────────────────────────────────
// IDs are stable slugs. If you rename an exercise, keep the id the same.

export const EXERCISES: Record<string, Exercise> = {
  "trap-bar-deadlift": {
    id: "trap-bar-deadlift",
    name: "Trap Bar Deadlift",
    movementPattern: "hip-hinge",
    muscleGroups: ["posterior-chain", "quads", "glutes", "grip"],
    modality: "bilateral",
    equipment: ["trap-bar"],
    loggingMode: "reps-weight",
    sets: 4,
    reps: "5",
    restSeconds: 150,
    cues: [
      "Low handles for full ROM",
      "Exhale as you drive through the floor",
      "Chest up, hips back to initiate",
    ],
    swaps: [
      { id: "conventional-deadlift", reason: "No trap bar available" },
      { id: "romanian-deadlift", reason: "Lower back fatigue" },
    ],
  },

  "bulgarian-split-squat": {
    id: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    movementPattern: "squat",
    muscleGroups: ["quads", "glutes", "hamstrings"],
    modality: "unilateral",
    equipment: ["dumbbell"],
    loggingMode: "reps-weight",
    sets: 3,
    reps: "8",
    restSeconds: 90,
    cues: [
      "2-second eccentric — control the descent",
      "Front knee tracks over toes",
      "Log reps per leg",
    ],
  },

  "db-overhead-press": {
    id: "db-overhead-press",
    name: "DB Overhead Press (standing)",
    movementPattern: "push-vertical",
    muscleGroups: ["shoulders", "core", "upper-back"],
    modality: "bilateral",
    equipment: ["dumbbell"],
    loggingMode: "reps-weight",
    sets: 3,
    reps: "8",
    restSeconds: 90,
    cues: [
      "Standing — engages core throughout",
      "Exhale as you press",
      "Don't hyperextend the lower back",
    ],
  },

  "cable-pallof-press": {
    id: "cable-pallof-press",
    name: "Cable Pallof Press",
    movementPattern: "anti-rotation",
    muscleGroups: ["core"],
    modality: "unilateral",
    equipment: ["cable"],
    loggingMode: "reps-weight",
    sets: 3,
    reps: "10",
    restSeconds: 60,
    cues: [
      "Resist rotation — the cable wants to pull you",
      "Log reps per side",
      "Brace before pressing out",
    ],
  },

  "farmer-carries": {
    id: "farmer-carries",
    name: "Farmer Carries",
    movementPattern: "carry",
    muscleGroups: ["grip", "core", "upper-back", "glutes"],
    modality: "loaded-carry",
    equipment: ["dumbbell"],
    loggingMode: "distance-weight",
    sets: 3,
    reps: "30m",
    restSeconds: 60,
    cues: [
      "Target ~50% bodyweight total to start",
      "Tall posture, shoulders packed",
      "Log total weight carried (both hands)",
    ],
  },

  "turkish-get-up": {
    id: "turkish-get-up",
    name: "Turkish Get-Up",
    movementPattern: "complex",
    muscleGroups: ["shoulders", "core", "rotator-cuff", "hip-flexors"],
    modality: "unilateral",
    equipment: ["kettlebell"],
    loggingMode: "complex",
    sets: 2,
    reps: "3",
    restSeconds: 0, // rest as needed
    cues: [
      "Done first — stabilisers are fresh",
      "Slow and controlled. Quality over speed",
      "Light weight — this is a movement skill",
      "Eye on the bell throughout",
    ],
  },

  "pull-ups": {
    id: "pull-ups",
    name: "Pull-ups / Lat Pulldown",
    movementPattern: "pull-vertical",
    muscleGroups: ["lats", "upper-back", "grip"],
    modality: "bilateral",
    equipment: ["bodyweight", "cable"],
    loggingMode: "reps-weight",
    sets: 4,
    reps: "6–8",
    restSeconds: 120,
    cues: [
      "Pull-ups if you can; lat pulldown to build up",
      "Log 0kg for bodyweight pull-ups",
      "Full hang at the bottom",
    ],
  },

  "db-bench-press": {
    id: "db-bench-press",
    name: "DB Bench Press",
    movementPattern: "push-horizontal",
    muscleGroups: ["chest", "shoulders", "upper-back"],
    modality: "bilateral",
    equipment: ["dumbbell"],
    loggingMode: "reps-weight",
    sets: 3,
    reps: "8",
    restSeconds: 90,
    cues: [
      "Full ROM — dumbbells allow greater stretch at the bottom",
      "Control the descent",
    ],
  },

  "single-arm-cable-row": {
    id: "single-arm-cable-row",
    name: "Single-Arm Cable Row",
    movementPattern: "pull-horizontal",
    muscleGroups: ["upper-back", "lats", "core"],
    modality: "unilateral",
    equipment: ["cable"],
    loggingMode: "reps-weight",
    sets: 3,
    reps: "10",
    restSeconds: 60,
    cues: [
      "Unilateral — corrects left-right imbalances",
      "Log reps per side",
      "Initiate with the elbow, not the hand",
    ],
  },

  "face-pulls": {
    id: "face-pulls",
    name: "Face Pulls",
    movementPattern: "pull-horizontal",
    muscleGroups: ["rotator-cuff", "upper-back", "shoulders"],
    modality: "bilateral",
    equipment: ["cable"],
    loggingMode: "reps-weight",
    sets: 3,
    reps: "15",
    restSeconds: 60,
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
    sets: 4,
    reps: "12",
    restSeconds: 60,
    cues: [
      "Russian-style — shoulder height",
      "Explosive hip hinge, not a squat",
      "Exhale sharply at the top",
    ],
  },

  "box-jumps": {
    id: "box-jumps",
    name: "Box Jumps",
    movementPattern: "plyometric",
    muscleGroups: ["quads", "glutes", "posterior-chain"],
    modality: "bilateral",
    equipment: ["box"],
    loggingMode: "reps-only",
    sets: 3,
    reps: "5",
    restSeconds: 90,
    cues: [
      "Step down — don't jump down",
      "Full reset between reps",
    ],
    swaps: [
      { id: "med-ball-slams", reason: "Plantar fasciitis flare" },
    ],
  },

  "push-up-variations": {
    id: "push-up-variations",
    name: "Push-Up Variations",
    movementPattern: "push-horizontal",
    muscleGroups: ["chest", "shoulders", "core"],
    modality: "bilateral",
    equipment: ["bodyweight"],
    loggingMode: "reps-only",
    sets: 3,
    reps: "10–12",
    restSeconds: 60,
    cues: [
      "Rotate: standard → diamond → feet-elevated across weeks",
      "Note which variation in the set notes",
    ],
  },

  "romanian-deadlift": {
    id: "romanian-deadlift",
    name: "Romanian Deadlift (slow eccentric)",
    movementPattern: "hip-hinge",
    muscleGroups: ["hamstrings", "posterior-chain", "glutes"],
    modality: "bilateral",
    equipment: ["barbell", "dumbbell"],
    loggingMode: "reps-weight",
    sets: 3,
    reps: "8",
    restSeconds: 90,
    cues: [
      "3-second lowering phase",
      "Stop at mid-shin — don't round",
      "Feel the hamstring stretch at the bottom",
    ],
  },

  "sled-push": {
    id: "sled-push",
    name: "Sled Push",
    movementPattern: "carry",
    muscleGroups: ["quads", "glutes", "posterior-chain", "core"],
    modality: "bilateral",
    equipment: ["sled"],
    loggingMode: "distance-weight",
    sets: 4,
    reps: "20m",
    restSeconds: 60,
    cues: ["Low drive angle", "Powerful leg drive"],
    swaps: [
      { id: "battle-ropes", reason: "No sled available" },
    ],
  },

  // ── Frequency top-ups (warm-up additions) ──────────────────────────────────

  "light-pull-ups-topup": {
    id: "light-pull-ups-topup",
    name: "Pull-up Top-up (light)",
    movementPattern: "pull-vertical",
    muscleGroups: ["lats", "upper-back"],
    modality: "bilateral",
    equipment: ["bodyweight", "cable"],
    loggingMode: "reps-weight",
    sets: 2,
    reps: "5",
    restSeconds: 0,
    cues: ["Added to Tuesday warm-up for frequency", "Light — not a working set"],
  },

  "light-goblet-squat-topup": {
    id: "light-goblet-squat-topup",
    name: "Goblet Squat Top-up (light)",
    movementPattern: "squat",
    muscleGroups: ["quads", "glutes", "core"],
    modality: "bilateral",
    equipment: ["dumbbell", "kettlebell"],
    loggingMode: "reps-weight",
    sets: 2,
    reps: "8",
    restSeconds: 0,
    cues: ["Added to Wednesday warm-up for frequency", "Light — mobility focus"],
  },
};

// ─── Session definitions ──────────────────────────────────────────────────────

export type DayKey = "tuesday" | "wednesday" | "friday";

export interface SessionDay {
  key: DayKey;
  label: string;
  /** Describes the training intent — stable across programme versions. */
  intent: "lower-push" | "upper-pull" | "full-body-power";
  /** Exercise IDs in order. */
  exercises: string[];
  /** Warm-up frequency top-up exercise IDs (prepended to warm-up). */
  frequencyTopUp?: string[];
  notes?: string;
}

export const PROGRAMME: SessionDay[] = [
  {
    key: "tuesday",
    label: "Tuesday — Lower Body + Push",
    intent: "lower-push",
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
    key: "wednesday",
    label: "Wednesday — Upper Body + Pull",
    intent: "upper-pull",
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
    key: "friday",
    label: "Friday — Full Body Power + Conditioning",
    intent: "full-body-power",
    exercises: [
      "kettlebell-swings",
      "box-jumps",
      "push-up-variations",
      "romanian-deadlift",
      "sled-push",
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns today's scheduled session, or null if it's a rest day. */
export function getTodaySession(): SessionDay | null {
  const day = new Date().toLocaleDateString("en-GB", { weekday: "long" }).toLowerCase();
  return PROGRAMME.find((s) => s.key === day) ?? null;
}

/** Returns the next scheduled session from today. */
export function getNextSession(): SessionDay {
  const today = new Date().getDay(); // 0=Sun, 1=Mon, ...
  const dayMap: Record<DayKey, number> = { tuesday: 2, wednesday: 3, friday: 5 };
  const sorted = PROGRAMME.slice().sort(
    (a, b) => dayMap[a.key] - dayMap[b.key]
  );
  return (
    sorted.find((s) => dayMap[s.key] > today) ?? sorted[0]
  );
}

/** Resolves an exercise ID to its definition. Throws if not found (config error). */
export function getExercise(id: string): Exercise {
  const ex = EXERCISES[id];
  if (!ex) throw new Error(`Exercise "${id}" not found in programme config`);
  return ex;
}

/**
 * Returns all exercise IDs that share a movement pattern.
 * Used by progress charts to aggregate across programme versions.
 */
export function getExercisesByPattern(pattern: MovementPattern): Exercise[] {
  return Object.values(EXERCISES).filter((e) => e.movementPattern === pattern);
}

/**
 * Returns all exercise IDs that target a muscle group (primary or secondary).
 */
export function getExercisesByMuscleGroup(group: MuscleGroup): Exercise[] {
  return Object.values(EXERCISES).filter((e) => e.muscleGroups.includes(group));
}

/**
 * Given a list of completed session dates (ISO strings, newest first),
 * returns whether a deload is due based on config.deloadEveryWeeks.
 *
 * Logic: count distinct calendar weeks with at least one session since the
 * last gap of ≥ 7 days (proxy for a deload week). If that count ≥ deloadEveryWeeks,
 * a deload is due.
 */
export function isDeloadDue(
  sessionDates: string[],
  deloadEveryWeeks: number
): { due: boolean; weeksTraining: number } {
  if (sessionDates.length === 0) return { due: false, weeksTraining: 0 };

  // Sort oldest → newest
  const sorted = [...sessionDates].sort();

  // Count distinct ISO weeks since last rest week (gap ≥ 7 days)
  const weeks = new Set<string>();
  let lastDate: Date | null = null;

  for (const dateStr of sorted) {
    const date = new Date(dateStr);
    if (lastDate) {
      const gap = (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      if (gap >= 7) {
        // Gap detected — reset the counter (this was a deload/rest week)
        weeks.clear();
      }
    }
    // ISO week key: YYYY-Www
    const jan4 = new Date(date.getFullYear(), 0, 4);
    const week = Math.ceil(((date.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7);
    weeks.add(`${date.getFullYear()}-W${week}`);
    lastDate = date;
  }

  const weeksTraining = weeks.size;
  return { due: weeksTraining >= deloadEveryWeeks, weeksTraining };
}
