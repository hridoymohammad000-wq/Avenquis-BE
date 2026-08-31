import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
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
    ssl: env.NODE_ENV === "production"
      ? { rejectUnauthorized: true, ...(env.DATABASE_SSL_CA ? { ca: env.DATABASE_SSL_CA } : {}) }
      : false,
    onnotice: () => {},
  });

if (env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}

import * as schema from "./schema.js";

export const db = drizzle(conn, { schema });

export type TenantContext = { tenantId: string; membershipId?: string };

/** Execute tenant-owned work with transaction-local PostgreSQL RLS context. */
export async function withTenantContext<T>(
  context: TenantContext,
  callback: (tx: typeof db) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_tenant_id', ${context.tenantId}, true)`);
    await tx.execute(sql`select set_config('app.current_membership_id', ${context.membershipId ?? ""}, true)`);
    return callback(tx as typeof db);
  });
}

export async function closeDatabaseConnection() {
  if (conn) {
    await conn.end();
  }
}
