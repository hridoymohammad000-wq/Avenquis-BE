import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import {
  db,
  userProfiles,
  tenants,
  memberships,
  closeDatabaseConnection,
  eq,
} from "@avenquis/database";

describe("Phase 3 Authentication, Authorization & Tenant Isolation API", () => {
  const app = createApp();

  const testEmail = `testuser_${Date.now()}@avenquis.local`;
  const testPassword = "Password123!Secure";
  let accessToken: string;
  let userId: string;
  let tenantId: string;
  let mfaSecret: string;
  let backupCodes: string[];

  afterAll(async () => {
    if (userId) {
      await db.delete(userProfiles).where(eq(userProfiles.id, userId));
    }
    if (tenantId) {
      await db.delete(tenants).where(eq(tenants.id, tenantId));
    }
    await closeDatabaseConnection();
  });

  describe("1. User Registration & Password Hashing", () => {
    it("should reject registration with weak password or invalid email", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "invalid-email",
        password: "short",
        fullName: "A",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should successfully register a new user and return tokens", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: testEmail,
        password: testPassword,
        fullName: "Avenquis Test User",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();

      userId = res.body.data.user.id;
      accessToken = res.body.data.tokens.accessToken;
    });

    it("should block duplicate email registration", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: testEmail,
        password: testPassword,
        fullName: "Duplicate User",
      });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("EMAIL_EXISTS");
    });
  });

  describe("2. User Authentication (Login / Logout / Profile)", () => {
    it("should reject invalid login credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testEmail,
        password: "WrongPassword!",
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("should successfully login with valid credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testEmail,
        password: testPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.aal).toBeUndefined();
      const { AuthService } = await import("../services/auth.service.js");
      await expect(
        AuthService.verifyAccessToken(res.body.data.tokens.accessToken),
      ).resolves.toMatchObject({ aal: "aal1" });
      accessToken = res.body.data.tokens.accessToken;
    });

    it("should fetch current authenticated user profile (/me)", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
    });

    it("should reject unauthenticated request to /me", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("3. Multi-Factor Authentication (MFA / TOTP & AAL Levels)", () => {
    it("should setup MFA and return TOTP secret & QR code", async () => {
      const res = await request(app)
        .post("/api/v1/auth/mfa/setup")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.secret).toBeDefined();
      expect(res.body.data.qrCode).toContain("data:image/png;base64");

      mfaSecret = res.body.data.secret;
    });

    it("should reject invalid TOTP verification code", async () => {
      const res = await request(app)
        .post("/api/v1/auth/mfa/verify")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ token: "000000" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_MFA_CODE");
    });

    it("should verify MFA with valid TOTP code and issue AAL2 token + backup codes", async () => {
      const { authenticator } = await import("otplib");
      const validCode = authenticator.generate(mfaSecret);

      const res = await request(app)
        .post("/api/v1/auth/mfa/verify")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ token: validCode });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.backupCodes).toHaveLength(8);
      expect(res.body.data.tokens.accessToken).toBeDefined();

      backupCodes = res.body.data.backupCodes;
      accessToken = res.body.data.tokens.accessToken;
    });

    it("subsequent login should indicate MFA is required (requireMfa: true)", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testEmail,
        password: testPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.requireMfa).toBe(true);

      const aal1Token = res.body.data.tokens.accessToken;
      const { AuthService } = await import("../services/auth.service.js");
      await expect(AuthService.verifyAccessToken(aal1Token)).resolves.toMatchObject({ aal: "aal1" });

      // Complete MFA challenge with a backup code
      const challengeRes = await request(app)
        .post("/api/v1/auth/mfa/challenge")
        .set("Authorization", `Bearer ${aal1Token}`)
        .send({ token: backupCodes[0] });

      expect(challengeRes.status).toBe(200);
      expect(challengeRes.body.success).toBe(true);
      expect(challengeRes.body.data.tokens.accessToken).toBeDefined();
      await expect(
        AuthService.verifyAccessToken(challengeRes.body.data.tokens.accessToken),
      ).resolves.toMatchObject({ aal: "aal2" });

      accessToken = challengeRes.body.data.tokens.accessToken;
    });
  });

  describe("4. Tenant Creation, Context Resolution & Isolation", () => {
    const slug = `acme-audit-${Date.now()}`;

    it("should create a tenant and set user as administrator", async () => {
      const res = await request(app)
        .post("/api/v1/tenants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Acme Audit Firm",
          slug,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenant.slug).toBe(slug);

      tenantId = res.body.data.tenant.id;
    });

    it("should list tenant in user memberships", async () => {
      const res = await request(app)
        .get("/api/v1/tenants")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(
        res.body.data.some(
          (m: { tenantId: string }) => m.tenantId === tenantId,
        ),
      ).toBe(true);
    });

    it("should successfully switch to valid tenant", async () => {
      const res = await request(app)
        .post("/api/v1/tenants/switch")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ tenantId });

      expect(res.status).toBe(200);
      expect(res.body.data.tenant.id).toBe(tenantId);
    });

    it("should reject switching to an unassociated tenant (IDOR prevention)", async () => {
      const fakeTenantId = "00000000-0000-0000-0000-000000000000";
      const res = await request(app)
        .post("/api/v1/tenants/switch")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ tenantId: fakeTenantId });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("TENANT_MEMBERSHIP_NOT_FOUND");
    });

    it("should require x-tenant-id header on tenant-scoped routes", async () => {
      const res = await request(app)
        .get("/api/v1/tenants/current")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("TENANT_HEADER_REQUIRED");
    });

    it("should resolve tenant context and wildcard permissions when x-tenant-id is provided", async () => {
      const res = await request(app)
        .get("/api/v1/tenants/current")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("x-tenant-id", tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.tenant.id).toBe(tenantId);
      expect(res.body.data.permissions).toContain("*");
    });

    it("should allow accessing sensitive admin endpoint with permission and AAL2", async () => {
      const res = await request(app)
        .get("/api/v1/tenants/admin-test")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("x-tenant-id", tenantId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Admin access granted");
    });
  });

  describe("5. Membership Lifecycle & Immediate Revocation", () => {
    it("should immediately block access if membership is disabled", async () => {
      await db
        .update(memberships)
        .set({ status: "disabled" })
        .where(eq(memberships.tenantId, tenantId));

      const res = await request(app)
        .get("/api/v1/tenants/current")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("x-tenant-id", tenantId);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("MEMBERSHIP_INACTIVE");
    });

    it("should immediately block access if membership is expired", async () => {
      await db
        .update(memberships)
        .set({
          status: "active",
          expiresAt: new Date(Date.now() - 1000 * 60 * 60),
        })
        .where(eq(memberships.tenantId, tenantId));

      const res = await request(app)
        .get("/api/v1/tenants/current")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("x-tenant-id", tenantId);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("MEMBERSHIP_EXPIRED");
    });
  });
});
