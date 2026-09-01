import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import {
  closeDatabaseConnection,
  db,
  supportedLocales,
} from "@avenquis/database";

describe("Phase 33 Internationalization (i18n) API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase33_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase33 Admin",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Global Firm LLC",
        slug: `global-firm-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // Insert dummy locales for testing
    await db
      .insert(supportedLocales)
      .values([
        {
          code: "en",
          name: "English",
          nativeName: "English",
          isRtl: false,
          isActive: true,
        },
        {
          code: "bn",
          name: "Bengali",
          nativeName: "বাংলা",
          isRtl: false,
          isActive: true,
        },
      ])
      .onConflictDoNothing();
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Supported Locales", () => {
    it("should fetch all globally supported locales", async () => {
      const res = await request(app)
        .get("/api/v1/i18n/supported")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(
        res.body.data.some(
          (loc: { localeCode: string }) => loc.localeCode === "bn-BD",
        ),
      ).toBe(true);
    });
  });

  describe("2. Tenant Locales", () => {
    it("should allow a tenant to configure a locale", async () => {
      const res = await request(app)
        .post("/api/v1/i18n/tenant")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          localeCode: "bn",
          isDefault: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.localeCode).toBe("bn");
      expect(res.body.data.isDefault).toBe(true);
    });

    it("should fetch the tenant's configured locales", async () => {
      const res = await request(app)
        .get("/api/v1/i18n/tenant")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].localeCode).toBe("bn");
      expect(res.body.data[0].nativeName).toBe("বাংলা");
    });
  });
});
