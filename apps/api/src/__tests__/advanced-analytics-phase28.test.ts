import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 28 Advanced Analytics API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let membershipId: string;
  let engagementId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase28_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase28 Admin",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-analytics-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // Get current user's membership for this tenant
    const memRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${adminToken}`);

    membershipId = memRes.body.data.memberships.find(
      (m: any) => m.tenantId === tenantAId,
    ).id;

    // 2. Client & Engagement
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-AN-${Date.now()}`,
        name: "DataCorp",
        clientType: "corporate",
      });
    const clientId = clientRes.body.data.id;

    const engRes = await request(app)
      .post("/api/v1/engagements")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId,
        title: "Q3 Advisory",
        engagementType: "advisory",
        status: "in_progress",
      });
    engagementId = engRes.body.data.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Resource Allocations & Workload", () => {
    it("should allocate hours to a staff member", async () => {
      const res = await request(app)
        .post("/api/v1/analytics/advanced/allocations")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          membershipId,
          engagementId,
          allocatedHours: 40,
          startDate: "2026-10-01T00:00:00.000Z",
          endDate: "2026-10-07T23:59:59.000Z",
          notes: "First week heavy lifting.",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
    });

    it("should fetch staff workload", async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/advanced/workload/${membershipId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].allocatedHours).toBe(40);
    });
  });

  describe("2. Profitability", () => {
    it("should record profitability snapshot", async () => {
      const res = await request(app)
        .post("/api/v1/analytics/advanced/profitability")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          budgetedHours: 100,
          actualHours: 40,
          estimatedRevenue: 500000,
          actualCost: 150000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profitMarginPercent).toBe(70); // (500k-150k)/500k = 70%
    });

    it("should retrieve engagement profitability", async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/advanced/profitability/${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].actualCost).toBe(150000);
    });
  });
});
