import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 10 Sign-off Workflow & Digital Certificates API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let tenantBToken: string;
  let tenantBId: string;
  let clientId: string;
  let engagementId: string;
  let certificateId: string;
  let verificationToken: string;

  beforeAll(async () => {
    // 1. Create Admin User & Tenant A
    const adminEmail = `admin_phase10_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase10 Audit Partner",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Rahman & Co Chartered Accountants",
        slug: `rahman-cert-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Create Client & Engagement in Tenant A
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-CERT-${Date.now()}`,
        name: "Grameenphone Ltd",
        clientType: "corporate",
        industry: "Telecommunications",
      });
    clientId = clientRes.body.data.id;

    const engRes = await request(app)
      .post("/api/v1/engagements")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId,
        engagementCode: `ENG-CERT-${Date.now()}`,
        title: "Statutory Financial Audit FY 2025",
        engagementType: "statutory_audit",
        financialYear: "FY 2025",
        startDate: "2026-01-01T00:00:00.000Z",
      });
    engagementId = engRes.body.data.id;

    // 3. Create Tenant B & Admin for multi-tenant isolation testing
    const tenantBEmail = `tenantb_phase10_${Date.now()}@avenquis.local`;
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
        slug: `haq-cert-${Date.now()}`,
      });
    tenantBId = tenantBRes.body.data.tenant.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Partner & Manager Sign-off Workflow", () => {
    it("should log Audit Senior sign-off approval", async () => {
      const res = await request(app)
        .post("/api/v1/certificates/signoff")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          signoffRole: "audit_senior",
          action: "approved",
          comments: "Substantive testing completed, all review notes cleared",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.signoffRole).toBe("audit_senior");
      expect(res.body.data.signedHash).toHaveLength(64);
    });

    it("should log Lead Partner sign-off and transition engagement status to completed", async () => {
      const res = await request(app)
        .post("/api/v1/certificates/signoff")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          signoffRole: "lead_partner",
          action: "approved",
          comments: "Final audit report approved and signed",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify engagement status changed to completed
      const engRes = await request(app)
        .get(`/api/v1/engagements/${engagementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(engRes.body.data.status).toBe("completed");
    });
  });

  describe("2. Digital Audit Certificate Issuance & Cryptographic Seal", () => {
    it("should issue a digital audit certificate with cryptographic SHA-256 seal", async () => {
      const certNum = `AUD-CERT-${Date.now()}`;
      const res = await request(app)
        .post("/api/v1/certificates")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          certificateNumber: certNum,
          certificateType: "independent_auditors_report",
          title: "Independent Auditor's Report on Financial Statements",
          auditOpinion: "unmodified",
          summaryOpinionText:
            "In our opinion, the financial statements give a true and fair view of the financial position of Grameenphone Ltd as of December 31, 2025.",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.certificateNumber).toBe(certNum);
      expect(res.body.data.auditOpinion).toBe("unmodified");
      expect(res.body.data.digitalSealHash).toHaveLength(64);
      expect(res.body.data.verificationToken).toContain("AVQ-CERT-");

      certificateId = res.body.data.id;
      verificationToken = res.body.data.verificationToken;
    });

    it("should reject duplicate certificate number in same tenant", async () => {
      const dupRes = await request(app)
        .post("/api/v1/certificates")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          certificateNumber: "CERT-DUP-001",
          certificateType: "tax_clearance_certificate",
          title: "First Certificate",
          auditOpinion: "unmodified",
          summaryOpinionText: "Tax compliance audit statement",
        });

      expect(dupRes.status).toBe(201);

      const repeatRes = await request(app)
        .post("/api/v1/certificates")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          certificateNumber: "CERT-DUP-001",
          certificateType: "tax_clearance_certificate",
          title: "Second Certificate",
          auditOpinion: "unmodified",
          summaryOpinionText: "Duplicate tax compliance statement",
        });

      expect(repeatRes.status).toBe(409);
      expect(repeatRes.body.error.code).toBe("CERTIFICATE_NUMBER_EXISTS");
    });

    it("should get certificate details by ID for tenant", async () => {
      const res = await request(app)
        .get(`/api/v1/certificates/${certificateId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(certificateId);
      expect(res.body.data.clientName).toBe("Grameenphone Ltd");
      expect(res.body.data.auditLogs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("3. Public Certificate Verification Engine", () => {
    it("should verify digital certificate publicly via verification token without auth header", async () => {
      const res = await request(app).get(
        `/api/v1/certificates/verify/${verificationToken}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verified).toBe(true);
      expect(res.body.data.status).toBe("issued");
      expect(res.body.data.auditOpinion).toBe("unmodified");
      expect(res.body.data.clientName).toBe("Grameenphone Ltd");
      expect(res.body.data.digitalSealHash).toHaveLength(64);
    });
  });

  describe("4. Certificate Revocation Workflow", () => {
    it("should revoke digital certificate with reason", async () => {
      const res = await request(app)
        .patch(`/api/v1/certificates/${certificateId}/revoke`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          reason:
            "Client requested re-issuance due to restated financial note #14",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("revoked");

      // Verify public endpoint returns verified: false for revoked certificate
      const verifyRes = await request(app).get(
        `/api/v1/certificates/verify/${verificationToken}`,
      );

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.verified).toBe(false);
      expect(verifyRes.body.data.status).toBe("revoked");
      expect(verifyRes.body.data.revocationReason).toContain(
        "restated financial note",
      );
    });
  });

  describe("5. Multi-Tenant Isolation", () => {
    it("should prevent Tenant B from accessing Tenant A certificate profile", async () => {
      const res = await request(app)
        .get(`/api/v1/certificates/${certificateId}`)
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("CERTIFICATE_NOT_FOUND");
    });
  });
});
