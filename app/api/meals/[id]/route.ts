import { db } from "@/lib/db/client";
import { meals } from "@/lib/db/schema";
import { UpdateMealSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateMealSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [row] = await db.update(meals).set(parsed.data).where(eq(meals.id, id)).returning();
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(meals).where(eq(meals.id, id));
  return new Response(null, { status: 204 });
}
