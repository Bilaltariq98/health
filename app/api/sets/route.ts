import { db } from "@/lib/db/client";
import { sets } from "@/lib/db/schema";
import { CreateSetSchema } from "@/lib/validators";
import { eq, desc } from "drizzle-orm";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateSetSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [row] = await db.insert(sets).values(parsed.data).returning();
  return Response.json(row, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const exerciseId = searchParams.get("exerciseId");
  const sessionId = searchParams.get("sessionId");

  let query = db.select().from(sets).$dynamic();
  if (sessionId) query = query.where(eq(sets.sessionId, sessionId));
  if (exerciseId) query = query.where(eq(sets.exerciseId, exerciseId));

  const rows = await query.orderBy(desc(sets.completedAt)).limit(200);
  return Response.json(rows);
}
