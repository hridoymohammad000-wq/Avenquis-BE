import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 8 Working Papers & Document Vault API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let tenantBToken: string;
  let tenantBId: string;
  let clientId: string;
  let engagementId: string;
  let wpId: string;
  let reviewNoteId: string;
  let docRequestId: string;

  beforeAll(async () => {
    // 1. Create Admin User & Tenant A
    const adminEmail = `admin_phase8_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase8 Audit Senior",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Rahman & Co Chartered Accountants",
        slug: `rahman-wp-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Create Client & Engagement in Tenant A
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-WP-${Date.now()}`,
        name: "Square Pharmaceuticals PLC",
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
        engagementCode: `ENG-WP-${Date.now()}`,
        title: "Statutory Audit FY 2025-26",
        engagementType: "statutory_audit",
        financialYear: "FY 2025-26",
        startDate: "2026-01-01T00:00:00.000Z",
      });
    engagementId = engRes.body.data.id;

    // 3. Create Tenant B & Admin for multi-tenant isolation testing
    const tenantBEmail = `tenantb_phase8_${Date.now()}@avenquis.local`;
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
        slug: `haq-wp-${Date.now()}`,
      });
    tenantBId = tenantBRes.body.data.tenant.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Working Paper Onboarding & Directory", () => {
    it("should create a new audit working paper", async () => {
      const res = await request(app)
        .post("/api/v1/working-papers")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          wpCode: "A-100",
          title: "Cash & Bank Balances Substantive Testing",
          section: "assets",
          fileUrl: "https://vault.avenquis.local/wp/a-100-cash.xlsx",
          remarks: "Verified bank reconciliations for all 12 accounts",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.wpCode).toBe("A-100");
      expect(res.body.data.section).toBe("assets");
      expect(res.body.data.status).toBe("draft");
      wpId = res.body.data.id;
    });

    it("should reject duplicate wpCode in same engagement", async () => {
      const dupRes = await request(app)
        .post("/api/v1/working-papers")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          wpCode: "A-100",
          title: "Duplicate Working Paper",
          section: "assets",
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe("WP_CODE_EXISTS");
    });

    it("should list working papers for engagement", async () => {
      const res = await request(app)
        .get(`/api/v1/working-papers?engagementId=${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].wpCode).toBe("A-100");
    });

    it("should get working paper details by ID", async () => {
      const res = await request(app)
        .get(`/api/v1/working-papers/${wpId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(wpId);
      expect(res.body.data.reviewNotes).toEqual([]);
    });
  });

  describe("2. Prepared / Reviewed Workflows", () => {
    it("should sign-off working paper as prepared", async () => {
      const res = await request(app)
        .post(`/api/v1/working-papers/${wpId}/signoff`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          action: "prepare",
          remarks: "Testing completed, ready for manager review",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("prepared");
      expect(res.body.data.preparedByMembershipId).toBeTruthy();
    });

    it("should sign-off working paper as approved by reviewer", async () => {
      const res = await request(app)
        .post(`/api/v1/working-papers/${wpId}/signoff`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          action: "approve",
          remarks: "Reviewed and approved",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("approved");
      expect(res.body.data.reviewedByMembershipId).toBeTruthy();
    });
  });

  describe("3. Review Notes Lifecycle", () => {
    it("should add a review note on working paper", async () => {
      const res = await request(app)
        .post(`/api/v1/working-papers/${wpId}/review-notes`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          content:
            "Please attach direct bank confirmation letter for HSBC Account #8899",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("open");
      reviewNoteId = res.body.data.id;
    });

    it("should mark review note as addressed", async () => {
      const res = await request(app)
        .patch(`/api/v1/working-papers/review-notes/${reviewNoteId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          action: "address",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("addressed");
    });

    it("should clear review note by reviewer", async () => {
      const res = await request(app)
        .patch(`/api/v1/working-papers/review-notes/${reviewNoteId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          action: "clear",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("cleared");
    });
  });

  describe("4. Client Document (PBC) Requests", () => {
    it("should create a client document request", async () => {
      const res = await request(app)
        .post("/api/v1/working-papers/requests")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          requestTitle: "Fixed Asset Register FY 2025-26",
          description:
            "Complete register with additions, disposals, and depreciation schedule",
          dueDate: "2026-02-15T00:00:00.000Z",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.requestTitle).toBe(
        "Fixed Asset Register FY 2025-26",
      );
      expect(res.body.data.status).toBe("pending");
      docRequestId = res.body.data.id;
    });

    it("should fulfill document request with uploaded file URL", async () => {
      const res = await request(app)
        .patch(`/api/v1/working-papers/requests/${docRequestId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          uploadedFileUrl:
            "https://vault.avenquis.local/pbc/fa-register-2026.xlsx",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("submitted");
      expect(res.body.data.uploadedFileUrl).toBe(
        "https://vault.avenquis.local/pbc/fa-register-2026.xlsx",
      );
    });
  });

  describe("5. Multi-Tenant Isolation", () => {
    it("should prevent Tenant B from accessing Tenant A working paper", async () => {
      const res = await request(app)
        .get(`/api/v1/working-papers/${wpId}`)
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("WORKING_PAPER_NOT_FOUND");
    });
  });
});
