import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";
import { RegulatoryFilingService } from "../services/regulatory-filing.service.js";
import { FrcAdapter } from "../services/regulatory/frc.adapter.js";
import { NbrAdapter } from "../services/regulatory/nbr.adapter.js";

describe("Phase 24 Regulatory Filings API & Adapter Remediation", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let tenantBId: string;
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

    // Tenant B (for cross-tenant security tests)
    const tenantBRes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Rahman & Co CA Firm",
        slug: `rahman-reg-${Date.now()}`,
      });
    tenantBId = tenantBRes.body.data.tenant.id;

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

  it("1. Provider Unavailable / Unconfigured: create filing with manual submission default", async () => {
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
    expect(res.body.data.status).toBe("DRAFT");
    expect(res.body.data.providerStatus).toBe("MANUAL_SUBMISSION");
    expect(res.body.data.submissionChannel).toBe("MANUAL_SUBMISSION");
  });

  it("2. Valid State Transitions: transition DRAFT -> READY_FOR_SUBMISSION -> SUBMITTED", async () => {
    // DRAFT -> READY_FOR_SUBMISSION
    const res1 = await request(app)
      .patch(`/api/v1/compliance/filings/${filingId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({ status: "READY_FOR_SUBMISSION" });

    expect(res1.status).toBe(200);
    expect(res1.body.data.status).toBe("READY_FOR_SUBMISSION");

    // READY_FOR_SUBMISSION -> SUBMITTED
    const res2 = await request(app)
      .patch(`/api/v1/compliance/filings/${filingId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        status: "SUBMITTED",
        referenceNumber: "FRC-ACK-2025-09-01-XYZ",
      });

    expect(res2.status).toBe(200);
    expect(res2.body.data.status).toBe("SUBMITTED");
    expect(res2.body.data.referenceNumber).toBe("FRC-ACK-2025-09-01-XYZ");
  });

  it("3. Invalid Transition Rejection: should reject invalid state transition ACCEPTED -> SUBMITTED", async () => {
    // First transition to ACCEPTED
    await request(app)
      .patch(`/api/v1/compliance/filings/${filingId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({ status: "ACCEPTED" });

    // Try invalid transition ACCEPTED -> SUBMITTED
    const res = await request(app)
      .patch(`/api/v1/compliance/filings/${filingId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({ status: "SUBMITTED" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_STATE_TRANSITION");
  });

  it("4. Idempotent Submission: should prevent duplicate filings when idempotency key matches", async () => {
    const key = `IDEM-REG-${Date.now()}`;

    const res1 = await request(app)
      .post("/api/v1/compliance/filings")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .set("x-idempotency-key", key)
      .send({
        engagementId,
        regulator: "NBR",
        filingType: "Corporate Income Tax Return",
      });

    expect(res1.status).toBe(201);

    const res2 = await request(app)
      .post("/api/v1/compliance/filings")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .set("x-idempotency-key", key)
      .send({
        engagementId,
        regulator: "NBR",
        filingType: "Corporate Income Tax Return",
      });

    expect(res2.status).toBe(201);
    expect(res2.body.data.id).toBe(res1.body.data.id);
    expect(res2.body.data.isDuplicateSubmission).toBe(true);
  });

  it("5. Manual Submission Path & Receipt Recording: record manual receipt for filing", async () => {
    // Create new filing for manual workflow
    const createRes = await request(app)
      .post("/api/v1/compliance/filings")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        engagementId,
        regulator: "BSEC",
        filingType: "Annual Governance Report",
      });

    const manualFilingId = createRes.body.data.id;

    // Record manual receipt
    const receiptRes = await request(app)
      .post(`/api/v1/compliance/filings/${manualFilingId}/manual-receipt`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        referenceNumber: "BSEC-MANUAL-REC-9981",
        status: "SUBMITTED",
      });

    expect(receiptRes.status).toBe(200);
    expect(receiptRes.body.data.status).toBe("SUBMITTED");
    expect(receiptRes.body.data.referenceNumber).toBe("BSEC-MANUAL-REC-9981");
  });

  it("6. Successful Provider Path: using test adapter", async () => {
    const successAdapter = new FrcAdapter({ mockMode: "SUCCESS" });
    const createRes = await RegulatoryFilingService.createFiling(
      tenantAId,
      "member-1",
      { engagementId, regulator: "FRC", filingType: "Audit Report" },
    );

    const submitRes = await RegulatoryFilingService.submitFiling(
      tenantAId,
      createRes.id,
      "member-1",
      { adapterOverride: successAdapter },
    );

    expect(submitRes.status).toBe("ACCEPTED");
    expect(submitRes.isExternalIntegration).toBe(true);
    expect(submitRes.referenceNumber).toBeDefined();
  });

  it("7. Provider Rejection: handle provider validation rejection", async () => {
    const rejectAdapter = new NbrAdapter({ mockMode: "REJECT" });
    const createRes = await RegulatoryFilingService.createFiling(
      tenantAId,
      "member-1",
      { engagementId, regulator: "NBR", filingType: "Tax Return" },
    );

    const submitRes = await RegulatoryFilingService.submitFiling(
      tenantAId,
      createRes.id,
      "member-1",
      { adapterOverride: rejectAdapter },
    );

    expect(submitRes.status).toBe("REJECTED");
    expect(submitRes.rejectionReason).toContain("NBR validation failed");
  });

  it("8. Retryable Provider Failure: handle gateway 503 outage", async () => {
    const retryableAdapter = new FrcAdapter({ mockMode: "RETRYABLE_FAIL" });
    const createRes = await RegulatoryFilingService.createFiling(
      tenantAId,
      "member-1",
      { engagementId, regulator: "FRC", filingType: "Audit Report" },
    );

    await expect(
      RegulatoryFilingService.submitFiling(
        tenantAId,
        createRes.id,
        "member-1",
        { adapterOverride: retryableAdapter },
      ),
    ).rejects.toThrow("Regulatory gateway temporarily unavailable");
  });

  it("9. Cross-Tenant Rejection: Tenant B cannot access Tenant A's filings", async () => {
    const res = await request(app)
      .get(`/api/v1/compliance/filings?engagementId=${engagementId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantBId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(0); // Tenant B sees zero filings for Tenant A's engagement
  });
});
