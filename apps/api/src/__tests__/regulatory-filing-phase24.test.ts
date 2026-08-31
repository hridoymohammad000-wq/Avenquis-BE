import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 24 Regulatory Filings API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let engagementId: string;
  let filingId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase24_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase24 Audit Partner",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-reg-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Client & Engagement
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-REG-${Date.now()}`,
        name: "Delta Corp",
        clientType: "corporate",
      });

    const engRes = await request(app)
      .post("/api/v1/engagements")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId: clientRes.body.data.id,
        engagementCode: `ENG-REG-${Date.now()}`,
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

  it("should create a pending FRC filing", async () => {
    const res = await request(app)
      .post("/api/v1/compliance/filings")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        engagementId,
        regulator: "FRC",
        filingType: "Audit Report Submission",
        documentUrl: "https://avenquis-storage.local/frc-audit-report.pdf",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    filingId = res.body.data.id;
    expect(filingId).toBeDefined();
    expect(res.body.data.status).toBe("pending");
  });

  it("should update filing status to submitted", async () => {
    const res = await request(app)
      .patch(`/api/v1/compliance/filings/${filingId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        status: "submitted",
        referenceNumber: "FRC-ACK-2025-09-01-XYZ",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("submitted");
    expect(res.body.data.referenceNumber).toBe("FRC-ACK-2025-09-01-XYZ");
    expect(res.body.data.submittedByMembershipId).toBeDefined();
  });

  it("should retrieve regulatory filings for the engagement", async () => {
    const res = await request(app)
      .get(`/api/v1/compliance/filings?engagementId=${engagementId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].regulator).toBe("FRC");
  });
});
