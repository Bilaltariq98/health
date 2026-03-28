import { db } from "@/lib/db/client";
import { meals } from "@/lib/db/schema";
import { CreateMealSchema } from "@/lib/validators";
import { desc, eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const favourites = searchParams.get("favourites") === "true";

  let query = db.select().from(meals).$dynamic();
  if (date) query = query.where(eq(meals.date, date));
  if (favourites) query = query.where(eq(meals.isFavourite, true));

  const rows = await query.orderBy(desc(meals.loggedAt)).limit(100);
  return Response.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateMealSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [row] = await db.insert(meals).values(parsed.data).returning();
  return Response.json(row, { status: 201 });
}
