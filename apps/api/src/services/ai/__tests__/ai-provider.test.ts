import { describe, it, expect } from "vitest";
import { GeminiAiAdapter } from "../gemini-ai.adapter.js";
import { OpenAiAdapter } from "../openai-ai.adapter.js";
import { AiIntelligenceService } from "../../ai-intelligence.service.js";

describe("Phase 27 - AI & Document Intelligence Provider Unit Tests", () => {
  describe("GeminiAiAdapter", () => {
    it("1. Provider Not Configured: should return FAILED status and NOT_CONFIGURED state when API key is missing", async () => {
      const adapter = new GeminiAiAdapter({ apiKey: undefined });
      expect(await adapter.getProviderState()).toBe("NOT_CONFIGURED");

      const result = await adapter.analyzeDocument({
        tenantId: "t-1",
        documentId: "d-1",
        extractedText: "sample text",
        documentType: "invoice",
      });

      expect(result.status).toBe("FAILED");
      expect(result.providerStatus).toBe("NOT_CONFIGURED");
      expect(result.failureReason).toContain("GEMINI_API_KEY");
      expect(result.extractedEntities).toBeUndefined(); // NO fake production result
    });

    it("2. Successful Test Provider Execution: should process mock document analysis", async () => {
      const adapter = new GeminiAiAdapter({
        apiKey: "test-key",
        mockMode: "SUCCESS",
      });

      const result = await adapter.analyzeDocument({
        tenantId: "t-1",
        documentId: "d-1",
        extractedText: "sample text",
        documentType: "invoice",
      });

      expect(result.status).toBe("REVIEW_REQUIRED");
      expect(result.isTestProvider).toBe(true);
      expect(result.confidenceScore).toBe(92.5);
      expect(result.usageMetadata?.totalTokens).toBe(570);
    });

    it("3. Provider Timeout: should handle timeout in mock boundary", async () => {
      const adapter = new GeminiAiAdapter({
        apiKey: "test-key",
        mockMode: "TIMEOUT",
      });

      await expect(
        adapter.analyzeDocument({
          tenantId: "t-1",
          documentId: "d-1",
          extractedText: "sample text",
          documentType: "invoice",
        }),
      ).rejects.toThrow("timed out");
    });

    it("4. Retryable Failure: should handle HTTP 503 retryable outage", async () => {
      const adapter = new GeminiAiAdapter({
        apiKey: "test-key",
        mockMode: "FAIL_RETRYABLE",
      });

      await expect(
        adapter.analyzeDocument({
          tenantId: "t-1",
          documentId: "d-1",
          extractedText: "sample text",
          documentType: "invoice",
        }),
      ).rejects.toThrow("HTTP_503_RETRYABLE");
    });

    it("5. Permanent Failure & Malformed Response: should report failure reason cleanly", async () => {
      const adapterPerm = new GeminiAiAdapter({
        apiKey: "test-key",
        mockMode: "FAIL_PERMANENT",
      });

      const resPerm = await adapterPerm.analyzeDocument({
        tenantId: "t-1",
        documentId: "d-1",
        extractedText: "sample text",
        documentType: "invoice",
      });

      expect(resPerm.status).toBe("FAILED");
      expect(resPerm.failureReason).toContain("extraction");

      const adapterMalformed = new GeminiAiAdapter({
        apiKey: "test-key",
        mockMode: "MALFORMED",
      });

      const resMalformed = await adapterMalformed.analyzeDocument({
        tenantId: "t-1",
        documentId: "d-1",
        extractedText: "sample text",
        documentType: "invoice",
      });

      expect(resMalformed.status).toBe("FAILED");
      expect(resMalformed.failureReason).toContain("Malformed");
    });
  });

  describe("OpenAiAdapter", () => {
    it("should return NOT_CONFIGURED when OPENAI_API_KEY is missing", async () => {
      const adapter = new OpenAiAdapter({ apiKey: undefined });
      expect(await adapter.getProviderState()).toBe("NOT_CONFIGURED");

      const result = await adapter.reviewEngagement({
        tenantId: "t-1",
        engagementId: "eng-1",
        evidencePackage: {
          title: "Test",
          engagementType: "audit",
          financialYear: "2026",
          auditFilesCount: 2,
          auditFindingsCount: 0
        },
        model: "gpt-4o",
      });

      expect(result.status).toBe("FAILED");
      expect(result.failureReason).toContain("OPENAI_API_KEY");
    });
  });

  describe("AiIntelligenceService Adapter Resolution", () => {
    it("should resolve provider adapters dynamically", () => {
      const gemini = AiIntelligenceService.getAdapter("GEMINI");
      expect(gemini.providerName).toBe("GEMINI");

      const openai = AiIntelligenceService.getAdapter("OPENAI");
      expect(openai.providerName).toBe("OPENAI");

      const fallback = AiIntelligenceService.getAdapter("UNKNOWN_VENDOR");
      expect(fallback.providerName).toBe("GEMINI");
    });
  });
});
