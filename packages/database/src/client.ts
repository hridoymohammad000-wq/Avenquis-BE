import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "./config/env.js";

// Global connection cache for development (e.g. HMR or testing)
// to prevent exhausting database connections.
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

// Create the connection securely without logging the URL
const conn =
  globalForDb.conn ??
  postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === "test" ? 1 : undefined,
  });

if (env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}

import * as schema from "./schema.js";

export const db = drizzle(conn, { schema });

export async function closeDatabaseConnection() {
  if (conn) {
    await conn.end();
  }
}
