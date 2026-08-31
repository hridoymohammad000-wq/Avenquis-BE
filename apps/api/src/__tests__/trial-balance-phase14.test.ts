import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 14 Trial Balance Import & Multi-Standard Account Mapping API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let tenantBToken: string;
  let tenantBId: string;
  let clientId: string;
  let engagementId: string;
  let trialBalanceId: string;
  let lineItemIds: { [code: string]: string } = {};

  beforeAll(async () => {
    // 1. Create Admin User & Tenant A
    const adminEmail = `admin_phase14_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase14 Audit Senior",
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
        name: "Apex Footwear PLC",
        clientType: "corporate",
      });
    clientId = clientRes.body.data.id;

    const engRes = await request(app)
      .post("/api/v1/engagements")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId,
        engagementCode: `ENG-TB-${Date.now()}`,
        title: "Statutory Financial Audit FY 2025",
        engagementType: "statutory_audit",
        financialYear: "FY 2025",
        startDate: "2026-01-01T00:00:00.000Z",
      });
    engagementId = engRes.body.data.id;

    // 3. Create Tenant B & Admin for multi-tenant isolation testing
    const tenantBEmail = `tenantb_phase14_${Date.now()}@avenquis.local`;
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

  describe("1. Trial Balance Import & Debit/Credit Balancing", () => {
    it("should import a balanced trial balance with 4 line items", async () => {
      const res = await request(app)
        .post("/api/v1/trial-balances")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          name: "Unadjusted Trial Balance FY 2025",
          asOfDate: "2025-12-31T00:00:00.000Z",
          currency: "BDT",
          lineItems: [
            {
              accountCode: "1010",
              accountName: "Cash and Bank Balances",
              debitAmount: 50000,
              creditAmount: 0,
              priorYearBalance: 45000,
            },
            {
              accountCode: "1020",
              accountName: "Trade Receivables",
              debitAmount: 100000,
              creditAmount: 0,
              priorYearBalance: 80000,
            },
            {
              accountCode: "2010",
              accountName: "Trade Payables",
              debitAmount: 0,
              creditAmount: 60000,
              priorYearBalance: 55000,
            },
            {
              accountCode: "3010",
              accountName: "Share Capital",
              debitAmount: 0,
              creditAmount: 90000,
              priorYearBalance: 70000,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalDebit).toBe(150000);
      expect(res.body.data.totalCredit).toBe(150000);
      expect(res.body.data.isBalanced).toBe(true);
      expect(res.body.data.lineItemsCount).toBe(4);

      trialBalanceId = res.body.data.id;
      for (const item of res.body.data.lineItems) {
        lineItemIds[item.accountCode] = item.id;
      }
    });

    it("should list trial balances for engagement", async () => {
      const res = await request(app)
        .get(`/api/v1/trial-balances?engagementId=${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(trialBalanceId);
    });

    it("should get trial balance details by ID", async () => {
      const res = await request(app)
        .get(`/api/v1/trial-balances/${trialBalanceId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalItems).toBe(4);
      expect(res.body.data.unmappedCount).toBe(4);
    });
  });

  describe("2. Batch Line Item Mapping Engine", () => {
    it("should batch map line items to financial statement groups and lead schedules", async () => {
      const res = await request(app)
        .patch(`/api/v1/trial-balances/${trialBalanceId}/map`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          mappings: [
            {
              lineItemId: lineItemIds["1010"],
              mappedFinancialStatementGroup: "asset",
              mappedLeadSchedule: "cash_and_bank",
            },
            {
              lineItemId: lineItemIds["1020"],
              mappedFinancialStatementGroup: "asset",
              mappedLeadSchedule: "trade_receivables",
            },
            {
              lineItemId: lineItemIds["2010"],
              mappedFinancialStatementGroup: "liability",
              mappedLeadSchedule: "trade_payables",
            },
            {
              lineItemId: lineItemIds["3010"],
              mappedFinancialStatementGroup: "equity",
              mappedLeadSchedule: "share_capital",
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(4);

      // Verify unmapped count is now 0
      const tbRes = await request(app)
        .get(`/api/v1/trial-balances/${trialBalanceId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(tbRes.body.data.mappedCount).toBe(4);
      expect(tbRes.body.data.unmappedCount).toBe(0);
    });
  });

  describe("3. Lead Schedule Summary Aggregations", () => {
    it("should calculate lead schedule category subtotals", async () => {
      const res = await request(app)
        .get(`/api/v1/trial-balances/${trialBalanceId}/lead-schedules`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.schedules.length).toBe(4);

      const cashSched = res.body.data.schedules.find(
        (s: { leadSchedule: string }) => s.leadSchedule === "cash_and_bank",
      );
      expect(cashSched).toBeDefined();
      expect(cashSched.totalNetBalance).toBe(50000);

      const payablesSched = res.body.data.schedules.find(
        (s: { leadSchedule: string }) => s.leadSchedule === "trade_payables",
      );
      expect(payablesSched).toBeDefined();
      expect(payablesSched.totalNetBalance).toBe(-60000);
    });
  });

  describe("4. Multi-Tenant Isolation", () => {
    it("should prevent Tenant B from accessing Tenant A trial balance details", async () => {
      const res = await request(app)
        .get(`/api/v1/trial-balances/${trialBalanceId}`)
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("TRIAL_BALANCE_NOT_FOUND");
    });
  });
});
