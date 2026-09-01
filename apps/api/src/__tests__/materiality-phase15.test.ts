import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 15 Materiality Calculation & Risk Assessment API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let tenantBToken: string;
  let tenantBId: string;
  let engagementId: string;
  let materialityId: string;
  let riskAssessmentId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase15_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase15 Audit Manager",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-mat-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Client & Engagement
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-MAT-${Date.now()}`,
        name: "Square Pharmaceuticals Ltd",
        clientType: "corporate",
      });

    const engRes = await request(app)
      .post("/api/v1/engagements")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId: clientRes.body.data.id,
        engagementCode: `ENG-MAT-${Date.now()}`,
        title: "Statutory Audit FY 2025",
        engagementType: "statutory_audit",
        financialYear: "FY 2025",
        startDate: "2026-01-01T00:00:00.000Z",
      });
    engagementId = engRes.body.data.id;

    // 3. Tenant B for isolation testing
    const tenantBEmail = `tenantb_phase15_${Date.now()}@avenquis.local`;
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
        name: "Chowdhury Audit Associates",
        slug: `chowdhury-mat-${Date.now()}`,
      });
    tenantBId = tenantBRes.body.data.tenant.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Materiality Calculation Engine (ISA 320)", () => {
    it("should calculate overall materiality, performance materiality, and CTT", async () => {
      const res = await request(app)
        .post("/api/v1/audit/materiality")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          benchmark: "total_revenue",
          benchmarkAmount: 10000000, // BDT 1 crore
          percentageApplied: 500, // 5%
          performanceMaterialityPct: 7500, // 75%
          clearlyTrivialPct: 500, // 5%
          rationale:
            "Revenue selected as benchmark per ISA 320 for commercial entity",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      materialityId = data.id;

      // 10,000,000 × 5% = 500,000
      expect(data.overallMateriality).toBe(500000);
      // 500,000 × 75% = 375,000
      expect(data.performanceMateriality).toBe(375000);
      // 500,000 × 5% = 25,000
      expect(data.clearlyTrivialThreshold).toBe(25000);
      expect(data.benchmark).toBe("total_revenue");
    });

    it("should retrieve latest materiality for engagement", async () => {
      const res = await request(app)
        .get(`/api/v1/audit/materiality?engagementId=${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(materialityId);
      expect(res.body.data.overallMateriality).toBe(500000);
    });
  });

  describe("2. Audit Risk Assessment Framework (ISA 315/330)", () => {
    it("should create risk assessment with ISA risk matrix calculation", async () => {
      const res = await request(app)
        .post("/api/v1/audit/risks")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          areaName: "Revenue Recognition",
          assertion: "occurrence",
          inherentRisk: "high",
          controlRisk: "medium",
          riskDescription:
            "Revenue recognition risk due to multiple performance obligations and percentage-of-completion contracts",
          responseStrategy:
            "Extended substantive procedures, 100% testing of large revenue transactions above PM threshold",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      riskAssessmentId = data.id;
      expect(riskAssessmentId).toBeDefined();

      // High IR × Medium CR = Significant combined risk
      expect(data.combinedRiskLevel).toBe("significant");
      // Significant combined → Low detection risk required
      expect(data.detectionRiskRequired).toBe("low");
    });

    it("should create a second risk assessment for inventory", async () => {
      const res = await request(app)
        .post("/api/v1/audit/risks")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          areaName: "Inventory Valuation",
          assertion: "valuation",
          inherentRisk: "medium",
          controlRisk: "low",
          riskDescription: "Inventory valuation risk for raw material and WIP",
          responseStrategy:
            "Analytical procedures and sample-based NRV testing",
        });

      expect(res.status).toBe(201);

      // Medium IR × Low CR = Low combined risk
      expect(res.body.data.combinedRiskLevel).toBe("low");
      // Low combined → High detection risk (less testing needed)
      expect(res.body.data.detectionRiskRequired).toBe("high");
    });

    it("should list all risk assessments for engagement", async () => {
      const res = await request(app)
        .get(`/api/v1/audit/risks?engagementId=${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it("should return risk matrix summary with counts by level", async () => {
      const res = await request(app)
        .get(`/api/v1/audit/risks/matrix?engagementId=${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);

      const summary = res.body.data.summary;
      expect(summary.totalRisks).toBe(2);
      expect(summary.significantRisks).toBe(1);
      expect(summary.lowRisks).toBe(1);
      expect(summary.byAssertion.occurrence).toBe(1);
      expect(summary.byAssertion.valuation).toBe(1);
    });
  });

  describe("3. Multi-Tenant Isolation", () => {
    it("should prevent Tenant B from accessing Tenant A materiality", async () => {
      const res = await request(app)
        .get(`/api/v1/audit/materiality?engagementId=${engagementId}`)
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("MATERIALITY_NOT_FOUND");
    });

    it("should return empty risk list for Tenant B querying Tenant A engagement", async () => {
      const res = await request(app)
        .get(`/api/v1/audit/risks?engagementId=${engagementId}`)
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });
});
