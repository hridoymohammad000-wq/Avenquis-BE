import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 18 Exceptions & Review API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let engagementId: string;
  let procedureId: string;
  let exceptionId: string;
  let reviewId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase18_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase18 Audit Partner",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-ex-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Client & Engagement
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-EX-${Date.now()}`,
        name: "Square Pharmaceuticals Ltd",
        clientType: "corporate",
      });

    const engRes = await request(app)
      .post("/api/v1/engagements")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId: clientRes.body.data.id,
        engagementCode: `ENG-EX-${Date.now()}`,
        title: "Statutory Audit FY 2025",
        engagementType: "statutory_audit",
        financialYear: "FY 2025",
        startDate: "2026-01-01T00:00:00.000Z",
      });
    engagementId = engRes.body.data.id;

    // 3. Program & Procedure
    const progRes = await request(app)
      .post("/api/v1/audit/programs")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        engagementId,
        name: "Revenue",
      });

    const procRes = await request(app)
      .post(`/api/v1/audit/programs/${progRes.body.data.id}/procedures`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        assertion: "occurrence",
        procedureText: "Vouch sales invoices to dispatch notes.",
        procedureType: "substantive",
      });
    procedureId = procRes.body.data.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Exceptions & SUD Engine", () => {
    it("should raise a new audit exception", async () => {
      const res = await request(app)
        .post("/api/v1/audit/exceptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          procedureId,
          exceptionType: "misstatement",
          description: "Cut-off error: sales recorded in wrong period.",
          financialImpact: -50000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      exceptionId = res.body.data.id;
      expect(res.body.data.resolutionStatus).toBe("open");
    });

    it("should update exception status to unadjusted", async () => {
      const res = await request(app)
        .patch(`/api/v1/audit/exceptions/${exceptionId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          resolutionStatus: "unadjusted",
          managementResponse: "Immaterial, will adjust next year.",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resolutionStatus).toBe("unadjusted");
      expect(res.body.data.managementResponse).toBe(
        "Immaterial, will adjust next year."
      );
    });

    it("should calculate the SUD summary", async () => {
      const res = await request(app)
        .get(`/api/v1/audit/exceptions/sud?engagementId=${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUnadjustedImpact).toBe(-50000);
      expect(res.body.data.exceptions.length).toBeGreaterThan(0);
    });
  });

  describe("2. Review Engine", () => {
    it("should create a hot review", async () => {
      const res = await request(app)
        .post("/api/v1/audit/reviews")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          reviewType: "hot_review",
          findings: "Ensure all cut-off errors are logged in SUD.",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      reviewId = res.body.data.id;
      expect(res.body.data.status).toBe("in_progress");
    });

    it("should list reviews for an engagement", async () => {
      const res = await request(app)
        .get(`/api/v1/audit/reviews?engagementId=${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it("should allow reviewer to sign off the review", async () => {
      const res = await request(app)
        .patch(`/api/v1/audit/reviews/${reviewId}/signoff`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          status: "completed",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("completed");
      expect(res.body.data.signedOffAt).not.toBeNull();
    });
  });
});
