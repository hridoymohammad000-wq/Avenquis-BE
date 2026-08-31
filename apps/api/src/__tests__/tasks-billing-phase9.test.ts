import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 9 Tasks, Timesheets & Billing API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let tenantBToken: string;
  let tenantBId: string;
  let clientId: string;
  let engagementId: string;
  let taskId: string;
  let timesheetId: string;
  let invoiceId: string;

  beforeAll(async () => {
    // 1. Create Admin User & Tenant A
    const adminEmail = `admin_phase9_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase9 Manager",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Rahman & Co Chartered Accountants",
        slug: `rahman-tb-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Create Client & Engagement in Tenant A
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-TB-${Date.now()}`,
        name: "Renata Limited",
        clientType: "corporate",
        industry: "Pharmaceuticals",
      });
    clientId = clientRes.body.data.id;

    const engRes = await request(app)
      .post("/api/v1/engagements")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId,
        engagementCode: `ENG-TB-${Date.now()}`,
        title: "Statutory Audit FY 2025-26",
        engagementType: "statutory_audit",
        financialYear: "FY 2025-26",
        startDate: "2026-01-01T00:00:00.000Z",
      });
    engagementId = engRes.body.data.id;

    // 3. Create Tenant B & Admin for multi-tenant isolation testing
    const tenantBEmail = `tenantb_phase9_${Date.now()}@avenquis.local`;
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
        slug: `haq-tb-${Date.now()}`,
      });
    tenantBId = tenantBRes.body.data.tenant.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Task Management", () => {
    it("should create an engagement task", async () => {
      const res = await request(app)
        .post("/api/v1/tasks")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          title: "Perform Inventory Physical Stock Count",
          description:
            "Attend year-end inventory counting at Dhamrai factory warehouse",
          priority: "high",
          dueDate: "2026-01-15T00:00:00.000Z",
          estimatedHours: 16,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(
        "Perform Inventory Physical Stock Count",
      );
      expect(res.body.data.status).toBe("todo");
      taskId = res.body.data.id;
    });

    it("should list tasks for engagement", async () => {
      const res = await request(app)
        .get(`/api/v1/tasks?engagementId=${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should update task status to completed with actual hours", async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${taskId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          status: "completed",
          actualHours: 14,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("completed");
      expect(res.body.data.actualHours).toBe(14);
    });
  });

  describe("2. Timesheet Logging & Approval Workflow", () => {
    it("should log daily timesheet entry", async () => {
      const res = await request(app)
        .post("/api/v1/timesheets")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          taskId,
          workDate: "2026-01-10T00:00:00.000Z",
          hours: 8,
          activityType: "audit_fieldwork",
          description: "Physical stock counting & sample verification",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hours).toBe(8);
      expect(res.body.data.status).toBe("submitted");
      timesheetId = res.body.data.id;
    });

    it("should list timesheets for tenant", async () => {
      const res = await request(app)
        .get("/api/v1/timesheets")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should approve timesheet entry", async () => {
      const res = await request(app)
        .patch(`/api/v1/timesheets/${timesheetId}/approve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          status: "approved",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("approved");
    });
  });

  describe("3. Invoicing & Payment Collection", () => {
    it("should create a client audit fee invoice", async () => {
      const invNum = `INV-${Date.now()}`;
      const res = await request(app)
        .post("/api/v1/billing/invoices")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientId,
          engagementId,
          invoiceNumber: invNum,
          amount: 500000,
          vatAmount: 75000,
          currency: "BDT",
          issueDate: "2026-01-15T00:00:00.000Z",
          dueDate: "2026-02-15T00:00:00.000Z",
          remarks: "First interim fee billing for FY 2025-26 statutory audit",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invoiceNumber).toBe(invNum);
      expect(res.body.data.amount).toBe(500000);
      expect(res.body.data.vatAmount).toBe(75000);
      expect(res.body.data.totalAmount).toBe(575000);
      expect(res.body.data.status).toBe("sent");
      invoiceId = res.body.data.id;
    });

    it("should reject duplicate invoice number in same tenant", async () => {
      const dupRes = await request(app)
        .post("/api/v1/billing/invoices")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientId,
          invoiceNumber: "INV-DUP-001",
          amount: 100000,
          issueDate: "2026-01-15T00:00:00.000Z",
          dueDate: "2026-02-15T00:00:00.000Z",
        });

      expect(dupRes.status).toBe(201);

      const repeatRes = await request(app)
        .post("/api/v1/billing/invoices")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientId,
          invoiceNumber: "INV-DUP-001",
          amount: 100000,
          issueDate: "2026-01-15T00:00:00.000Z",
          dueDate: "2026-02-15T00:00:00.000Z",
        });

      expect(repeatRes.status).toBe(409);
      expect(repeatRes.body.error.code).toBe("INVOICE_NUMBER_EXISTS");
    });

    it("should record partial payment and update invoice status to partially_paid", async () => {
      const res = await request(app)
        .post(`/api/v1/billing/invoices/${invoiceId}/payments`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          receiptNumber: `REC-${Date.now()}-1`,
          amount: 300000,
          paymentDate: "2026-01-20T00:00:00.000Z",
          paymentMethod: "bank_transfer",
          referenceNumber: "EFT-88992211",
          remarks: "Partial payment received via HSBC Bank transfer",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify invoice status updated to partially_paid
      const invList = await request(app)
        .get(`/api/v1/billing/invoices?clientId=${clientId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      const targetInv = invList.body.data.find(
        (i: { id: string }) => i.id === invoiceId,
      );
      expect(targetInv.paidAmount).toBe(300000);
      expect(targetInv.status).toBe("partially_paid");
    });

    it("should record final payment and update invoice status to paid", async () => {
      const res = await request(app)
        .post(`/api/v1/billing/invoices/${invoiceId}/payments`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          receiptNumber: `REC-${Date.now()}-2`,
          amount: 275000,
          paymentDate: "2026-01-25T00:00:00.000Z",
          paymentMethod: "bank_transfer",
          referenceNumber: "EFT-88992212",
          remarks: "Final balance payment received",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify invoice status updated to paid
      const invList = await request(app)
        .get(`/api/v1/billing/invoices?clientId=${clientId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      const targetInv = invList.body.data.find(
        (i: { id: string }) => i.id === invoiceId,
      );
      expect(targetInv.paidAmount).toBe(575000);
      expect(targetInv.status).toBe("paid");
    });
  });

  describe("4. Multi-Tenant Isolation", () => {
    it("should isolate Tenant B from Tenant A invoices", async () => {
      const res = await request(app)
        .get("/api/v1/billing/invoices")
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});
