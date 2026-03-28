import { db } from "@/lib/db/client";
import { water } from "@/lib/db/schema";
import { UpsertWaterSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { today } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? today();
  const [row] = await db.select().from(water).where(eq(water.date, date));
  return Response.json(row ?? { date, glasses: 0 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = UpsertWaterSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const now = new Date().toISOString();
  const [existing] = await db.select().from(water).where(eq(water.date, parsed.data.date));

  if (existing) {
    const [row] = await db
      .update(water)
      .set({ glasses: parsed.data.glasses, updatedAt: now })
      .where(eq(water.date, parsed.data.date))
      .returning();
    return Response.json(row);
  }

  const [row] = await db
    .insert(water)
    .values({ id: nanoid(), ...parsed.data, updatedAt: now })
    .returning();
  return Response.json(row, { status: 201 });
}
