import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 7 Engagement Management & Auditing API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let tenantBToken: string;
  let tenantBId: string;
  let clientId: string;
  let engagementId: string;
  let partnerMembershipId: string;

  beforeAll(async () => {
    // 1. Create Admin User & Tenant A
    const adminEmail = `admin_phase7_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase7 Lead Partner",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Rahman & Co Chartered Accountants",
        slug: `rahman-eng-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;
    partnerMembershipId = tenantARes.body.data.membership.id;

    // 2. Create Client in Tenant A
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-ENG-${Date.now()}`,
        name: "Beximco Pharmaceuticals Ltd",
        clientType: "corporate",
        industry: "Pharmaceuticals",
      });
    clientId = clientRes.body.data.id;

    // 3. Create Tenant B & Admin for multi-tenant isolation testing
    const tenantBEmail = `tenantb_phase7_${Date.now()}@avenquis.local`;
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
        slug: `haq-eng-${Date.now()}`,
      });
    tenantBId = tenantBRes.body.data.tenant.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Engagement Onboarding & Setup", () => {
    it("should create a new statutory audit engagement", async () => {
      const code = `ENG-${Date.now()}`;
      const res = await request(app)
        .post("/api/v1/engagements")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientId,
          engagementCode: code,
          title: "Statutory Financial Statement Audit FY 2025-26",
          engagementType: "statutory_audit",
          financialYear: "FY 2025-26",
          startDate: "2026-01-01T00:00:00.000Z",
          endDate: "2026-06-30T00:00:00.000Z",
          budgetedHours: 400,
          budgetedFee: 1500000,
          currency: "BDT",
          engagementPartnerMembershipId: partnerMembershipId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.engagementCode).toBe(code);
      expect(res.body.data.status).toBe("planning");
      expect(res.body.data.independenceCleared).toBe(false);
      engagementId = res.body.data.id;
    });

    it("should reject duplicate engagement code in same tenant", async () => {
      const res = await request(app)
        .post("/api/v1/engagements")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientId,
          engagementCode: "ENG-DUP-001",
          title: "First Engagement",
          engagementType: "tax_advisory",
          financialYear: "2026",
          startDate: "2026-01-01T00:00:00.000Z",
        });

      expect(res.status).toBe(201);

      const dupRes = await request(app)
        .post("/api/v1/engagements")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientId,
          engagementCode: "ENG-DUP-001",
          title: "Second Engagement",
          engagementType: "tax_advisory",
          financialYear: "2026",
          startDate: "2026-01-01T00:00:00.000Z",
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe("ENGAGEMENT_CODE_EXISTS");
    });

    it("should list engagements with search filter", async () => {
      const res = await request(app)
        .get("/api/v1/engagements?search=Statutory")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].title).toContain("Statutory");
    });

    it("should get full engagement details by ID", async () => {
      const res = await request(app)
        .get(`/api/v1/engagements/${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(engagementId);
      expect(res.body.data.client.name).toBe("Beximco Pharmaceuticals Ltd");
      expect(res.body.data.teamMembers).toEqual([]);
      expect(res.body.data.independenceDeclarations).toEqual([]);
    });
  });

  describe("2. Team Allocation & Management", () => {
    it("should assign lead partner to engagement team", async () => {
      const res = await request(app)
        .post(`/api/v1/engagements/${engagementId}/team`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          membershipId: partnerMembershipId,
          role: "lead_partner",
          allocatedHours: 80,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe("lead_partner");
      expect(res.body.data.allocatedHours).toBe(80);
    });

    it("should display assigned team member in engagement details", async () => {
      const res = await request(app)
        .get(`/api/v1/engagements/${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.data.teamMembers.length).toBe(1);
      expect(res.body.data.teamMembers[0].role).toBe("lead_partner");
    });
  });

  describe("3. Independence Declarations & Workflow", () => {
    it("should submit clean independence declaration and clear engagement independence", async () => {
      const res = await request(app)
        .post(`/api/v1/engagements/${engagementId}/independence`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          hasFinancialInterest: false,
          hasPersonalRelationship: false,
          remarks:
            "Confirmed no financial interest or personal relationship with client",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.declarationStatus).toBe("cleared");

      // Verify engagement independenceCleared status updated
      const engRes = await request(app)
        .get(`/api/v1/engagements/${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(engRes.body.data.independenceCleared).toBe(true);
    });
  });

  describe("4. Status Lifecycle Transitions", () => {
    it("should update engagement status to fieldwork", async () => {
      const res = await request(app)
        .patch(`/api/v1/engagements/${engagementId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          status: "fieldwork",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("fieldwork");
    });
  });

  describe("5. Multi-Tenant Isolation", () => {
    it("should prevent Tenant B from accessing Tenant A engagement", async () => {
      const res = await request(app)
        .get(`/api/v1/engagements/${engagementId}`)
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ENGAGEMENT_NOT_FOUND");
    });
  });
});
