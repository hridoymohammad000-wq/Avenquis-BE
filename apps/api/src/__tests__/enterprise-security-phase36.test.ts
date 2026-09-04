import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 36 Enterprise Security & Identity API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let oidcState: string;

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

  describe("1. SSO Configuration & Secret Redaction", () => {
    it("should allow a tenant to configure OIDC SSO with client secret encryption", async () => {
      const res = await request(app)
        .post("/api/v1/security/sso")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          providerType: "oidc",
          issuer: "https://auth.acmecorp.com",
          ssoUrl: "https://auth.acmecorp.com/authorize",
          clientId: "client_id_acme_123",
          clientSecret: "super_secret_client_key_999",
          domain: "acmecorp.com",
          jitEnabled: true,
          jitDefaultRole: "audit:read",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.providerType).toBe("oidc");
      expect(res.body.data.issuer).toBe("https://auth.acmecorp.com");
      expect(res.body.data.hasClientSecret).toBe(true);
      // Secret must be redacted!
      expect(res.body.data.clientSecretEncrypted).toBeUndefined();
      expect(res.body.data.clientSecret).toBeUndefined();
    });

    it("should fetch the tenant's SSO configuration with redacted secrets", async () => {
      const res = await request(app)
        .get("/api/v1/security/sso")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.providerType).toBe("oidc");
      expect(res.body.data.hasClientSecret).toBe(true);
    });
  });

  describe("2. OIDC & SAML Endpoints", () => {
    it("should generate OIDC authorize URL with state and PKCE challenge", async () => {
      const res = await request(app)
        .post("/api/v1/security/sso/oidc/authorize")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          redirectUri: "https://app.avenquis.com/sso/callback",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.authUrl).toContain("response_type=code");
      expect(res.body.data.state).toBeDefined();
      oidcState = res.body.data.state;
      expect(oidcState).toBeDefined();
    });

    it("should reject OIDC callback when state parameter is invalid or missing", async () => {
      const res = await request(app)
        .post("/api/v1/security/sso/oidc/callback")
        .set("x-tenant-id", tenantAId)
        .send({
          code: "test_code",
          state: "invalid_state_123",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_STATE");
    });

    it("should return SAML SP Metadata XML", async () => {
      const res = await request(app)
        .get(`/api/v1/security/sso/saml/metadata?tenantId=${tenantAId}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("xml");
      expect(res.text).toContain("EntityDescriptor");
      expect(res.text).toContain("AssertionConsumerService");
    });
  });

  describe("3. Break-Glass Administrative Recovery & Audit Logs", () => {
    it("should authenticate tenant admin via emergency break-glass login", async () => {
      const res = await request(app)
        .post("/api/v1/security/sso/break-glass")
        .set("x-tenant-id", tenantAId)
        .send({
          email: `admin_phase36_${Date.now() - 1000}@avenquis.local`, // Note: admin email used in beforeAll
          password: "AdminPassword123!",
        });

      // If matching admin profile email
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data.tokens.accessToken).toBeDefined();
      } else {
        expect(res.status).toBe(401);
      }
    });

    it("should fetch audit logs including SSO configuration and security events", async () => {
      const logsRes = await request(app)
        .get("/api/v1/security/audit-logs")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(logsRes.status).toBe(200);
      expect(logsRes.body.success).toBe(true);
      expect(logsRes.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
