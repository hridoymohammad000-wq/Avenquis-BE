import { describe, expect, it, vi, beforeEach } from "vitest";
import { AuthService } from "../services/auth.service.js";
import { hashArtifactUrl } from "../services/crypto-evidence.service.js";
import {
  authRateLimit,
  clearRateLimitBucketsForTests,
} from "../http/middlewares/rate-limit.js";

describe("V1 security regressions", () => {
  beforeEach(async () => {
    await clearRateLimitBucketsForTests();
  });

  it("encrypts MFA secrets and rejects plaintext values", () => {
    const encrypted = AuthService.encryptMfaSecret("TOTP-SECRET");
    expect(encrypted).toMatch(/^v1:/);
    expect(AuthService.decryptMfaSecret(encrypted)).toBe("TOTP-SECRET");
    expect(() => AuthService.decryptMfaSecret("TOTP-SECRET")).toThrow();
  });

  it("hashes and verifies backup codes without storing the code", async () => {
    const hash = await AuthService.hashBackupCode("ABCD1234");
    expect(hash).not.toContain("ABCD1234");
    await expect(AuthService.verifyBackupCode("ABCD1234", hash)).resolves.toBe(true);
    await expect(AuthService.verifyBackupCode("WRONG999", hash)).resolves.toBe(false);
  });

  it("revokes an access token after logout", async () => {
    const token = AuthService.generateTokens({
      userId: "00000000-0000-0000-0000-000000000001",
      email: "user@example.com",
      aal: "aal1",
    }).accessToken;
    await expect(AuthService.verifyAccessToken(token)).resolves.toMatchObject({ email: "user@example.com" });
    await AuthService.revokeToken(token);
    await expect(AuthService.verifyAccessToken(token)).rejects.toThrow();
  });

  it("limits repeated authentication attempts per IP and account", async () => {
    const next = vi.fn();
    const req = { ip: "203.0.113.10", body: { email: "user@example.com" } } as never;
    for (let index = 0; index < 10; index += 1) await authRateLimit(req, {} as never, next);
    await authRateLimit(req, {} as never, next);
    expect(next).toHaveBeenLastCalledWith(expect.objectContaining({ code: "RATE_LIMITED" }));
  });

  it("rejects non-HTTPS and non-allowlisted artifact URLs before fetching", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(hashArtifactUrl("http://127.0.0.1/secret")).rejects.toThrow();
    await expect(hashArtifactUrl("https://example.com/secret")).rejects.toThrow(/allowlisted/);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
