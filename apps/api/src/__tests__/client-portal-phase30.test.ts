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

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase30_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase30 Admin",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-portal-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

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
    clientId = clientRes.body.data.id;

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
    engagementId = engRes.body.data.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Client Portal Users", () => {
    it("should provision a new client portal user", async () => {
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
      expect(res.body.data.passwordHash).toBeUndefined(); // Should be omitted
      clientUserId = res.body.data.id;
    });
  });

  describe("2. Secure Document Exchange", () => {
    it("should upload a secure document for the client", async () => {
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
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBeDefined();
    });

    it("should fetch client documents for the internal team", async () => {
      const res = await request(app)
        .get(`/api/v1/client-portal/documents/${clientId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].fileName).toBe("Audit Plan 2026.pdf");
    });
  });
});
