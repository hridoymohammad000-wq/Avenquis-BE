import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";
import { DvsService } from "../services/dvs.service.js";
import { TestDvsAdapter } from "../services/dvs/test-dvs.adapter.js";

describe("Phase 23 DVS API & Adapter Remediation", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let tenantBId: string;
  let engagementId: string;
  let unconfiguredDvsCode: string;
  let dbAvailable = true;

  beforeAll(async () => {
    try {
      // 1. Admin User & Tenant A
      const adminEmail = `admin_phase23_${Date.now()}@avenquis.local`;
      const regRes = await request(app).post("/api/v1/auth/register").send({
        email: adminEmail,
        password: "AdminPassword123!",
        fullName: "Phase23 Audit Partner",
      });
      if (regRes.status !== 201) {
        dbAvailable = false;
        return;
      }
      adminToken = regRes.body.data?.tokens?.accessToken;

      const tenantARes = await request(app)
        .post("/api/v1/tenants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Karim & Partners CA Firm",
          slug: `karim-dvs-${Date.now()}`,
        });
      tenantAId = tenantARes.body.data?.tenant?.id;

      // Tenant B (for cross-tenant security tests)
      const tenantBRes = await request(app)
        .post("/api/v1/tenants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Rahman & Co CA Firm",
          slug: `rahman-dvs-${Date.now()}`,
        });
      tenantBId = tenantBRes.body.data?.tenant?.id;

      // 2. Client & Engagement in Tenant A
      if (adminToken && tenantAId) {
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
            clientId: clientRes.body.data?.id,
            engagementCode: `ENG-DVS-${Date.now()}`,
            title: "Statutory Audit FY 2025",
            engagementType: "statutory_audit",
            financialYear: "FY 2025",
            startDate: "2026-01-01T00:00:00.000Z",
          });
        engagementId = engRes.body.data?.id;
      }
    } catch {
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    // Reset default adapter
    DvsService.setAdapter(new TestDvsAdapter());
    await closeDatabaseConnection();
  });

  it("1. Provider Not Configured: should generate explicit non-authoritative DVS code", async (ctx) => {
    if (!dbAvailable) {
      console.log("BLOCKED / PENDING (Live PostgreSQL connection required)");
      return ctx.skip();
    }
    DvsService.setAdapter(new TestDvsAdapter()); // Default unconfigured

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
    unconfiguredDvsCode = res.body.data.dvsCode;
    expect(unconfiguredDvsCode).toBeDefined();
    expect(res.body.data.isAuthoritative).toBe(false);
    expect(res.body.data.providerState).toBe("NOT_CONFIGURED");
    expect(res.body.data.verificationNote).toContain("unconfigured");
  });

  it("2. Authoritative vs Non-authoritative Result Semantics: should verify unconfigured record accurately", async (ctx) => {
    if (!dbAvailable) return ctx.skip();
    const res = await request(app)
      .get(`/api/v1/compliance/dvs/${unconfiguredDvsCode}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isAuthoritative).toBe(false);
    expect(res.body.data.providerState).toBe("NOT_CONFIGURED");
  });

  it("3. Provider Success: should return authoritative verification when live provider is active", async (ctx) => {
    if (!dbAvailable) return ctx.skip();
    const successAdapter = new TestDvsAdapter({
      apiUrl: "https://dvs.icab.org.bd/api",
      apiKey: "test-icab-api-key",
      mockMode: "SUCCESS",
    });

    const result = await DvsService.generateDvsCode(
      tenantAId,
      "membership-123",
      { engagementId, documentType: "Tax Audit Report" },
      successAdapter,
    );

    expect(result.isAuthoritative).toBe(true);
    expect(result.status).toBe("VERIFIED");
    expect(result.providerState).toBe("AVAILABLE");
    expect(result.providerReference).toBeDefined();
  });

  it("4. Provider Rejection: should handle explicit portal rejection", async (ctx) => {
    if (!dbAvailable) return ctx.skip();
    const rejectAdapter = new TestDvsAdapter({
      apiUrl: "https://dvs.icab.org.bd/api",
      apiKey: "test-icab-api-key",
      mockMode: "REJECT",
    });

    const result = await DvsService.generateDvsCode(
      tenantAId,
      "membership-123",
      { engagementId, documentType: "Special Audit" },
      rejectAdapter,
    );

    expect(result.isAuthoritative).toBe(true);
    expect(result.status).toBe("REJECTED");
    expect(result.failureReason).toContain("failed");
  });

  it("5. Request Timeout: should handle provider timeout gracefully", async (ctx) => {
    if (!dbAvailable) return ctx.skip();
    const timeoutAdapter = new TestDvsAdapter({
      apiUrl: "https://dvs.icab.org.bd/api",
      apiKey: "test-icab-api-key",
      mockMode: "TIMEOUT",
    });

    await expect(
      DvsService.generateDvsCode(
        tenantAId,
        "membership-123",
        { engagementId, documentType: "Audit Report" },
        timeoutAdapter,
      ),
    ).rejects.toThrow("DVS Provider request timed out");
  });

  it("6. Retryable Provider Failure: should handle HTTP 503 temporary outage", async (ctx) => {
    if (!dbAvailable) return ctx.skip();
    const retryableAdapter = new TestDvsAdapter({
      apiUrl: "https://dvs.icab.org.bd/api",
      apiKey: "test-icab-api-key",
      mockMode: "RETRYABLE_FAIL",
    });

    await expect(
      DvsService.generateDvsCode(
        tenantAId,
        "membership-123",
        { engagementId, documentType: "Audit Report" },
        retryableAdapter,
      ),
    ).rejects.toThrow("DVS Provider temporarily unavailable");
  });

  it("7. Non-Retryable Failure: should handle HTTP 400 bad request without retrying", async (ctx) => {
    if (!dbAvailable) return ctx.skip();
    const nonRetryableAdapter = new TestDvsAdapter({
      apiUrl: "https://dvs.icab.org.bd/api",
      apiKey: "test-icab-api-key",
      mockMode: "NON_RETRYABLE_FAIL",
    });

    await expect(
      DvsService.generateDvsCode(
        tenantAId,
        "membership-123",
        { engagementId, documentType: "Audit Report" },
        nonRetryableAdapter,
      ),
    ).rejects.toThrow("DVS Generation failed");
  });

  it("8. Cross-Tenant Access Rejection: Tenant B cannot verify or read Tenant A's DVS code", async (ctx) => {
    if (!dbAvailable) return ctx.skip();
    // Tenant B attempts to verify Tenant A's DVS code
    const res = await request(app)
      .get(`/api/v1/compliance/dvs/${unconfiguredDvsCode}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantBId);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
