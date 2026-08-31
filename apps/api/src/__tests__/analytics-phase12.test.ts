import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 12 Executive Dashboard, Analytics & Reporting API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let tenantBToken: string;
  let tenantBId: string;
  let clientId: string;
  let engagementId: string;

  beforeAll(async () => {
    // 1. Create Admin User & Tenant A
    const adminEmail = `admin_phase12_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase12 Managing Partner",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Rahman & Co Chartered Accountants",
        slug: `rahman-analytics-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Setup Client, Engagement, Task, Invoice, Payment, Working Paper & Certificate in Tenant A
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-ANA-${Date.now()}`,
        name: "LafargeHolcim Bangladesh PLC",
        clientType: "corporate",
      });
    clientId = clientRes.body.data.id;

    const engRes = await request(app)
      .post("/api/v1/engagements")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId,
        engagementCode: `ENG-ANA-${Date.now()}`,
        title: "Statutory Financial Audit FY 2025",
        engagementType: "statutory_audit",
        financialYear: "FY 2025",
        startDate: "2026-01-01T00:00:00.000Z",
      });
    engagementId = engRes.body.data.id;

    // Create task
    const taskRes = await request(app)
      .post("/api/v1/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        engagementId,
        title: "Test Internal Controls over Revenue",
      });

    // Mark task completed
    await request(app)
      .patch(`/api/v1/tasks/${taskRes.body.data.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        status: "completed",
        actualHours: 15,
      });

    // Log timesheet
    await request(app)
      .post("/api/v1/timesheets")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        engagementId,
        taskId: taskRes.body.data.id,
        workDate: "2026-02-15T00:00:00.000Z",
        hours: 8,
        activityType: "audit_fieldwork",
        description: "Controls testing documentation",
      });

    // Create Working Paper
    const wpRes = await request(app)
      .post("/api/v1/working-papers")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        engagementId,
        wpCode: "REV-100",
        section: "revenue",
        title: "Revenue Lead Schedule",
      });

    // Sign off Working Paper as prepared and approved
    await request(app)
      .post(`/api/v1/working-papers/${wpRes.body.data.id}/signoff`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({ action: "prepare" });

    await request(app)
      .post(`/api/v1/working-papers/${wpRes.body.data.id}/signoff`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({ action: "approve" });

    // Generate Invoice
    const invRes = await request(app)
      .post("/api/v1/billing/invoices")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId,
        engagementId,
        invoiceNumber: `INV-ANA-${Date.now()}`,
        amount: 100000,
        vatAmount: 15000,
        totalAmount: 115000,
        issueDate: "2026-02-01T00:00:00.000Z",
        dueDate: "2026-03-01T00:00:00.000Z",
      });

    // Record Payment
    await request(app)
      .post(`/api/v1/billing/invoices/${invRes.body.data.id}/payments`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        receiptNumber: `REC-ANA-${Date.now()}`,
        amount: 50000,
        paymentDate: "2026-02-10T00:00:00.000Z",
        paymentMethod: "bank_transfer",
      });

    // Issue Digital Certificate
    await request(app)
      .post("/api/v1/certificates")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        engagementId,
        certificateNumber: `AUD-ANA-${Date.now()}`,
        certificateType: "independent_auditors_report",
        title: "Independent Auditor's Report",
        auditOpinion: "unmodified",
        summaryOpinionText: "True and fair view statement for LafargeHolcim",
      });

    // 3. Create Tenant B & Admin for multi-tenant isolation testing
    const tenantBEmail = `tenantb_phase12_${Date.now()}@avenquis.local`;
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
        name: "Haq & Associates",
        slug: `haq-analytics-${Date.now()}`,
      });
    tenantBId = tenantBRes.body.data.tenant.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Executive Dashboard KPIs Aggregation", () => {
    it("should aggregate firm KPI metrics across all modules", async () => {
      const res = await request(app)
        .get("/api/v1/analytics/dashboard")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const kpi = res.body.data.kpiSummary;
      expect(kpi.totalClients).toBe(1);
      expect(kpi.totalEngagements).toBe(1);
      expect(kpi.totalRevenueBilled).toBe(115000);
      expect(kpi.totalRevenueCollected).toBe(50000);
      expect(kpi.outstandingBilling).toBe(65000);
      expect(kpi.totalLoggedHours).toBe(8);
      expect(kpi.certificatesIssuedCount).toBe(1);
      expect(res.body.data.certificatesByOpinion.unmodified).toBe(1);
      expect(res.body.data.workingPapersByStatus.approved).toBe(1);
    });
  });

  describe("2. Single Engagement Health Report", () => {
    it("should calculate completion rates and financial totals for engagement", async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/engagements/${engagementId}/health`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.engagementId).toBe(engagementId);
      expect(res.body.data.tasks.completionPercentage).toBe(100);
      expect(res.body.data.workingPapers.approvalPercentage).toBe(100);
      expect(res.body.data.billing.totalBilled).toBe(115000);
    });
  });

  describe("3. Multi-Tenant Isolation", () => {
    it("should isolate Tenant B from Tenant A executive dashboard KPIs", async () => {
      const res = await request(app)
        .get("/api/v1/analytics/dashboard")
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(200);
      expect(res.body.data.kpiSummary.totalClients).toBe(0);
      expect(res.body.data.kpiSummary.totalRevenueBilled).toBe(0);
      expect(res.body.data.kpiSummary.certificatesIssuedCount).toBe(0);
    });

    it("should prevent Tenant B from accessing Tenant A engagement health report", async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/engagements/${engagementId}/health`)
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ENGAGEMENT_NOT_FOUND");
    });
  });
});
