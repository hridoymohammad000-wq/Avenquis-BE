import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 20 Permanent & Current Audit Files API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let clientId: string;
  let engagementId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase20_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase20 Audit Manager",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-files-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Client & Engagement
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-FILES-${Date.now()}`,
        name: "Acme Corp",
        clientType: "corporate",
      });
    clientId = clientRes.body.data.id;

    const engRes = await request(app)
      .post("/api/v1/engagements")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId,
        engagementCode: `ENG-FILES-${Date.now()}`,
        title: "Statutory Audit FY 2025",
        engagementType: "statutory_audit",
        financialYear: "FY 2025",
        startDate: "2026-01-01T00:00:00.000Z",
      });
    engagementId = engRes.body.data.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Permanent Audit File (PAF)", () => {
    it("should upload a PAF document", async () => {
      const res = await request(app)
        .post("/api/v1/audit/files")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientId,
          fileType: "PAF",
          category: "MoA",
          fileName: "Memorandum_of_Association.pdf",
          fileUrl: "https://avenquis-storage.local/moa.pdf",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fileType).toBe("PAF");
    });

    it("should list PAF documents for a client", async () => {
      const res = await request(app)
        .get(`/api/v1/audit/files/paf?clientId=${clientId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].category).toBe("MoA");
    });
  });

  describe("2. Current Audit File (CAF)", () => {
    it("should upload a CAF document", async () => {
      const res = await request(app)
        .post("/api/v1/audit/files")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientId,
          engagementId,
          fileType: "CAF",
          category: "Planning",
          fileName: "Audit_Strategy_Memo.pdf",
          fileUrl: "https://avenquis-storage.local/audit_strategy.pdf",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fileType).toBe("CAF");
    });

    it("should fail to upload a CAF if engagementId is missing", async () => {
      const res = await request(app)
        .post("/api/v1/audit/files")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientId,
          fileType: "CAF",
          category: "Planning",
          fileName: "Fail.pdf",
          fileUrl: "https://avenquis-storage.local/fail.pdf",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("MISSING_ENGAGEMENT_ID");
    });

    it("should list CAF documents for an engagement", async () => {
      const res = await request(app)
        .get(`/api/v1/audit/files/caf?engagementId=${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].category).toBe("Planning");
    });
  });
});
