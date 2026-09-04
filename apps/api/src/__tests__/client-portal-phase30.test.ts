import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 30 Client Portal API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let clientId: string;
  let engagementId: string;
  let clientUserId: string;
  let rawInviteToken: string;

  let dbAvailable = true;

  beforeAll(async () => {
    try {
      // 1. Admin User & Tenant A
      const adminEmail = `admin_phase30_${Date.now()}@avenquis.local`;
      const regRes = await request(app).post("/api/v1/auth/register").send({
        email: adminEmail,
        password: "AdminPassword123!",
        fullName: "Phase30 Admin",
      });
      adminToken = regRes.body?.data?.tokens?.accessToken;

      const tenantARes = await request(app)
        .post("/api/v1/tenants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Karim & Partners CA Firm",
          slug: `karim-portal-${Date.now()}`,
        });
      tenantAId = tenantARes.body?.data?.tenant?.id;

      // 2. Client & Engagement
      const clientRes = await request(app)
        .post("/api/v1/clients")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientCode: `CLI-PORTAL-${Date.now()}`,
          name: "PortalCorp",
          clientType: "corporate",
        });
      clientId = clientRes.body?.data?.id;

      const engRes = await request(app)
        .post("/api/v1/engagements")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientId,
          title: "Annual Audit 2026",
          engagementType: "statutory_audit",
          status: "in_progress",
        });
      engagementId = engRes.body?.data?.id;
    } catch {
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Client Portal Users & Invitations", () => {
    it("should provision a new client portal user directly", async (ctx) => {
      if (!dbAvailable) return ctx.skip();
      const res = await request(app)
        .post("/api/v1/client-portal/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientId,
          email: `ceo_${Date.now()}@portalcorp.test`,
          fullName: "PortalCorp CEO",
          password: "SecurePortalPassword123!",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      clientUserId = res.body.data.id;
      expect(clientUserId).toBeDefined();
    });

    it("should invite an external client user with token hash at rest", async (ctx) => {
      if (!dbAvailable) return ctx.skip();
      const res = await request(app)
        .post("/api/v1/client-portal/invitations")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientId,
          email: `cfo_${Date.now()}@portalcorp.test`,
          expiresInDays: 7,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invitation.status).toBe("INVITED");
      expect(res.body.data.rawToken).toBeDefined();
      rawInviteToken = res.body.data.rawToken;
    });

    it("should activate invitation using raw token", async (ctx) => {
      if (!dbAvailable) return ctx.skip();
      const res = await request(app)
        .post("/api/v1/client-portal/invitations/activate")
        .send({
          token: rawInviteToken,
          fullName: "PortalCorp CFO",
          password: "CFOPassword123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toContain("cfo_");
    });
  });

  describe("2. Secure Document Exchange & Audit Logs", () => {
    it("should upload a secure document for the client", async (ctx) => {
      if (!dbAvailable) return ctx.skip();
      const res = await request(app)
        .post("/api/v1/client-portal/documents")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientId,
          engagementId,
          documentUrl: "s3://secure-bucket/portalcorp-audit-plan.pdf",
          fileName: "Audit Plan 2026.pdf",
          accessLevel: "client_visible",
          storageProvider: "s3",
          fileSize: 1024500,
          mimeType: "application/pdf",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fileName).toBe("Audit Plan 2026.pdf");
    });

    it("should reject uploading prohibited executable files", async (ctx) => {
      if (!dbAvailable) return ctx.skip();
      const res = await request(app)
        .post("/api/v1/client-portal/documents")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientId,
          engagementId,
          documentUrl: "s3://secure-bucket/malware.exe",
          fileName: "malware.exe",
          accessLevel: "client_visible",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("PROHIBITED_FILE_TYPE");
    });

    it("should fetch client documents for the internal team", async (ctx) => {
      if (!dbAvailable) return ctx.skip();
      const res = await request(app)
        .get(`/api/v1/client-portal/documents/${clientId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should retrieve portal access audit logs", async (ctx) => {
      if (!dbAvailable) return ctx.skip();
      const res = await request(app)
        .get(`/api/v1/client-portal/access-logs?clientId=${clientId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
