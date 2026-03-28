/**
 * Personal preferences config.
 *
 * Change values here — the app adapts everywhere.
 * No UI needed for settings that don't change day-to-day.
 */

export const config = {
  // ─── Units ──────────────────────────────────────────────────────────────────

  units: {
    /** Weight plates, dumbbells, barbells, bodyweight */
    weight: "kg" as "kg" | "lbs",

    /** Carries, sled pushes */
    distance: "m" as "m" | "ft",

    /** Body measurements (waist, chest, etc.) */
    bodyMeasurement: "cm" as "cm" | "in",

    /** Bodyweight */
    bodyWeight: "kg" as "kg" | "lbs",
  },

  // ─── Locale ─────────────────────────────────────────────────────────────────

  locale: "en-GB",
  timezone: "Europe/London",

  // ─── Bodyweight ─────────────────────────────────────────────────────────────

  /** Used to calculate farmer carry targets (e.g. 50% BW) */
  bodyWeightKg: 103,

  // ─── Progression defaults ───────────────────────────────────────────────────

  progression: {
    /** Default weight increment for upper body exercises */
    upperBodyStepKg: 2.5,
    /** Default weight increment for lower body exercises */
    lowerBodyStepKg: 5,
  },

  // ─── Rest timer presets (seconds) ───────────────────────────────────────────

  restTimerPresets: [60, 90, 120, 180] as const,

  // ─── Nutrition targets ──────────────────────────────────────────────────────

  nutrition: {
    /** Daily calorie target */
    caloriesTarget: 2400,
    /** Daily protein target in grams */
    proteinTargetG: 180,
    /** Daily carbs target in grams */
    carbsTargetG: 250,
    /** Daily fat target in grams */
    fatTargetG: 80,
    /** Daily water target in glasses (250ml each) */
    waterTargetGlasses: 8,
  },

  // ─── Programme cycle ────────────────────────────────────────────────────────

  /** Deload every N weeks */
  deloadEveryWeeks: 4,
  /** Reduce load by this fraction on deload week */
  deloadFactor: 0.6,
} as const;

// ─── Display helpers ──────────────────────────────────────────────────────────

export function formatWeight(kg: number): string {
  if (config.units.weight === "lbs") {
    return `${Math.round(kg * 2.20462)} lbs`;
  }
  return `${kg} kg`;
}

export function formatDistance(metres: number): string {
  if (config.units.distance === "ft") {
    return `${Math.round(metres * 3.28084)} ft`;
  }
  return `${metres} m`;
}

export function formatBodyMeasurement(cm: number): string {
  if (config.units.bodyMeasurement === "in") {
    return `${(cm / 2.54).toFixed(1)}"`;
  }
  return `${cm} cm`;
}

/** Weight input placeholder — shows the unit so the user never has to think */
export const weightPlaceholder = config.units.weight === "kg" ? "kg" : "lbs";
export const distancePlaceholder = config.units.distance === "m" ? "m" : "ft";
