import { z } from "zod";

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const CreateSessionSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionIndex: z.number().int().nonnegative(),
  preferredDay: z.string().min(1), // e.g. "Tuesday" — from config at log time
  intent: z.enum(["lower-push", "upper-pull", "full-body-power"]),
  programmeVersion: z.string().min(1),
  startedAt: z.string().datetime(),
  notes: z.string().optional(),
});

export const CompleteSessionSchema = z.object({
  completedAt: z.string().datetime(),
  durationSeconds: z.number().int().positive(),
  notes: z.string().optional(),
});

// ─── Sets ─────────────────────────────────────────────────────────────────────

export const CreateSetSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  exerciseId: z.string().min(1),
  exerciseName: z.string().min(1),
  movementPattern: z.string().min(1),
  muscleGroupPrimary: z.string().min(1),
  setNumber: z.number().int().positive(),
  reps: z.number().int().positive().optional(),
  weightKg: z.number().nonnegative().optional(),
  distanceMetres: z.number().positive().optional(),
  durationSeconds: z.number().int().positive().optional(),
  side: z.enum(["left", "right"]).optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  completedAt: z.string().datetime(),
  notes: z.string().optional(),
});

// ─── Meals ────────────────────────────────────────────────────────────────────

export const CreateMealSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().min(1).max(200),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  calories: z.number().int().nonnegative().optional(),
  proteinG: z.number().nonnegative().optional(),
  carbsG: z.number().nonnegative().optional(),
  fatG: z.number().nonnegative().optional(),
  recipeUrl: z.string().url().optional().or(z.literal("")),
  isFavourite: z.boolean().optional(),
  loggedAt: z.string().datetime(),
  notes: z.string().optional(),
});

export const UpdateMealSchema = CreateMealSchema.partial().omit({ id: true, loggedAt: true });

// ─── Measurements ─────────────────────────────────────────────────────────────

export const CreateMeasurementSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().positive().optional(),
  notes: z.string().optional(),
  measuredAt: z.string().datetime(),
});

// ─── Water ────────────────────────────────────────────────────────────────────

export const UpsertWaterSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  glasses: z.number().int().nonnegative().max(30),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateSession = z.infer<typeof CreateSessionSchema>;
// DayKey removed — sessions are now identified by sessionIndex, not day name
export type CompleteSession = z.infer<typeof CompleteSessionSchema>;
export type CreateSet = z.infer<typeof CreateSetSchema>;
export type CreateMeal = z.infer<typeof CreateMealSchema>;
export type UpdateMeal = z.infer<typeof UpdateMealSchema>;
export type CreateMeasurement = z.infer<typeof CreateMeasurementSchema>;
export type UpsertWater = z.infer<typeof UpsertWaterSchema>;
