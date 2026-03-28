import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.select({ count: sql<number>`count(*)` }).from(sessions);
    return Response.json({ status: "ok", db: "connected", ts: new Date().toISOString() });
  } catch (err) {
    return Response.json(
      { status: "error", db: "disconnected", error: String(err) },
      { status: 503 }
    );
  }
}
