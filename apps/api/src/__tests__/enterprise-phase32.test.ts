import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 32 Enterprise Scale API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let branchId: string;
  let membershipId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase32_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase32 Admin",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-ent-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // Get current user's membership for this tenant
    const memRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${adminToken}`);

    membershipId = memRes.body.data.memberships.find(
      (m: { tenantId: string; id: string }) => m.tenantId === tenantAId,
    ).id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Firm Branches", () => {
    it("should create a new firm branch", async () => {
      const res = await request(app)
        .post("/api/v1/enterprise/branches")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          name: "Chattogram Branch",
          branchCode: "CTG-01",
          location: "Agrabad, Chattogram",
          isHeadOffice: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      branchId = res.body.data.id;
    });

    it("should fetch all branches", async () => {
      const res = await request(app)
        .get("/api/v1/enterprise/branches")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].name).toBe("Chattogram Branch");
    });
  });

  describe("2. Staff Branch Assignments", () => {
    it("should assign a staff member to a branch", async () => {
      const res = await request(app)
        .post("/api/v1/enterprise/branches/staff")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          membershipId,
          branchId,
          isPrimary: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isPrimary).toBe(true);
    });

    it("should fetch staff branch allocations", async () => {
      const res = await request(app)
        .get(`/api/v1/enterprise/branches/staff/${membershipId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
