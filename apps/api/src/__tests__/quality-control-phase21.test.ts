import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 21 Audit Quality Controls API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let engagementId: string;
  let qcItemId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase21_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase21 Quality Partner",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-qc-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Client & Engagement
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-QC-${Date.now()}`,
        name: "Alpha Corp",
        clientType: "corporate",
      });

    const engRes = await request(app)
      .post("/api/v1/engagements")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId: clientRes.body.data.id,
        engagementCode: `ENG-QC-${Date.now()}`,
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

  it("should add a new QC item to the engagement", async () => {
    const res = await request(app)
      .post("/api/v1/audit/quality-controls")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        engagementId,
        category: "independence",
        questionText: "Has the engagement team confirmed independence in accordance with ethical requirements?",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    qcItemId = res.body.data.id;
    expect(res.body.data.isCompliant).toBe(false);
  });

  it("should evaluate and mark the QC item as compliant", async () => {
    const res = await request(app)
      .patch(`/api/v1/audit/quality-controls/${qcItemId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        isCompliant: true,
        comments: "All team members signed the independence declaration.",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isCompliant).toBe(true);
    expect(res.body.data.evaluatedByMembershipId).not.toBeNull();
  });

  it("should retrieve QC items for the engagement", async () => {
    const res = await request(app)
      .get(`/api/v1/audit/quality-controls?engagementId=${engagementId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].category).toBe("independence");
  });
});
