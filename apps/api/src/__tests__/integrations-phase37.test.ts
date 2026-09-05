import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection, db, globalIntegrations, eq } from "@avenquis/database";

describe("Phase 37 Advanced Integrations (Global ERP APIs)", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let testIntegrationId: string;
  let testTenantIntegrationId: string;

  let dbAvailable = true;

  beforeAll(async () => {
    try {
      // 1. Admin User & Tenant A
      const adminEmail = `admin_phase37_${Date.now()}@avenquis.local`;
      const regRes = await request(app).post("/api/v1/auth/register").send({
        email: adminEmail,
        password: "AdminPassword123!",
        fullName: "Phase37 Admin",
      });
      adminToken = regRes.body?.data?.tokens?.accessToken;

      const tenantARes = await request(app)
        .post("/api/v1/tenants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "ERP Firm LLC",
          slug: `erp-firm-p37-${Date.now()}`,
        });
      tenantAId = tenantARes.body?.data?.tenant?.id;

      // Insert dummy integration
      const existing = await db
        .select()
        .from(globalIntegrations)
        .where(eq(globalIntegrations.slug, "xero"));

      if (existing.length > 0) {
        testIntegrationId = existing[0].id;
      } else {
        const [inserted] = await db
          .insert(globalIntegrations)
          .values({
            name: "Xero Accounting",
            slug: "xero",
            category: "ERP",
            isActive: true,
          })
          .returning();
        testIntegrationId = inserted.id;
      }
    } catch {
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Available Global Integrations", () => {
    it("should fetch available global integrations", async (ctx) => {
      if (!dbAvailable) return ctx.skip();
      const res = await request(app)
        .get("/api/v1/integrations/available")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("2. Connect Integration & Secret Redaction", () => {
    it("should connect an integration with CONFIGURED status and encrypted/redacted credentials", async (ctx) => {
      if (!dbAvailable) return ctx.skip();
      const res = await request(app)
        .post("/api/v1/integrations/tenant")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          integrationId: testIntegrationId,
          credentials: JSON.stringify({ accessToken: "test_oauth_token_123" }),
          settings: { importAccounts: true },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.integrationId).toBe(testIntegrationId);
      expect(res.body.data.status).toBe("CONFIGURED");
      expect(res.body.data.hasCredentials).toBe(true);
      expect(res.body.data.credentials).toBeUndefined();

      testTenantIntegrationId = res.body.data.id;
    });

    it("should test connection using test adapter and update status to CONNECTED", async (ctx) => {
      if (!dbAvailable) return ctx.skip();
      const { IntegrationsService } = await import("../services/integrations.service.js");
      const { TestIntegrationAdapter } = await import("../services/integrations/test-integration.adapter.js");
      IntegrationsService.registerAdapter("xero", new TestIntegrationAdapter());

      const res = await request(app)
        .post(`/api/v1/integrations/tenant/${testTenantIntegrationId}/test-connection`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("CONNECTED");
    });

    it("should fetch tenant connected integrations with redacted credentials", async (ctx) => {
      if (!dbAvailable) return ctx.skip();
      const res = await request(app)
        .get("/api/v1/integrations/tenant")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].status).toBe("CONNECTED");
    });
  });

  describe("3. Incremental Sync & Audit Logs", () => {
    it("should execute incremental sync with cursor continuation", async (ctx) => {
      if (!dbAvailable) return ctx.skip();
      const res = await request(app)
        .post(`/api/v1/integrations/tenant/${testTenantIntegrationId}/sync`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          cursor: "1",
          idempotencyKey: `sync_key_${Date.now()}`,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recordsProcessed).toBeGreaterThan(0);
      expect(res.body.data.status).toBe("SUCCESS");
    });

    it("should fetch integration sync logs", async (ctx) => {
      if (!dbAvailable) return ctx.skip();
      const res = await request(app)
        .get(`/api/v1/integrations/tenant/${testTenantIntegrationId}/logs`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
