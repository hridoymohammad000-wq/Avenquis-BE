import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 23 DVS API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let engagementId: string;
  let dvsCode: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase23_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase23 Audit Partner",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-dvs-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Client & Engagement
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-DVS-${Date.now()}`,
        name: "Delta Corp",
        clientType: "corporate",
      });

    const engRes = await request(app)
      .post("/api/v1/engagements")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId: clientRes.body.data.id,
        engagementCode: `ENG-DVS-${Date.now()}`,
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

  it("should generate a DVS code for the engagement", async () => {
    const res = await request(app)
      .post("/api/v1/compliance/dvs")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        engagementId,
        documentType: "Audit Report",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    dvsCode = res.body.data.dvsCode;
    expect(dvsCode).toBeDefined();
    expect(res.body.data.status).toBe("generated");
  });

  it("should verify a valid DVS code", async () => {
    const res = await request(app)
      .get(`/api/v1/compliance/dvs/${dvsCode}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.engagementId).toBe(engagementId);
  });

  it("should fail to verify an invalid DVS code", async () => {
    const res = await request(app)
      .get(`/api/v1/compliance/dvs/INVALID-123`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("should retrieve DVS records for the engagement", async () => {
    const res = await request(app)
      .get(`/api/v1/compliance/dvs/engagement/${engagementId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].dvsCode).toBe(dvsCode);
  });
});
