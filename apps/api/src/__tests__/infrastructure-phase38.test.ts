import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 38 International SaaS Readiness", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
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
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Dedicated Tenant Infrastructure Config", () => {
    it("should configure dedicated infrastructure credentials", async () => {
      const res = await request(app)
        .post("/api/v1/infrastructure/tenant-config")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          databaseUrlSecret: "postgresql://dedicated:pwd@aws.rds/db",
          storageBucketName: "avenquis-dedicated-ent-global",
          kmsKeyId: "arn:aws:kms:us-east-1:123:key/456",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isProvisioned).toBe(true);
      expect(res.body.data.storageBucketName).toBe("avenquis-dedicated-ent-global");
    });

    it("should fetch the tenant infrastructure config", async () => {
      const res = await request(app)
        .get("/api/v1/infrastructure/tenant-config")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kmsKeyId).toBe("arn:aws:kms:us-east-1:123:key/456");
    });
  });

  describe("2. SaaS Readiness QA Sign-offs", () => {
    it("should allow a platform admin to sign off on a module", async () => {
      const res = await request(app)
        .post("/api/v1/infrastructure/signoffs")
        .set("Authorization", `Bearer ${adminToken}`)
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

    it("should fetch all sign-offs", async () => {
      const res = await request(app)
        .get("/api/v1/infrastructure/signoffs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(
        res.body.data.some(
          (so: { moduleName: string }) => so.moduleName === "V5_CORE_PLATFORM",
        ),
      ).toBe(true);
    });
  });
});
