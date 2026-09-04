import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";
import { AiIntelligenceService } from "../services/ai-intelligence.service.js";
import { GeminiAiAdapter } from "../services/ai/gemini-ai.adapter.js";

describe("Phase 27 AI Intelligence API & Provider Remediation", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let tenantBId: string;
  let engagementId: string;
  let analysisId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase27_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase27 AI Partner",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-ai-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // Tenant B (cross-tenant security)
    const tenantBRes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Rahman & Co CA Firm",
        slug: `rahman-ai-${Date.now()}`,
      });
    tenantBId = tenantBRes.body.data.tenant.id;

    // 2. Client & Engagement
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-AI-${Date.now()}`,
        name: "Robotics Inc",
        clientType: "corporate",
      });
    const clientId = clientRes.body.data.id;

    const engRes = await request(app)
      .post("/api/v1/engagements")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId,
        title: "FY24 Statutory Audit",
        engagementType: "statutory_audit",
        status: "in_progress",
      });
    engagementId = engRes.body.data.id;
  });

  afterAll(async () => {
    // Reset default adapter
    AiIntelligenceService.registerAdapter("GEMINI", new GeminiAiAdapter());
    await closeDatabaseConnection();
  });

  describe("1. Document Intelligence & Provider Handling", () => {
    it("should handle unconfigured provider gracefully without fake production results", async () => {
      AiIntelligenceService.registerAdapter("GEMINI", new GeminiAiAdapter({ apiKey: undefined }));

      const res = await request(app)
        .post("/api/v1/intelligence/documents/analyze")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          documentUrl: "https://storage.avenquis.local/docs/inv-001.pdf",
          documentType: "invoice",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("FAILED");
      expect(res.body.data.providerStatus).toBe("NOT_CONFIGURED");
      expect(res.body.data.failureReason).toContain("GEMINI_API_KEY");
    });

    it("should process document analysis when test provider adapter is active", async () => {
      AiIntelligenceService.registerAdapter(
        "GEMINI",
        new GeminiAiAdapter({ apiKey: "test-key", mockMode: "SUCCESS" }),
      );

      const res = await request(app)
        .post("/api/v1/intelligence/documents/analyze")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          engagementId,
          documentUrl: "https://storage.avenquis.local/docs/inv-001.pdf",
          documentType: "invoice",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      analysisId = res.body.data.id;
      expect(analysisId).toBeDefined();
      expect(res.body.data.status).toBe("REVIEW_REQUIRED");
      expect(res.body.data.reviewStatus).toBe("UNREVIEWED");
      expect(res.body.data.isTestProvider).toBe(true);
    });

    it("should retrieve document analysis result and enforce tenant isolation", async () => {
      const resA = await request(app)
        .get(`/api/v1/intelligence/documents/analyze/${analysisId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(resA.status).toBe(200);
      expect(resA.body.data.documentType).toBe("invoice");

      // Tenant B cross-tenant access attempt
      const resB = await request(app)
        .get(`/api/v1/intelligence/documents/analyze/${analysisId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantBId);

      expect(resB.status).toBe(404);
    });

    it("should allow human review & approval of AI analysis result", async () => {
      const res = await request(app)
        .post(`/api/v1/intelligence/documents/analyze/${analysisId}/review`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          decision: "APPROVED",
          reviewNotes: "Verified vendor details against invoice paper file",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.reviewStatus).toBe("APPROVED");
      expect(res.body.data.status).toBe("COMPLETED");
    });
  });

  describe("2. AI Engagement Review & Idempotency", () => {
    it("should process an AI review of the engagement", async () => {
      AiIntelligenceService.registerAdapter(
        "GEMINI",
        new GeminiAiAdapter({ apiKey: "test-key", mockMode: "SUCCESS" }),
      );

      const res = await request(app)
        .post(`/api/v1/intelligence/engagements/${engagementId}/review`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          aiModel: "gemini-1.5-pro",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("REVIEW_REQUIRED");
      expect(res.body.data.confidenceScore).toBe(88);
    });
  });
});
