import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection, db, globalCountries } from "@avenquis/database";

describe("Phase 34 Multi-country & Regional API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase34_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase34 Admin",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Global Firm LLC",
        slug: `global-firm-p34-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // Insert dummy countries for testing
    await db.insert(globalCountries).values([
      { code: "BD", name: "Bangladesh", currencyCode: "BDT", callingCode: "+880", isActive: true },
      { code: "US", name: "United States", currencyCode: "USD", callingCode: "+1", isActive: true },
      { code: "UK", name: "United Kingdom", currencyCode: "GBP", callingCode: "+44", isActive: true },
    ]).onConflictDoNothing();
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Global Countries", () => {
    it("should fetch all globally supported countries", async () => {
      const res = await request(app)
        .get("/api/v1/regional/countries")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      expect(
        res.body.data.some(
          (reg: { code: string }) => reg.code === "SG",
        ),
      ).toBe(true);
    });
  });

  describe("2. Tenant Regional Settings", () => {
    it("should allow a tenant to configure regional settings", async () => {
      const res = await request(app)
        .post("/api/v1/regional/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          countryCode: "BD",
          currencyCode: "BDT",
          timezone: "Asia/Dhaka",
          financialYearStartMonth: 7, // July to June (BD Financial Year)
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.countryCode).toBe("BD");
      expect(res.body.data.currencyCode).toBe("BDT");
      expect(res.body.data.timezone).toBe("Asia/Dhaka");
      expect(res.body.data.financialYearStartMonth).toBe(7);
    });

    it("should fetch the tenant's configured regional settings", async () => {
      const res = await request(app)
        .get("/api/v1/regional/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.countryCode).toBe("BD");
      expect(res.body.data.timezone).toBe("Asia/Dhaka");
    });
  });
});
