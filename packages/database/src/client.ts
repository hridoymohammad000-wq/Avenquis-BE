import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import { AsyncLocalStorage } from "node:async_hooks";
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
    ssl:
      env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: true,
            ...(env.DATABASE_SSL_CA ? { ca: env.DATABASE_SSL_CA } : {}),
          }
        : false,
    onnotice: () => {},
  });

if (env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}

import * as schema from "./schema.js";

const baseDb = drizzle(conn, { schema });

type TenantTransaction = { tx: typeof baseDb };
const tenantTransactionStorage = new AsyncLocalStorage<TenantTransaction>();

/** Route service queries through the active request transaction when present. */
export const db = new Proxy(baseDb, {
  get(target, property, receiver) {
    const scopedDb = tenantTransactionStorage.getStore()?.tx;
    return Reflect.get(scopedDb ?? target, property, receiver);
  },
}) as typeof baseDb;

export type TenantContext = { tenantId: string; membershipId?: string };
export type UserBootstrapContext = { userId: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Execute tenant-owned work with transaction-local PostgreSQL RLS context. */
export async function withTenantContext<T>(
  context: TenantContext,
  callback: (tx: typeof db) => Promise<T>,
): Promise<T> {
  if (!UUID_PATTERN.test(context.tenantId)) {
    throw new Error("Invalid tenant context");
  }
  if (context.membershipId && !UUID_PATTERN.test(context.membershipId)) {
    throw new Error("Invalid membership context");
  }
  return baseDb.transaction(async (tx) => {
    return tenantTransactionStorage.run(
      { tx: tx as typeof baseDb },
      async () => {
        await tx.execute(
          sql`select set_config('app.current_tenant_id', ${context.tenantId}, true)`,
        );
        await tx.execute(
          sql`select set_config('app.current_membership_id', ${context.membershipId ?? ""}, true)`,
        );
        return callback(tx as typeof db);
      },
    );
  });
}

/** Execute pre-tenant authentication work with a transaction-local user context. */
export async function withUserBootstrapContext<T>(
  context: UserBootstrapContext,
  callback: (tx: typeof db) => Promise<T>,
): Promise<T> {
  if (!UUID_PATTERN.test(context.userId)) {
    throw new Error("Invalid user bootstrap context");
  }
  return baseDb.transaction(async (tx) => {
    return tenantTransactionStorage.run(
      { tx: tx as typeof baseDb },
      async () => {
        await tx.execute(
          sql`select set_config('app.current_user_id', ${context.userId}, true)`,
        );
        return callback(tx as typeof db);
      },
    );
  });
}

export async function closeDatabaseConnection() {
  if (conn) {
    await conn.end();
  }
}
