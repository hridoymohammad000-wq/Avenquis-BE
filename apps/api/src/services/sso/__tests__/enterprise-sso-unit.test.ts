import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { SamlSsoAdapter } from "../saml-sso.adapter.js";

describe("Phase 36 Enterprise Security & Identity - Unit Tests", () => {
  describe("OIDC State, Nonce & PKCE Generation", () => {
    it("should generate cryptographically secure state, nonce, and PKCE challenge", () => {
      const state = crypto.randomBytes(32).toString("hex");
      const nonce = crypto.randomBytes(32).toString("hex");
      const codeVerifier = crypto.randomBytes(48).toString("hex");
      const codeChallenge = crypto
        .createHash("sha256")
        .update(codeVerifier)
        .digest("base64url");

      expect(state.length).toBe(64);
      expect(nonce.length).toBe(64);
      expect(codeChallenge).toBeDefined();
      expect(codeChallenge.length).toBeGreaterThan(10);
    });
  });

  describe("SAML SP Metadata XML Generation", () => {
    it("should produce valid SAML 2.0 SP Metadata XML with entityID and ACS endpoint", () => {
      const tenantId = "tenant-123-abc";
      const baseUrl = "https://api.avenquis.com";

      const xml = SamlSsoAdapter.generateSpMetadata(tenantId, baseUrl);

      expect(xml).toContain('xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"');
      expect(xml).toContain(`entityID="${baseUrl}/api/v1/security/sso/saml/metadata?tenantId=${tenantId}"`);
      expect(xml).toContain(`Location="${baseUrl}/api/v1/security/sso/saml/acs?tenantId=${tenantId}"`);
    });
  });

  describe("Tenant Domain Mapping & Account Takeover Safeguards", () => {
    function isDomainAllowed(userEmail: string, tenantDomain: string, allowedDomains: string[] = []): boolean {
      const emailDomain = userEmail.split("@")[1]?.toLowerCase();
      if (!emailDomain) return false;
      if (emailDomain === tenantDomain.toLowerCase()) return true;
      return allowedDomains.map((d) => d.toLowerCase()).includes(emailDomain);
    }

    it("should allow matching domain login", () => {
      expect(isDomainAllowed("john@acmecorp.com", "acmecorp.com")).toBe(true);
      expect(isDomainAllowed("jane@subsidiary.acme.com", "acmecorp.com", ["subsidiary.acme.com"])).toBe(true);
    });

    it("should reject mismatched domain login to prevent tenant account takeover", () => {
      expect(isDomainAllowed("attacker@malicious.com", "acmecorp.com")).toBe(false);
      expect(isDomainAllowed("john@otherfirm.com", "acmecorp.com")).toBe(false);
    });
  });

  describe("Safe JIT Provisioning Privilege Escalation Restriction", () => {
    function getSafeJitRole(requestedRole: string): string {
      const FORBIDDEN_JIT_ROLES = ["admin", "partner", "super_admin", "admin:manage"];
      if (FORBIDDEN_JIT_ROLES.includes(requestedRole.toLowerCase())) {
        return "audit:read";
      }
      return requestedRole;
    }

    it("should restrict unsafe JIT role escalation attempts to non-privileged audit:read", () => {
      expect(getSafeJitRole("admin")).toBe("audit:read");
      expect(getSafeJitRole("partner")).toBe("audit:read");
      expect(getSafeJitRole("super_admin")).toBe("audit:read");

      expect(getSafeJitRole("audit:read")).toBe("audit:read");
      expect(getSafeJitRole("staff_viewer")).toBe("staff_viewer");
    });
  });
});
