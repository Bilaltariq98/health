import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * Turso/libSQL client.
 *
 * In production: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (Fly.io secrets).
 * In local dev: file:./local.db (no auth token needed).
 */
const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
