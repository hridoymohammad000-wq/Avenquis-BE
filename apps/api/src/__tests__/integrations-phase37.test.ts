import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection, db, globalIntegrations } from "@avenquis/database";

describe("Phase 37 Advanced Integrations (Global ERP APIs)", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let testIntegrationId: string;
  let testTenantIntegrationId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase37_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase37 Admin",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "ERP Firm LLC",
        slug: `erp-firm-p37-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // Insert dummy integrations
    const [inserted] = await db
      .insert(globalIntegrations)
      .values({
        name: "Xero",
        slug: "xero",
        category: "ERP",
        isActive: true,
      })
      .returning();
      
    testIntegrationId = inserted.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Available Integrations", () => {
    it("should fetch all available global integrations", async () => {
      const res = await request(app)
        .get("/api/v1/integrations/available")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(
        res.body.data.some(
          (i: { slug: string }) => i.slug === "sap-erp",
        ),
      ).toBe(true);
    });
  });

  describe("2. Connect Tenant Integration", () => {
    it("should allow a tenant to connect to an integration", async () => {
      const res = await request(app)
        .post("/api/v1/integrations/tenant")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          integrationId: testIntegrationId,
          credentials: "encrypted_oauth_token_123",
          settings: { importAccounts: true },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.integrationId).toBe(testIntegrationId);
      expect(res.body.data.status).toBe("CONNECTED");
      
      testTenantIntegrationId = res.body.data.id;
    });

    it("should fetch the tenant's connected integrations", async () => {
      const res = await request(app)
        .get("/api/v1/integrations/tenant")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].slug).toBe("xero");
      expect(res.body.data[0].status).toBe("CONNECTED");
    });
  });

  describe("3. Integration Sync Logs", () => {
    it("should mock a sync event from ERP and log it", async () => {
      const res = await request(app)
        .post(`/api/v1/integrations/tenant/${testTenantIntegrationId}/sync`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.syncType).toBe("TRIAL_BALANCE_IMPORT");
      expect(res.body.data.status).toBe("SUCCESS");
      expect(res.body.data.recordsProcessed).toBe(150);
    });
  });
});
