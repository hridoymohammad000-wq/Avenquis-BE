import { describe, it, expect } from "vitest";
import { XeroIntegrationAdapter } from "../xero-integration.adapter.js";
import { SapIntegrationAdapter } from "../sap-integration.adapter.js";
import { TestIntegrationAdapter } from "../test-integration.adapter.js";

describe("Phase 37 Integrations & ERP Sync Engine - Unit Tests", () => {
  describe("1. Production Adapters Truthfulness", () => {
    it("should report NOT_CONFIGURED when missing credentials", async () => {
      const xero = new XeroIntegrationAdapter();
      const res = await xero.testConnection("conn-1", "");

      expect(res.success).toBe(false);
      expect(res.status).toBe("NOT_CONFIGURED");
    });

    it("should report CONFIGURED when credentials provided without live API network connection", async () => {
      const xero = new XeroIntegrationAdapter();
      const res = await xero.testConnection("conn-1", JSON.stringify({ accessToken: "valid_oauth_at_123" }));

      expect(res.success).toBe(false);
      expect(res.status).toBe("CONFIGURED");
      expect(res.message).toContain("Production Xero OAuth 2.0 API credentials configured");
    });

    it("should return FAILED for production fetchSyncData without live API connection", async () => {
      const xero = new XeroIntegrationAdapter();
      const syncResult = await xero.fetchSyncData("tenant-1", "conn-1", "some_credentials");

      expect(syncResult.status).toBe("FAILED");
      expect(syncResult.records).toHaveLength(0);
      expect(syncResult.hasMore).toBe(false);
    });

    it("should report CONFIGURED for SAP production adapter with credentials", async () => {
      const sap = new SapIntegrationAdapter();
      const res = await sap.testConnection("conn-1", "valid_key");

      expect(res.success).toBe(false);
      expect(res.status).toBe("CONFIGURED");
    });
  });

  describe("2. Test Integration Adapter (Deterministic Testing)", () => {
    it("should support test connections in test adapter", async () => {
      const testAdapter = new TestIntegrationAdapter();
      const res = await testAdapter.testConnection("conn-1", "valid_key");

      expect(res.success).toBe(true);
      expect(res.status).toBe("CONNECTED");
      expect(res.tokenExpiresAt).toBeDefined();
    });

    it("should support pagination and cursor continuation in test adapter", async () => {
      const testAdapter = new TestIntegrationAdapter();
      const page1 = await testAdapter.fetchSyncData("tenant-1", "conn-1", "valid_key", "1", 10);

      expect(page1.status).toBe("SUCCESS");
      expect(page1.records.length).toBeGreaterThan(0);
      expect(page1.hasMore).toBe(true);
      expect(page1.nextCursor).toBe("2");

      const page2 = await testAdapter.fetchSyncData("tenant-1", "conn-1", "valid_key", "2", 10);
      expect(page2.hasMore).toBe(false);
      expect(page2.nextCursor).toBeUndefined();
    });

    it("should support rate limit detection in test adapter", async () => {
      const testAdapter = new TestIntegrationAdapter();
      const syncResult = await testAdapter.fetchSyncData("tenant-1", "conn-1", "rate_limit_trigger");

      expect(syncResult.status).toBe("DEGRADED");
      expect(syncResult.rateLimited).toBe(true);
      expect(syncResult.errorDetails).toContain("Rate limit exceeded");
    });
  });
});
