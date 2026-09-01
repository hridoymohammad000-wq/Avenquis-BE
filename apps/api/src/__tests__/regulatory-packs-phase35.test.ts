import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import {
  closeDatabaseConnection,
  db,
  globalCountries,
  globalRegulatoryBodies,
  regulatoryRulePacks,
} from "@avenquis/database";

describe("Phase 35 Country Regulatory Packs API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let testPackId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase35_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase35 Admin",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Regulatory Firm LLC",
        slug: `reg-firm-p35-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Setup Data
    await db
      .insert(globalCountries)
      .values([{ code: "BD", name: "Bangladesh", currencyCode: "BDT" }])
      .onConflictDoNothing();

    const [body] = await db
      .insert(globalRegulatoryBodies)
      .values([
        {
          countryCode: "BD",
          name: "Institute of Chartered Accountants of Bangladesh",
          code: "ICAB",
        },
      ])
      .returning();

    const [pack] = await db
      .insert(regulatoryRulePacks)
      .values([
        {
          bodyId: body.id,
          name: "ICAB Audit Manual 2024",
          version: "2024.1",
          description: "Standard ICAB audit rules.",
        },
      ])
      .returning();

    testPackId = pack.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Available Packs", () => {
    it("should fetch available global regulatory packs", async () => {
      const res = await request(app)
        .get("/api/v1/regulatory/packs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.some((p: { bodyCode: string }) => p.bodyCode === "ICAB")).toBe(true);
    });

    it("should filter packs by countryCode", async () => {
      const res = await request(app)
        .get("/api/v1/regulatory/packs?countryCode=BD")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((p: { countryCode: string }) => p.countryCode === "BD")).toBe(true);
    });
  });

  describe("2. Tenant Pack Management", () => {
    it("should allow a tenant to activate a regulatory pack", async () => {
      const res = await request(app)
        .post("/api/v1/regulatory/tenant-packs")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          packId: testPackId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(
        res.body.data.some(
          (pack: { packName: string }) => pack.packName.length > 0,
        ),
      ).toBe(true);
    });

    it("should list tenant enabled regulatory packs", async () => {
      const res = await request(app)
        .get("/api/v1/regulatory-packs/tenant")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(
        res.body.data.some(
          (tp: { tenantId: string }) => tp.tenantId === tenantAId,
        ),
      ).toBe(true);
      expect(res.body.data[0].packId).toBe(testPackId);
    });
  });
});
