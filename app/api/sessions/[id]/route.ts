import { db } from "@/lib/db/client";
import { sessions, sets } from "@/lib/db/schema";
import { CompleteSessionSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
  if (!session) return Response.json({ error: "Not found" }, { status: 404 });

  const sessionSets = await db.select().from(sets).where(eq(sets.sessionId, id));
  return Response.json({ ...session, sets: sessionSets });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = CompleteSessionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [row] = await db
    .update(sessions)
    .set(parsed.data)
    .where(eq(sessions.id, id))
    .returning();
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(sessions).where(eq(sessions.id, id));
  return new Response(null, { status: 204 });
}
