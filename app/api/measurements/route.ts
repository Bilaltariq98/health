import { db } from "@/lib/db/client";
import { measurements } from "@/lib/db/schema";
import { CreateMeasurementSchema } from "@/lib/validators";
import { desc } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(measurements).orderBy(desc(measurements.date)).limit(100);
  return Response.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateMeasurementSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [row] = await db.insert(measurements).values(parsed.data).returning();
  return Response.json(row, { status: 201 });
}
