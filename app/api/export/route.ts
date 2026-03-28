import { db } from "@/lib/db/client";
import { sessions, sets, meals, measurements, water } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";

  const [allSessions, allSets, allMeals, allMeasurements, allWater] = await Promise.all([
    db.select().from(sessions).orderBy(desc(sessions.startedAt)),
    db.select().from(sets).orderBy(desc(sets.completedAt)),
    db.select().from(meals).orderBy(desc(meals.loggedAt)),
    db.select().from(measurements).orderBy(desc(measurements.date)),
    db.select().from(water).orderBy(desc(water.date)),
  ]);

  const payload = { sessions: allSessions, sets: allSets, meals: allMeals, measurements: allMeasurements, water: allWater };

  if (format === "json") {
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="health-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  }

  // CSV — one file per table, newline-separated
  function toCsv(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
      ),
    ];
    return lines.join("\n");
  }

  const csv = [
    "=== SESSIONS ===",
    toCsv(allSessions as Record<string, unknown>[]),
    "\n=== SETS ===",
    toCsv(allSets as Record<string, unknown>[]),
    "\n=== MEALS ===",
    toCsv(allMeals as Record<string, unknown>[]),
    "\n=== MEASUREMENTS ===",
    toCsv(allMeasurements as Record<string, unknown>[]),
    "\n=== WATER ===",
    toCsv(allWater as Record<string, unknown>[]),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="health-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
