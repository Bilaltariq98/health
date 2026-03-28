import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Schema design notes:
 *
 * - exerciseId is the stable slug from lib/programme.ts (e.g. "trap-bar-deadlift").
 *   Never store the display name — names change, IDs don't.
 *
 * - movementPattern + muscleGroupsPrimary are denormalised onto each set at
 *   log time. This means progress charts can aggregate by pattern/muscle group
 *   even after the programme config changes — the historical record is self-contained.
 *
 * - programmeVersion (semver) is stored on each session so you can correlate
 *   strength gains with programme changes over time.
 *
 * - sessionIntent ("lower-push" | "upper-pull" | "full-body-power") is stored
 *   on the session, not derived, for the same reason.
 */

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // nanoid
  date: text("date").notNull(), // ISO date YYYY-MM-DD
  dayType: text("day_type").notNull(), // "tuesday" | "wednesday" | "friday"
  intent: text("intent").notNull(), // "lower-push" | "upper-pull" | "full-body-power"
  programmeVersion: text("programme_version").notNull(), // semver from lib/programme.ts
  startedAt: text("started_at").notNull(), // ISO datetime
  completedAt: text("completed_at"), // null = in progress
  durationSeconds: integer("duration_seconds"), // derived on completion
  notes: text("notes"),
});

// ─── Sets ─────────────────────────────────────────────────────────────────────

export const sets = sqliteTable("sets", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),

  // Stable exercise reference
  exerciseId: text("exercise_id").notNull(), // slug, e.g. "trap-bar-deadlift"
  exerciseName: text("exercise_name").notNull(), // display name at log time

  // Denormalised movement metadata — frozen at log time for historical queries
  movementPattern: text("movement_pattern").notNull(),
  muscleGroupPrimary: text("muscle_group_primary").notNull(),

  setNumber: integer("set_number").notNull(),

  // Logging fields — all optional; which ones are used depends on loggingMode
  reps: integer("reps"),
  weightKg: real("weight_kg"),
  distanceMetres: real("distance_metres"),
  durationSeconds: integer("duration_seconds"),
  side: text("side"), // "left" | "right" | null (for unilateral exercises)

  rpe: integer("rpe"), // 1–10, optional

  completedAt: text("completed_at").notNull(),
  notes: text("notes"),
});

// ─── Nutrition ────────────────────────────────────────────────────────────────

export const meals = sqliteTable("meals", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  name: text("name").notNull(),
  mealType: text("meal_type"), // "breakfast" | "lunch" | "dinner" | "snack"
  calories: integer("calories"),
  proteinG: real("protein_g"),
  carbsG: real("carbs_g"),
  fatG: real("fat_g"),
  recipeUrl: text("recipe_url"), // optional link to cook.bilaltariq.tech
  isFavourite: integer("is_favourite", { mode: "boolean" }).default(false),
  loggedAt: text("logged_at").notNull(),
  notes: text("notes"),
});

// ─── Body metrics ─────────────────────────────────────────────────────────────

export const measurements = sqliteTable("measurements", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  weightKg: real("weight_kg"),
  notes: text("notes"),
  measuredAt: text("measured_at").notNull(),
});

// ─── Water ────────────────────────────────────────────────────────────────────

export const water = sqliteTable("water", {
  id: text("id").primaryKey(),
  date: text("date").notNull().unique(), // one row per day
  glasses: integer("glasses").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

// ─── Analytics events (own your data) ────────────────────────────────────────

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // e.g. "session_started", "set_logged"
  properties: text("properties"), // JSON blob
  occurredAt: text("occurred_at").notNull(),
});
