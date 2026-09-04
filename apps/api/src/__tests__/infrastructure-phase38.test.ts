import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection, db, sql } from "@avenquis/database";

describe("Phase 38 International SaaS & Infrastructure Readiness Route Tests", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let isDbAvailable = false;

  beforeAll(async () => {
    try {
      await db.execute(sql`SELECT 1`);
      isDbAvailable = true;
    } catch {
      isDbAvailable = false;
      return;
    }

    if (isDbAvailable) {
      // Register Admin User & Create Tenant A
      const adminEmail = `admin_phase38_${Date.now()}@avenquis.local`;
      const regRes = await request(app).post("/api/v1/auth/register").send({
        email: adminEmail,
        password: "AdminPassword123!",
        fullName: "Phase38 Admin",
      });
      adminToken = regRes.body.data.tokens.accessToken;

      const tenantARes = await request(app)
        .post("/api/v1/tenants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Enterprise Global Firm",
          slug: `ent-global-p38-${Date.now()}`,
        });
      tenantAId = tenantARes.body.data.tenant.id;
    }
  });

  afterAll(async () => {
    if (isDbAvailable) {
      await closeDatabaseConnection();
    }
  });

  describe("1. Platform Admin Security & Config Storage Truth", () => {
    it("should REJECT normal tenant admin without platform authorization from configuring dedicated infrastructure (HTTP 403)", async (context) => {
      if (!isDbAvailable) {
        context.skip();
        return;
      }

      const res = await request(app)
        .post("/api/v1/infrastructure/tenant-config")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          databaseUrlSecret: "postgresql://dedicated:pwd@aws.rds/db",
          storageBucketName: "avenquis-dedicated-ent-global",
          kmsKeyId: "arn:aws:kms:us-east-1:123:key/456",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("PLATFORM_ADMIN_REQUIRED");
    });

    it("should ALLOW platform admin to store dedicated tenant config metadata (isProvisioned MUST be false)", async (context) => {
      if (!isDbAvailable) {
        context.skip();
        return;
      }

      const res = await request(app)
        .post("/api/v1/infrastructure/tenant-config")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .set("x-platform-admin", "true")
        .send({
          databaseUrlSecret: "postgresql://dedicated:pwd@aws.rds/db",
          storageBucketName: "avenquis-dedicated-ent-global",
          kmsKeyId: "arn:aws:kms:us-east-1:123:key/456",
          isolationMode: "DEDICATED_DATABASE",
          requestedRegion: "ap-southeast-1",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isProvisioned).toBe(false); // CRITICAL TRUTH CHECK
      expect(res.body.data.provisioningStatus).toBe("CONFIGURATION_STORED");
      expect(res.body.data.readinessStatus).toBe("NOT_READY");
      expect(res.body.data.databaseUrlSecret).toBe("[REDACTED_DATABASE_URL]");
    });

    it("should allow tenant admin to fetch infrastructure config with redacted secrets", async (context) => {
      if (!isDbAvailable) {
        context.skip();
        return;
      }

      const res = await request(app)
        .get("/api/v1/infrastructure/tenant-config")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kmsKeyId).toBe("arn:aws:kms:us-east-1:123:key/456");
      expect(res.body.data.databaseUrlSecret).toBe("[REDACTED_DATABASE_URL]");
    });
  });

  describe("2. Dedicated Infrastructure Provisioning & Readiness Evaluation", () => {
    it("should trigger infrastructure provisioning via platform admin endpoint", async (context) => {
      if (!isDbAvailable) {
        context.skip();
        return;
      }

      const res = await request(app)
        .post("/api/v1/infrastructure/provision")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .set("x-platform-admin", "true")
        .send({
          isolationMode: "DEDICATED_DATABASE",
          requestedRegion: "ap-southeast-1",
          providerType: "TEST_STUB",
          idempotencyKey: `idem-${Date.now()}`,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isProvisioned).toBe(true);
      expect(res.body.data.provisioningStatus).toBe("PROVISIONED");
      expect(res.body.data.readinessStatus).toBe("READY");
    });

    it("should evaluate tenant readiness authoritatively", async (context) => {
      if (!isDbAvailable) {
        context.skip();
        return;
      }

      const res = await request(app)
        .post("/api/v1/infrastructure/evaluate-readiness")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.readinessStatus).toBe("READY");
      expect(res.body.data.isReady).toBe(true);
    });
  });

  describe("3. System Release Readiness & QA Sign-offs", () => {
    it("should allow a platform admin to submit QA sign-off", async (context) => {
      if (!isDbAvailable) {
        context.skip();
        return;
      }

      const res = await request(app)
        .post("/api/v1/infrastructure/signoffs")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-platform-admin", "true")
        .send({
          moduleName: "V5_CORE_SECURITY",
          status: "APPROVED",
          notes: "Pen-tested and cleared for launch.",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.moduleName).toBe("V5_CORE_SECURITY");
      expect(res.body.data.status).toBe("APPROVED");
    });

    it("should fetch system release readiness report", async (context) => {
      if (!isDbAvailable) {
        context.skip();
        return;
      }

      const res = await request(app)
        .get("/api/v1/infrastructure/release-readiness")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-platform-admin", "true");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.approvedModules).toContain("V5_CORE_SECURITY");
    });
  });
});
