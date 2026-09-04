import { describe, it, expect, afterAll } from "vitest";
import { db, closeDatabaseConnection, withTenantContext } from "../client.js";
import { eq, sql } from "drizzle-orm";
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
    await withTenantContext({ tenantId: tenantA.id }, async (tx) => {
      const tenantASettings = await tx.execute(
        sql`SELECT * FROM tenant_settings WHERE tenant_id = app.current_tenant_id()`,
      );
      expect(tenantASettings.length).toBe(1);
      expect(tenantASettings[0].tenant_id).toBe(tenantA.id);
    });

    // 4. Set request context to Tenant B inside a transaction -> Must NOT see Tenant A setting (RLS Isolation)
    await withTenantContext({ tenantId: tenantB.id }, async (tx) => {
      const tenantBSettings = await tx.execute(
        sql`SELECT * FROM tenant_settings WHERE tenant_id = app.current_tenant_id()`,
      );
      expect(tenantBSettings.length).toBe(0);
    });

    const contextAfterTransaction = await db.execute(
      sql`SELECT current_setting('app.current_tenant_id', true) AS tenant_id`,
    );
    expect(contextAfterTransaction[0].tenant_id).toBeFalsy();
  });

  it("should fail closed for invalid tenant context values", async () => {
    await expect(
      withTenantContext({ tenantId: "not-a-uuid" }, async () => undefined),
    ).rejects.toThrow("Invalid tenant context");
  });

  it("should reject cross-tenant reads and writes under RLS", async () => {
    const [tenantA] = await db
      .insert(tenants)
      .values({ name: "Tenant A", slug: `tenant-a-write-${Date.now()}` })
      .returning();
    const [tenantB] = await db
      .insert(tenants)
      .values({ name: "Tenant B", slug: `tenant-b-write-${Date.now()}` })
      .returning();

    await db.insert(tenantSettings).values({
      tenantId: tenantB.id,
      key: "isolated",
      value: { owner: "b" },
    });

    await withTenantContext({ tenantId: tenantA.id }, async () => {
      const visible = await db.select().from(tenantSettings);
      expect(visible).toHaveLength(0);
      await expect(
        db.insert(tenantSettings).values({
          tenantId: tenantB.id,
          key: "tampered",
          value: { owner: "a" },
        }),
      ).rejects.toBeDefined();
    });

    await db.delete(tenants).where(eq(tenants.id, tenantA.id));
    await db.delete(tenants).where(eq(tenants.id, tenantB.id));
  });

  it("preserves isolated context across concurrent requests", async () => {
    const [tenantA] = await db
      .insert(tenants)
      .values({ name: "Tenant A", slug: `tenant-a-concurrent-${Date.now()}` })
      .returning();
    const [tenantB] = await db
      .insert(tenants)
      .values({ name: "Tenant B", slug: `tenant-b-concurrent-${Date.now()}` })
      .returning();

    const [a, b] = await Promise.all([
      withTenantContext({ tenantId: tenantA.id }, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        const result = await db.execute(
          sql`select app.current_tenant_id() as tenant_id`,
        );
        return result[0].tenant_id;
      }),
      withTenantContext({ tenantId: tenantB.id }, async () => {
        const result = await db.execute(
          sql`select app.current_tenant_id() as tenant_id`,
        );
        return result[0].tenant_id;
      }),
    ]);

    expect(a).toBe(tenantA.id);
    expect(b).toBe(tenantB.id);
    const after = await db.execute(
      sql`select current_setting('app.current_tenant_id', true) as tenant_id`,
    );
    expect(after[0].tenant_id).toBeFalsy();

    await db.delete(tenants).where(eq(tenants.id, tenantA.id));
    await db.delete(tenants).where(eq(tenants.id, tenantB.id));
  });

  it("rolls back tenant work and cleans context after callback failure", async () => {
    const [tenant] = await db
      .insert(tenants)
      .values({
        name: "Rollback Tenant",
        slug: `tenant-rollback-${Date.now()}`,
      })
      .returning();

    await expect(
      withTenantContext({ tenantId: tenant.id }, async () => {
        await db.insert(tenantSettings).values({
          tenantId: tenant.id,
          key: "rolled-back",
          value: { shouldExist: false },
        });
        throw new Error("force rollback");
      }),
    ).rejects.toThrow("force rollback");

    const after = await db.execute(
      sql`select current_setting('app.current_tenant_id', true) as tenant_id`,
    );
    expect(after[0].tenant_id).toBeFalsy();
    await db.delete(tenants).where(eq(tenants.id, tenant.id));
  });
});
