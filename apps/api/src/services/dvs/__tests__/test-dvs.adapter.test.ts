import { describe, it, expect } from "vitest";
import { TestDvsAdapter } from "../test-dvs.adapter.js";

describe("Phase 23 - TestDvsAdapter Unit Tests", () => {
  it("should return NOT_CONFIGURED when API credentials are not set", async () => {
    const adapter = new TestDvsAdapter({ apiUrl: undefined, apiKey: undefined });
    const state = await adapter.getProviderState();
    expect(state).toBe("NOT_CONFIGURED");

    const result = await adapter.generateVerificationCode({
      tenantId: "tenant-1",
      engagementId: "eng-1",
      documentType: "Audit Report",
    });

    expect(result.isAuthoritative).toBe(false);
    expect(result.status).toBe("PROVIDER_UNAVAILABLE");
    expect(result.providerState).toBe("NOT_CONFIGURED");
    expect(result.verificationNote.toLowerCase()).toContain("not configured");
  });

  it("should return AVAILABLE and authoritative result when configured with SUCCESS mock", async () => {
    const adapter = new TestDvsAdapter({
      apiUrl: "https://dvs.icab.org.bd/api",
      apiKey: "test-key",
      mockMode: "SUCCESS",
    });

    const state = await adapter.getProviderState();
    expect(state).toBe("AVAILABLE");

    const result = await adapter.generateVerificationCode({
      tenantId: "tenant-1",
      engagementId: "eng-1",
      documentType: "Audit Report",
    });

    expect(result.isAuthoritative).toBe(true);
    expect(result.status).toBe("VERIFIED");
    expect(result.externalReference).toBeDefined();
  });

  it("should handle REJECT mock mode", async () => {
    const adapter = new TestDvsAdapter({
      apiUrl: "https://dvs.icab.org.bd/api",
      apiKey: "test-key",
      mockMode: "REJECT",
    });

    const result = await adapter.generateVerificationCode({
      tenantId: "tenant-1",
      engagementId: "eng-1",
      documentType: "Audit Report",
    });

    expect(result.isAuthoritative).toBe(true);
    expect(result.status).toBe("REJECTED");
    expect(result.failureReason).toBeDefined();
  });

  it("should throw timeout error on TIMEOUT mock mode", async () => {
    const adapter = new TestDvsAdapter({
      apiUrl: "https://dvs.icab.org.bd/api",
      apiKey: "test-key",
      mockMode: "TIMEOUT",
    });

    await expect(
      adapter.generateVerificationCode({
        tenantId: "tenant-1",
        engagementId: "eng-1",
        documentType: "Audit Report",
      }),
    ).rejects.toThrow("timed out");
  });

  it("should throw retryable error on RETRYABLE_FAIL mock mode", async () => {
    const adapter = new TestDvsAdapter({
      apiUrl: "https://dvs.icab.org.bd/api",
      apiKey: "test-key",
      mockMode: "RETRYABLE_FAIL",
    });

    await expect(
      adapter.generateVerificationCode({
        tenantId: "tenant-1",
        engagementId: "eng-1",
        documentType: "Audit Report",
      }),
    ).rejects.toThrow("HTTP_503_SERVICE_UNAVAILABLE");
  });

  it("should throw non-retryable error on NON_RETRYABLE_FAIL mock mode", async () => {
    const adapter = new TestDvsAdapter({
      apiUrl: "https://dvs.icab.org.bd/api",
      apiKey: "test-key",
      mockMode: "NON_RETRYABLE_FAIL",
    });

    await expect(
      adapter.generateVerificationCode({
        tenantId: "tenant-1",
        engagementId: "eng-1",
        documentType: "Audit Report",
      }),
    ).rejects.toThrow("HTTP_400_BAD_REQUEST");
  });
});

