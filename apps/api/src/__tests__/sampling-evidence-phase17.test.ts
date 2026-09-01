import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 17 Sampling & Evidence API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let engagementId: string;
  let programId: string;
  let procedureId: string;
  let sampleId: string;
  let evidenceId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase17_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase17 Audit Manager",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-samp-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Client & Engagement
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-SAMP-${Date.now()}`,
        name: "Square Pharmaceuticals Ltd",
        clientType: "corporate",
      });

    const engRes = await request(app)
      .post("/api/v1/engagements")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId: clientRes.body.data.id,
        engagementCode: `ENG-SAMP-${Date.now()}`,
        title: "Statutory Audit FY 2025",
        engagementType: "statutory_audit",
        financialYear: "FY 2025",
        startDate: "2026-01-01T00:00:00.000Z",
      });
    engagementId = engRes.body.data.id;

    // 3. Program & Procedure (Phase 16 dependencies)
    const progRes = await request(app)
      .post("/api/v1/audit/programs")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        engagementId,
        name: "Inventory",
      });
    programId = progRes.body.data.id;

    const procRes = await request(app)
      .post(`/api/v1/audit/programs/${programId}/procedures`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        assertion: "existence",
        procedureText: "Perform physical inventory count.",
        procedureType: "substantive",
      });
    procedureId = procRes.body.data.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Statistical Sampling Engine", () => {
    it("should calculate sample size based on statistical parameters", async () => {
      const res = await request(app)
        .post("/api/v1/audit/sampling/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          populationSize: 1000,
          confidenceLevelPct: 9500, // 95% -> R-factor 3.0
          tolerableErrorPct: 500, // 5%
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Sample size = 3.0 / 0.05 = 60
      // Corrected: (60 * 1000) / (60 + 1000 - 1) ≈ 56.6 -> 57
      expect(res.body.data.sampleSize).toBe(57);
    });

    it("should save the sampling plan to the procedure", async () => {
      const res = await request(app)
        .post("/api/v1/audit/sampling")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          procedureId,
          populationSize: 1000,
          selectionMethod: "random",
          confidenceLevelPct: 9500,
          tolerableErrorPct: 500,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      sampleId = res.body.data.id;
      expect(sampleId).toBeDefined();
      expect(res.body.data.sampleSize).toBe(57);
      expect(res.body.data.selectionMethod).toBe("random");
    });
  });

  describe("2. Audit Evidence Vault", () => {
    it("should upload evidence metadata and link to a procedure", async () => {
      const res = await request(app)
        .post("/api/v1/audit/evidence")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          procedureId,
          fileName: "inventory_count_sheet.pdf",
          fileUrl: "https://avenquis-storage.local/inventory_count_sheet.pdf",
          referenceCode: "INV-1.1",
          description: "Signed inventory count sheet by warehouse manager.",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      evidenceId = res.body.data.id;
      expect(res.body.data.fileName).toBe("inventory_count_sheet.pdf");
      expect(res.body.data.referenceCode).toBe("INV-1.1");
    });

    it("should list all evidence for an engagement", async () => {
      const res = await request(app)
        .get(`/api/v1/audit/evidence?engagementId=${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(evidenceId);
    });

    it("should list evidence specifically for a procedure", async () => {
      const res = await request(app)
        .get(
          `/api/v1/audit/evidence?engagementId=${engagementId}&procedureId=${procedureId}`,
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].fileName).toBe("inventory_count_sheet.pdf");
    });
  });
});
