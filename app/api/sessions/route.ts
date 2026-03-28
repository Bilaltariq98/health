import { db } from "@/lib/db/client";
import { sessions, sets } from "@/lib/db/schema";
import { CreateSessionSchema } from "@/lib/validators";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(sessions)
    .orderBy(desc(sessions.startedAt))
    .limit(50);
  return Response.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateSessionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [row] = await db.insert(sessions).values(parsed.data).returning();
  return Response.json(row, { status: 201 });
}
