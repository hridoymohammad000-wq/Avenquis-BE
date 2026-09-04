import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 31 Automation & APIs", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let apiKeyId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase31_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase31 Admin",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-auto-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Webhooks & SSRF Protection", () => {
    it("should register a new webhook endpoint with valid external HTTPS URL", async () => {
      const res = await request(app)
        .post("/api/v1/automation/webhooks")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          url: "https://api.example.com/webhook",
          eventTypes: ["engagement.created", "document.uploaded"],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.secret).toBeDefined();
    });

    it("should block registering webhooks with SSRF target URLs (localhost)", async () => {
      const res = await request(app)
        .post("/api/v1/automation/webhooks")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          url: "http://localhost:8080/internal-webhook",
          eventTypes: ["engagement.created"],
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("SSRF_BLOCKED");
    });

    it("should list registered webhooks", async () => {
      const res = await request(app)
        .get("/api/v1/automation/webhooks")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].url).toBe("https://api.example.com/webhook");
    });
  });

  describe("2. Workflow Automation Rules & Event Dispatch", () => {
    it("should create a workflow automation rule", async () => {
      const res = await request(app)
        .post("/api/v1/automation/rules")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          name: "Notify Partner on Review Completion",
          triggerEvent: "task.completed",
          condition: { taskType: "partner_review" },
          actionType: "notify_partner",
          actionPayload: {
            messageTemplate:
              "Task {{taskId}} is complete for engagement {{engagementId}}.",
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.actionType).toBe("notify_partner");
    });

    it("should list automation rules", async () => {
      const res = await request(app)
        .get("/api/v1/automation/rules?triggerEvent=task.completed")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].name).toBe("Notify Partner on Review Completion");
    });

    it("should dispatch an internal event and execute matching rules", async () => {
      const res = await request(app)
        .post("/api/v1/automation/events/dispatch")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          eventType: "task.completed",
          payload: {
            taskId: "task-123",
            taskType: "partner_review",
            engagementId: "eng-456",
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rulesExecuted).toBeGreaterThanOrEqual(1);
    });
  });

  describe("3. API Key Management", () => {
    it("should generate a new API key and return rawKey once", async () => {
      const res = await request(app)
        .post("/api/v1/automation/api-keys")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          name: "ERP Integration Key",
          scopes: ["audit:read", "client:read"],
          expiresInDays: 30,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rawKey).toContain("avq_live_");
      expect(res.body.data.apiKey.keyPrefix).toBeDefined();
      apiKeyId = res.body.data.apiKey.id;
    });

    it("should list API keys for tenant", async () => {
      const res = await request(app)
        .get("/api/v1/automation/api-keys")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].name).toBe("ERP Integration Key");
    });

    it("should revoke an API key", async () => {
      const res = await request(app)
        .post(`/api/v1/automation/api-keys/${apiKeyId}/revoke`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("revoked");
    });
  });
});
