import { describe, expect, it } from "vitest";
import { requirePlatformRole } from "../http/middlewares/platform-admin.js";
import {
  assertSeatAllocation,
  canAccessPlatformRoute,
  normalizePlatformRoles,
} from "../services/platform-admin.policy.js";
import {
  normalizeWorkspaceSubdomain,
  RESERVED_SUBDOMAINS,
} from "../services/platform-admin.service.js";

describe("platform admin foundation policy", () => {
  it("keeps platform roles separate from firm roles", () => {
    expect(normalizePlatformRoles(["admin", "owner", "PLATFORM_ADMIN"])).toEqual([
      "PLATFORM_ADMIN",
    ]);
    expect(canAccessPlatformRoute(["admin", "owner"])).toBe(false);
    expect(canAccessPlatformRoute(["PLATFORM_ADMIN"], ["FINANCE"])).toBe(false);
    expect(canAccessPlatformRoute(["PLATFORM_ADMIN"], ["PLATFORM_ADMIN"])).toBe(true);
  });

  it("denies unauthenticated platform-admin requests", () => {
    const next = (error?: unknown) => error;
    const result = requirePlatformRole()(
      {} as never,
      {} as never,
      next as never,
    );
    expect(result).toBeDefined();
    expect(result).toMatchObject({ statusCode: 401, code: "UNAUTHORIZED" });
  });

  it("does not let a tenant header or unknown role grant platform access", () => {
    expect(canAccessPlatformRoute(["firm_owner"])).toBe(false);
    expect(canAccessPlatformRoute(["PLATFORM_ADMIN", "tenant:other"])).toBe(true);
  });

  it("normalizes valid subdomains and rejects reserved or malformed values", () => {
    expect(normalizeWorkspaceSubdomain("  Acme-Firm ")).toBe("acme-firm");
    for (const reserved of RESERVED_SUBDOMAINS) {
      expect(() => normalizeWorkspaceSubdomain(reserved.toUpperCase())).toThrow();
    }
    expect(() => normalizeWorkspaceSubdomain("-invalid")).toThrow();
    expect(() => normalizeWorkspaceSubdomain("invalid-")).toThrow();
    expect(() => normalizeWorkspaceSubdomain("bad value")).toThrow();
  });

  it("enforces plan seat limits server-side", () => {
    expect(() => assertSeatAllocation(
      { proprietorSeats: 1, studentSeats: 5 },
      { proprietorSeats: 1, studentSeats: 5 },
    )).not.toThrow();
    expect(() => assertSeatAllocation(
      { proprietorSeats: 1, studentSeats: 5 },
      { proprietorSeats: 2, studentSeats: 5 },
    )).toThrow();
  });
});
