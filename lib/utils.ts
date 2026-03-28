import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format seconds as M:SS */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Format a date as "Tue 15 Jul" */
export function formatSessionDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Returns ISO date string for today: YYYY-MM-DD */
export function today(): string {
  return new Date().toISOString().split("T")[0];
}

/** Estimate 1RM using Epley formula: weight × (1 + reps/30) */
export function epley1RM(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30));
}
