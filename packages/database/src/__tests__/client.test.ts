import { describe, it, expect, afterAll } from "vitest";
import { db, closeDatabaseConnection } from "../client.js";
import { sql } from "drizzle-orm";
import { tenants, tenantSettings } from "../schema.js";

describe("Database Client & Multi-Tenant RLS Integration", () => {
  afterAll(async () => {
    await closeDatabaseConnection();
  });

  it("should connect to the database and execute a basic query", async () => {
    const result = await db.execute(sql`SELECT 1 as healthy`);
    expect(result).toBeDefined();
    expect(result[0].healthy).toBe(1);
  });

  it("should enforce Row Level Security (RLS) tenant data isolation", async () => {
    // 1. Create two distinct tenants (Tenant A and Tenant B)
    const [tenantA] = await db
      .insert(tenants)
      .values({ name: "Tenant Alpha", slug: `tenant-a-${Date.now()}` })
      .returning();

    const [tenantB] = await db
      .insert(tenants)
      .values({ name: "Tenant Beta", slug: `tenant-b-${Date.now()}` })
      .returning();

    // 2. Insert tenant setting for Tenant A
    await db.insert(tenantSettings).values({
      tenantId: tenantA.id,
      key: "theme",
      value: { color: "dark" },
    });

    // 3. Set request context to Tenant A inside a transaction -> Should be able to query Tenant A setting
    await db.transaction(async (tx) => {
      await tx.execute(
        sql.raw(`SET LOCAL app.current_tenant_id = '${tenantA.id}'`),
      );
      const tenantASettings = await tx.execute(
        sql`SELECT * FROM tenant_settings WHERE tenant_id = app.current_tenant_id()`,
      );
      expect(tenantASettings.length).toBe(1);
      expect(tenantASettings[0].tenant_id).toBe(tenantA.id);
    });

    // 4. Set request context to Tenant B inside a transaction -> Must NOT see Tenant A setting (RLS Isolation)
    await db.transaction(async (tx) => {
      await tx.execute(
        sql.raw(`SET LOCAL app.current_tenant_id = '${tenantB.id}'`),
      );
      const tenantBSettings = await tx.execute(
        sql`SELECT * FROM tenant_settings WHERE tenant_id = app.current_tenant_id()`,
      );
      expect(tenantBSettings.length).toBe(0);
    });
  });
});
