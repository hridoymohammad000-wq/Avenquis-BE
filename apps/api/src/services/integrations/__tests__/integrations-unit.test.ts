import { describe, it, expect } from "vitest";
import { XeroIntegrationAdapter } from "../xero-integration.adapter.js";
import { SapIntegrationAdapter } from "../sap-integration.adapter.js";

describe("Phase 37 Integrations & ERP Sync Engine - Unit Tests", () => {
  describe("1. Integration State Machine Truthfulness", () => {
    it("should report NOT_CONFIGURED when missing credentials", async () => {
      const xero = new XeroIntegrationAdapter();
      const res = await xero.testConnection("conn-1", "");

      expect(res.success).toBe(false);
      expect(res.status).toBe("NOT_CONFIGURED");
    });

    it("should report ERROR when invalid credentials provided", async () => {
      const xero = new XeroIntegrationAdapter();
      const res = await xero.testConnection("conn-1", "invalid_token");

      expect(res.success).toBe(false);
      expect(res.status).toBe("ERROR");
      expect(res.message).toContain("401 Unauthorized");
    });

    it("should report CONNECTED when valid credentials supplied", async () => {
      const xero = new XeroIntegrationAdapter();
      const res = await xero.testConnection("conn-1", JSON.stringify({ accessToken: "valid_oauth_at_123" }));

      expect(res.success).toBe(true);
      expect(res.status).toBe("CONNECTED");
      expect(res.tokenExpiresAt).toBeDefined();
    });
  });

  describe("2. Rate Limit Detection & DEGRADED Status", () => {
    it("should detect HTTP 429 rate limit triggers and return DEGRADED status", async () => {
      const xero = new XeroIntegrationAdapter();
      const syncResult = await xero.fetchSyncData("tenant-1", "conn-1", "rate_limit_trigger");

      expect(syncResult.status).toBe("DEGRADED");
      expect(syncResult.rateLimited).toBe(true);
      expect(syncResult.errorDetails).toContain("Rate limit exceeded");
    });
  });

  describe("3. Pagination & Cursor Continuation", () => {
    it("should fetch paginated records with cursor continuation", async () => {
      const sap = new SapIntegrationAdapter();
      const page1 = await sap.fetchSyncData("tenant-1", "conn-1", "valid_key", "1", 10);

      expect(page1.status).toBe("SUCCESS");
      expect(page1.records.length).toBeGreaterThan(0);
      expect(page1.hasMore).toBe(true);
      expect(page1.nextCursor).toBe("2");

      const page2 = await sap.fetchSyncData("tenant-1", "conn-1", "valid_key", "2", 10);
      expect(page2.hasMore).toBe(false);
      expect(page2.nextCursor).toBeUndefined();
    });
  });

  describe("4. Token Refresh Lifecycle", () => {
    it("should refresh valid OAuth tokens and return new credentials + expiration", async () => {
      const xero = new XeroIntegrationAdapter();
      const refresh = await xero.refreshToken(JSON.stringify({ refreshToken: "valid_rt" }));

      expect(refresh.valid).toBe(true);
      expect(refresh.newCredentials).toBeDefined();
      expect(refresh.expiresAt).toBeDefined();
    });

    it("should reject refreshing revoked tokens", async () => {
      const xero = new XeroIntegrationAdapter();
      const refresh = await xero.refreshToken("revoked_token");

      expect(refresh.valid).toBe(false);
    });
  });
});
