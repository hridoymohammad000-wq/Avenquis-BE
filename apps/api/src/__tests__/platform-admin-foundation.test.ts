import { describe, expect, it } from "vitest";
import { requirePlatformRole } from "../http/middlewares/platform-admin.js";
import {
  assertSeatAllocation,
  canAccessPlatformRoute,
  classifyMemberRoleCode,
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

  it("enforces plan seat limits server-side including partnership firm seats", () => {
    // 1. SINGLE_ARTICLE_STUDENT = 1 student
    const singleStudentPlan = { proprietorSeats: 0, partnerSeats: 0, studentSeats: 1 };
    expect(() => assertSeatAllocation(singleStudentPlan, { studentSeats: 1 })).not.toThrow();
    expect(() => assertSeatAllocation(singleStudentPlan, { proprietorSeats: 1 })).toThrow();

    // 2. INDIVIDUAL_PROPRIETOR = 1 proprietor
    const proprietorPlan = { proprietorSeats: 1, partnerSeats: 0, studentSeats: 0 };
    expect(() => assertSeatAllocation(proprietorPlan, { proprietorSeats: 1 })).not.toThrow();
    expect(() => assertSeatAllocation(proprietorPlan, { studentSeats: 1 })).toThrow();

    // 3. PROPRIETOR_5_STUDENTS = 1 proprietor + 5 students
    const prop5StudentsPlan = { proprietorSeats: 1, partnerSeats: 0, studentSeats: 5 };
    expect(() => assertSeatAllocation(prop5StudentsPlan, { proprietorSeats: 1, studentSeats: 5 })).not.toThrow();
    expect(() => assertSeatAllocation(prop5StudentsPlan, { proprietorSeats: 1, studentSeats: 6 })).toThrow();

    // 4. PARTNERSHIP_FIRM = 4 partners + 10 students
    const partnershipPlan = { proprietorSeats: 0, partnerSeats: 4, studentSeats: 10 };
    expect(() => assertSeatAllocation(partnershipPlan, { partnerSeats: 4, studentSeats: 10 })).not.toThrow();
    expect(() => assertSeatAllocation(partnershipPlan, { partnerSeats: 5, studentSeats: 10 })).toThrow();
    expect(() => assertSeatAllocation(partnershipPlan, { partnerSeats: 4, studentSeats: 11 })).toThrow();
    expect(() => assertSeatAllocation(partnershipPlan, { proprietorSeats: 1 })).toThrow();
  });

  it("denies low-privilege platform roles from privileged platform routes", () => {
    expect(canAccessPlatformRoute(["SUPPORT"], ["PLATFORM_SUPER_ADMIN", "PLATFORM_ADMIN"])).toBe(false);
    expect(canAccessPlatformRoute(["SALES"], ["PLATFORM_SUPER_ADMIN", "PLATFORM_ADMIN"])).toBe(false);
    expect(canAccessPlatformRoute(["MARKETING"], ["PLATFORM_SUPER_ADMIN", "PLATFORM_ADMIN"])).toBe(false);
    expect(canAccessPlatformRoute(["FINANCE"], ["PLATFORM_SUPER_ADMIN", "PLATFORM_ADMIN"])).toBe(false);
    expect(canAccessPlatformRoute(["OPS"], ["PLATFORM_SUPER_ADMIN", "PLATFORM_ADMIN"])).toBe(false);
    expect(canAccessPlatformRoute(["PLATFORM_ADMIN"], ["PLATFORM_SUPER_ADMIN", "PLATFORM_ADMIN"])).toBe(true);
  });

  it("classifies owner role dynamically per platform plan", () => {
    const singleStudentPlan = { proprietorSeats: 0, partnerSeats: 0, studentSeats: 1 };
    const proprietorPlan = { proprietorSeats: 1, partnerSeats: 0, studentSeats: 0 };
    const prop5StudentsPlan = { proprietorSeats: 1, partnerSeats: 0, studentSeats: 5 };
    const partnershipPlan = { proprietorSeats: 0, partnerSeats: 4, studentSeats: 10 };

    expect(classifyMemberRoleCode("owner", singleStudentPlan)).toBe("student");
    expect(classifyMemberRoleCode("owner", proprietorPlan)).toBe("proprietor");
    expect(classifyMemberRoleCode("owner", prop5StudentsPlan)).toBe("proprietor");
    expect(classifyMemberRoleCode("owner", partnershipPlan)).toBe("partner");

    expect(classifyMemberRoleCode("proprietor", partnershipPlan)).toBe("proprietor");
    expect(classifyMemberRoleCode("partner", partnershipPlan)).toBe("partner");
    expect(classifyMemberRoleCode("student", partnershipPlan)).toBe("student");
  });
});
