import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 13 System Administration, Security Audit Logs & Final V1 Hardening API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let tenantBToken: string;
  let tenantBId: string;

  beforeAll(async () => {
    // 1. Create Admin User & Tenant A
    const adminEmail = `admin_phase13_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase13 System Administrator",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Rahman & Co Chartered Accountants",
        slug: `rahman-admin-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Create Tenant B & Admin for multi-tenant isolation testing
    const tenantBEmail = `tenantb_phase13_${Date.now()}@avenquis.local`;
    const regBRes = await request(app).post("/api/v1/auth/register").send({
      email: tenantBEmail,
      password: "AdminPassword123!",
      fullName: "Tenant B Admin",
    });
    tenantBToken = regBRes.body.data.tokens.accessToken;

    const tenantBRes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${tenantBToken}`)
      .send({
        name: "Haq & Associates",
        slug: `haq-admin-${Date.now()}`,
      });
    tenantBId = tenantBRes.body.data.tenant.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. System Health Diagnostics", () => {
    it("should return system health metrics and connected services", async () => {
      const res = await request(app)
        .get("/api/v1/admin/system-health")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("healthy");
      expect(res.body.data.services.database).toBe("connected");
      expect(res.body.data.metrics.activeTenantsCount).toBeGreaterThanOrEqual(
        2,
      );
    });
  });

  describe("2. Security Events Audit Trail", () => {
    it("should list security audit logs for tenant", async () => {
      const res = await request(app)
        .get("/api/v1/admin/security-events")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("3. Feature Flags & Tenant Deployment Profile", () => {
    it("should get tenant deployment profile and feature flags", async () => {
      const res = await request(app)
        .get("/api/v1/admin/deployment-profile")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenantId).toBe(tenantAId);
      expect(res.body.data.deploymentTier).toBe("enterprise");
    });

    it("should enable a feature flag for tenant", async () => {
      const flagCode = `ai_assistant_${Date.now()}`;
      const toggleRes = await request(app)
        .patch("/api/v1/admin/feature-flags")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          code: flagCode,
          enabled: true,
        });

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.success).toBe(true);
      expect(toggleRes.body.data.code).toBe(flagCode);
      expect(toggleRes.body.data.enabled).toBe(true);

      // Re-fetch profile to verify flag is enabled
      const profRes = await request(app)
        .get("/api/v1/admin/deployment-profile")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      const flag = profRes.body.data.featureFlags.find(
        (f: { code: string }) => f.code === flagCode,
      );
      expect(flag).toBeDefined();
      expect(flag.enabled).toBe(true);
    });
  });

  describe("4. Multi-Tenant Isolation", () => {
    it("should isolate Tenant B from Tenant A security audit logs", async () => {
      const res = await request(app)
        .get("/api/v1/admin/security-events")
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("should isolate Tenant B deployment profile and feature flags", async () => {
      const res = await request(app)
        .get("/api/v1/admin/deployment-profile")
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(200);
      expect(res.body.data.tenantId).toBe(tenantBId);
      expect(res.body.data.featureFlags).toEqual([]);
    });
  });
});
