import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 29 HR & Finance API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let membershipId: string;
  let engagementId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase29_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase29 Finance Admin",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-finance-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // Get current user's membership for this tenant
    const memRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${adminToken}`);

    membershipId = memRes.body.data.memberships.find(
      (m: { tenantId: string; id: string }) => m.tenantId === tenantAId,
    ).id;

    // 2. Client & Engagement
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-FIN-${Date.now()}`,
        name: "FinCorp",
        clientType: "corporate",
      });
    const clientId = clientRes.body.data.id;

    const engRes = await request(app)
      .post("/api/v1/engagements")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId,
        title: "Q4 Internal Audit",
        engagementType: "internal_audit",
        status: "in_progress",
      });
    engagementId = engRes.body.data.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. HR Payroll", () => {
    it("should create a payroll record for a staff member", async () => {
      const res = await request(app)
        .post("/api/v1/hr-finance/payroll")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          membershipId,
          monthYear: "Oct-2026",
          basicSalary: 40000,
          allowances: 10000,
          deductions: 2000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.netPay).toBe(48000); // 40000 + 10000 - 2000
    });

    it("should fetch staff payroll records", async () => {
      const res = await request(app)
        .get(`/api/v1/hr-finance/payroll?membershipId=${membershipId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].monthYear).toBe("Oct-2026");
    });
  });

  describe("2. Finance Expenses", () => {
    it("should log an expense against an engagement", async () => {
      const res = await request(app)
        .post("/api/v1/hr-finance/expenses")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          amount: 2500, // Say, 2500 BDT
          category: "travel",
          description: "Uber to client office for Q4 kickoff",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("pending");
    });

    it("should retrieve expenses for an engagement", async () => {
      const res = await request(app)
        .get(`/api/v1/hr-finance/expenses?engagementId=${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].category).toBe("travel");
    });
  });
});
