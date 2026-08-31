import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 16 Audit Programs API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let engagementId: string;
  let riskAssessmentId: string;
  let programId: string;
  let procedureId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase16_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase16 Audit Manager",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-prog-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Client & Engagement
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-PROG-${Date.now()}`,
        name: "Square Pharmaceuticals Ltd",
        clientType: "corporate",
      });

    const engRes = await request(app)
      .post("/api/v1/engagements")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId: clientRes.body.data.id,
        engagementCode: `ENG-PROG-${Date.now()}`,
        title: "Statutory Audit FY 2025",
        engagementType: "statutory_audit",
        financialYear: "FY 2025",
        startDate: "2026-01-01T00:00:00.000Z",
      });
    engagementId = engRes.body.data.id;

    // 3. Risk Assessment (Phase 15 dependency)
    const riskRes = await request(app)
      .post("/api/v1/audit/risks")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        engagementId,
        areaName: "Cash and Cash Equivalents",
        assertion: "existence",
        inherentRisk: "medium",
        controlRisk: "low",
        riskDescription: "Existence of cash balances at year end",
      });
    riskAssessmentId = riskRes.body.data.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Audit Program Management", () => {
    it("should create a new audit program", async () => {
      const res = await request(app)
        .post("/api/v1/audit/programs")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          name: "Cash and Cash Equivalents",
          description: "Audit program for Section A - Cash",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      programId = data.id;

      expect(data.name).toBe("Cash and Cash Equivalents");
      expect(data.status).toBe("draft");
    });

    it("should list all audit programs for an engagement", async () => {
      const res = await request(app)
        .get(`/api/v1/audit/programs?engagementId=${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(programId);
    });
  });

  describe("2. Audit Procedures Mapping", () => {
    it("should add a procedure mapped to an assertion and risk", async () => {
      const res = await request(app)
        .post(`/api/v1/audit/programs/${programId}/procedures`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          riskAssessmentId,
          assertion: "existence",
          procedureText: "Obtain bank confirmations for all material bank accounts.",
          procedureType: "substantive",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      procedureId = res.body.data.id;

      expect(res.body.data.assertion).toBe("existence");
      expect(res.body.data.procedureType).toBe("substantive");
      expect(res.body.data.status).toBe("not_started");
    });

    it("should get audit program details with embedded procedures", async () => {
      const res = await request(app)
        .get(`/api/v1/audit/programs/${programId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(programId);
      expect(res.body.data.procedures).toBeDefined();
      expect(res.body.data.procedures.length).toBe(1);
      expect(res.body.data.procedures[0].id).toBe(procedureId);
    });
  });

  describe("3. Audit Execution (Procedure Updates)", () => {
    it("should update procedure status and add work paper reference", async () => {
      const res = await request(app)
        .patch(`/api/v1/audit/procedures/${procedureId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          status: "completed",
          workPaperReference: "A.1.1",
          results: "Confirmed balance agrees to general ledger. No exceptions.",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("completed");
      expect(res.body.data.workPaperReference).toBe("A.1.1");
      expect(res.body.data.results).toContain("Confirmed balance");
    });
  });
});
