import {
  and,
  db,
  eq,
  inArray,
  isNull,
  membershipRoles,
  memberships,
  permissions,
  rolePermissions,
  roles,
  withUserBootstrapContext,
} from "@avenquis/database";
import type { Request } from "express";
import { ApiError } from "../../errors/api-error.js";
import { PermissionService } from "../permission.service.js";
import { TenantService } from "../tenant.service.js";
import type { PetContext } from "./pet.types.js";

// These are global system role codes. Tenant-scoped roles are deliberately excluded.
const PLATFORM_ROLE_CODES = [
  "PLATFORM_SUPER_ADMIN", "PLATFORM_ADMIN", "SALES", "MARKETING", "SUPPORT", "FINANCE", "OPS",
  "platform_super_admin", "platform_admin", "sales", "marketing", "support", "finance", "ops",
];

export class PetContextService {
  static async resolvePlatformAccess(userId: string) {
    return withUserBootstrapContext({ userId }, async () => {
      const assigned = await db
        .select({ roleId: roles.id, code: roles.code })
        .from(memberships)
        .innerJoin(membershipRoles, eq(membershipRoles.membershipId, memberships.id))
        .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
        .where(and(eq(memberships.userId, userId), eq(memberships.status, "active"), isNull(roles.tenantId), inArray(roles.code, PLATFORM_ROLE_CODES), eq(roles.isSystem, true)));
      const platformRoles = assigned.filter((role) => role.code && PLATFORM_ROLE_CODES.includes(role.code));
      if (!platformRoles.length) return null;
      const roleIds = platformRoles.map((role) => role.roleId);
      const granted = await db.select({ code: permissions.code }).from(rolePermissions)
        .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
        .where(inArray(rolePermissions.roleId, roleIds));
      return { role: platformRoles[0].code, permissions: Array.from(new Set(granted.map((permission) => permission.code))) };
    });
  }

  static async resolve(req: Request): Promise<PetContext> {
    if (!req.user) throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
    const platform = await this.resolvePlatformAccess(req.user.id);
    if (platform) {
      if (req.headers["x-tenant-id"] || req.params.tenantId || req.query.tenantId) {
        throw new ApiError(400, "Platform AI Pet context cannot be scoped to a tenant", "PLATFORM_TENANT_CONTEXT_FORBIDDEN");
      }
      return { userId: req.user.id, role: platform.role, workspaceType: "PLATFORM_ADMIN", permissions: platform.permissions };
    }
    const tenantId = req.headers["x-tenant-id"] as string | undefined;
    if (!tenantId) throw new ApiError(400, "Tenant context required: missing x-tenant-id header", "TENANT_HEADER_REQUIRED");
    const { membership } = await TenantService.validateTenantMembership(req.user.id, tenantId);
    const permissions = await PermissionService.getMembershipPermissions(membership.id);
    return { userId: req.user.id, membershipId: membership.id, tenantId, role: "FIRM_MEMBER", workspaceType: "FIRM", permissions };
  }
}
