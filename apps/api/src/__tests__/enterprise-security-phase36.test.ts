import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 36 Enterprise Security & Identity API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase36_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase36 Admin",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Security Firm LLC",
        slug: `sec-firm-p36-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. SSO Configuration", () => {
    it("should allow a tenant to configure SAML SSO", async () => {
      const res = await request(app)
        .post("/api/v1/security/sso")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          providerType: "saml",
          issuer: "https://okta.com/issuer",
          ssoUrl: "https://okta.com/sso",
          certificate: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.providerType).toBe("saml");
      expect(res.body.data.issuer).toBe("https://okta.com/issuer");
    });

    it("should fetch the tenant's SSO configuration", async () => {
      const res = await request(app)
        .get("/api/v1/security/sso")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.providerType).toBe("saml");
    });
  });

  describe("2. Enterprise Audit Logs", () => {
    it("should implicitly log the SSO configuration action in the audit log", async () => {
      const res = await request(app)
        .get("/api/v1/security/audit-logs")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      
      const log = res.body.data.find((l: any) => l.action === "CONFIGURE_SSO");
      expect(log).toBeDefined();
      expect(log.resourceType).toBe("SSO_PROVIDER");
    });
  });
});
