import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../../http/app.js";
import request from "supertest";
import { PetContextService } from "../pet-context.service.js";
import { PetService } from "../pet.service.js";
import { AiIntelligenceService } from "../../ai-intelligence.service.js";
import { TenantService } from "../../tenant.service.js";
import { PermissionService } from "../../permission.service.js";
import { ApiError } from "../../../errors/api-error.js";

describe("AI Pet context boundary", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await request(createApp()).get("/api/v1/ai/pet/context");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("does not allow a platform user to attach a tenant", async () => {
    vi.spyOn(PetContextService, "resolvePlatformAccess").mockResolvedValue({ role: "PLATFORM_ADMIN", permissions: ["platform:read"] });
    await expect(PetContextService.resolve({ user: { id: "user", email: "user@example.test", aal: "aal1" }, headers: { "x-tenant-id": "tenant" }, params: {}, query: {} } as never)).rejects.toMatchObject({ code: "PLATFORM_TENANT_CONTEXT_FORBIDDEN" });
    vi.restoreAllMocks();
  });

  it("resolves a global system role as PLATFORM_ADMIN without tenant data", async () => {
    vi.spyOn(PetContextService, "resolvePlatformAccess").mockResolvedValue({ role: "PLATFORM_ADMIN", permissions: ["platform:read"] });
    const context = await PetContextService.resolve({ user: { id: "user", email: "user@example.test", aal: "aal1" }, headers: {}, params: {}, query: {} } as never);
    expect(context).toMatchObject({ workspaceType: "PLATFORM_ADMIN", role: "PLATFORM_ADMIN" });
    expect(context.tenantId).toBeUndefined();
    vi.restoreAllMocks();
  });

  it("resolves a non-platform user through tenant membership and ignores client workspace claims", async () => {
    vi.spyOn(PetContextService, "resolvePlatformAccess").mockResolvedValue(null);
    vi.spyOn(TenantService, "validateTenantMembership").mockResolvedValue({ membership: { id: "membership" }, tenant: { id: "tenant" } } as never);
    vi.spyOn(PermissionService, "getMembershipPermissions").mockResolvedValue(["audit:read"]);
    const context = await PetContextService.resolve({ user: { id: "user", email: "user@example.test", aal: "aal1" }, headers: { "x-tenant-id": "tenant" }, params: {}, query: {} } as never);
    expect(context).toMatchObject({ workspaceType: "FIRM", tenantId: "tenant", membershipId: "membership" });
    vi.restoreAllMocks();
  });

  it("rejects a tenant mismatch for a non-platform user", async () => {
    vi.spyOn(PetContextService, "resolvePlatformAccess").mockResolvedValue(null);
    vi.spyOn(TenantService, "validateTenantMembership").mockRejectedValue(new ApiError(403, "Access denied", "TENANT_MEMBERSHIP_NOT_FOUND"));
    await expect(PetContextService.resolve({ user: { id: "user", email: "user@example.test", aal: "aal1" }, headers: { "x-tenant-id": "other-tenant" }, params: {}, query: {} } as never)).rejects.toMatchObject({ code: "TENANT_MEMBERSHIP_NOT_FOUND" });
    vi.restoreAllMocks();
  });

  it("returns a provider-not-configured error without fabricating a response", async () => {
    AiIntelligenceService.registerAdapter("GEMINI", { providerName: "GEMINI", getProviderState: async () => "NOT_CONFIGURED", analyzeDocument: vi.fn(), reviewEngagement: vi.fn(), chat: vi.fn() });
    await expect(PetService.chat({ userId: "user", tenantId: "tenant", membershipId: "membership", role: "FIRM_MEMBER", workspaceType: "FIRM", permissions: ["audit:read"] }, "Hello")).rejects.toMatchObject({ code: "AI_NOT_CONFIGURED" });
  });
});
