import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 26 Compliance Master API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let templateId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase26_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase26 Admin",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-master-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Compliance Templates", () => {
    it("should create a new compliance template", async () => {
      const res = await request(app)
        .post("/api/v1/compliance/master/templates")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          name: "RJSC Annual Return Checklist",
          category: "RJSC",
          checklistData: [
            { id: "1", task: "Obtain Form X", required: true },
            { id: "2", task: "Obtain Schedule 10", required: true },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      templateId = res.body.data.id;
      expect(templateId).toBeDefined();
    });

    it("should retrieve templates by category", async () => {
      const res = await request(app)
        .get(`/api/v1/compliance/master/templates?category=RJSC`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe("RJSC Annual Return Checklist");
    });
  });

  describe("2. Regulatory Calendar", () => {
    it("should create a calendar event", async () => {
      const res = await request(app)
        .post("/api/v1/compliance/master/calendar")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          title: "VAT Return Deadline - August",
          eventDate: "2026-09-15T12:00:00.000Z",
          eventType: "tax_return",
          description: "Firm-wide reminder for VAT returns",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("upcoming");
    });

    it("should list upcoming calendar events", async () => {
      const res = await request(app)
        .get(`/api/v1/compliance/master/calendar`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].eventType).toBe("tax_return");
    });
  });
});
