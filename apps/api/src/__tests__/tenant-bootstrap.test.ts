import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  closeDatabaseConnection,
  db,
  memberships,
  tenants,
  userProfiles,
  withUserBootstrapContext,
  eq,
} from "@avenquis/database";
import { TenantService } from "../services/tenant.service.js";

describe("FORCE RLS tenant bootstrap", () => {
  const userId = randomUUID();
  const tenantId = randomUUID();

  afterAll(async () => {
    await withUserBootstrapContext({ userId }, async () => {
      await db.delete(tenants).where(eq(tenants.id, tenantId));
      await db.delete(userProfiles).where(eq(userProfiles.id, userId));
    });
    await closeDatabaseConnection();
  });

  it("discovers memberships before tenant context exists", async () => {
    await withUserBootstrapContext({ userId }, async () => {
      await db.insert(userProfiles).values({
        id: userId,
        email: `${userId}@test.invalid`,
        fullName: "Bootstrap User",
        status: "active",
      });
      await db.insert(tenants).values({
        id: tenantId,
        name: "Bootstrap Tenant",
        slug: `bootstrap-${userId}`,
        status: "active",
      });
      await db.insert(memberships).values({
        tenantId,
        userId,
        status: "active",
      });
    });

    const result = await TenantService.getUserMemberships(userId);
    expect(result).toHaveLength(1);
    expect(result[0].tenantId).toBe(tenantId);
  });

  it("validates the requested membership before tenant context exists", async () => {
    const result = await TenantService.validateTenantMembership(userId, tenantId);
    expect(result.membership.userId).toBe(userId);
    expect(result.tenant.id).toBe(tenantId);
  });
});
