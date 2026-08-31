import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 19 Completion & Reporting API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let engagementId: string;
  let checklistItemId: string;
  let reportId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase19_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase19 Audit Partner",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-rep-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Client & Engagement
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-REP-${Date.now()}`,
        name: "Beximco Ltd",
        clientType: "corporate",
      });

    const engRes = await request(app)
      .post("/api/v1/engagements")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId: clientRes.body.data.id,
        engagementCode: `ENG-REP-${Date.now()}`,
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

  describe("1. Audit Completion Checklist", () => {
    it("should add a checklist item", async () => {
      const res = await request(app)
        .post("/api/v1/audit/completion/checklist")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          category: "going_concern",
          item: "Obtain management representation letter regarding going concern.",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      checklistItemId = res.body.data.id;
      expect(res.body.data.isCompleted).toBe(false);
    });

    it("should mark checklist item as complete", async () => {
      const res = await request(app)
        .patch(`/api/v1/audit/completion/checklist/${checklistItemId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          isCompleted: true,
          comments: "MRL obtained and signed by MD on 2026-08-30.",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isCompleted).toBe(true);
      expect(res.body.data.completedAt).not.toBeNull();
    });

    it("should fetch completion checklist for engagement", async () => {
      const res = await request(app)
        .get(`/api/v1/audit/completion/checklist?engagementId=${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe("2. Audit Reporting", () => {
    it("should draft an audit report", async () => {
      const res = await request(app)
        .post("/api/v1/audit/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          reportType: "unqualified",
          opinionText:
            "In our opinion, the financial statements present fairly...",
          basisForOpinion: "We conducted our audit in accordance with ISA...",
          keyAuditMatters: "Revenue recognition was a key audit matter.",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      reportId = res.body.data.id;
      expect(res.body.data.status).toBe("draft");
    });

    it("should fetch the drafted report", async () => {
      const res = await request(app)
        .get(`/api/v1/audit/reports?engagementId=${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(reportId);
    });

    it("should digitally sign the audit report", async () => {
      const res = await request(app)
        .patch(`/api/v1/audit/reports/${reportId}/sign`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("signed");
      expect(res.body.data.signedAt).not.toBeNull();
    });
  });
});
