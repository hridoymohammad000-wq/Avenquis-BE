import {
  db,
  membershipRoles,
  rolePermissions,
  permissions,
  roles,
  eq,
  inArray,
} from "@avenquis/database";

export class PermissionService {
  static async getMembershipPermissions(
    membershipId: string,
  ): Promise<string[]> {
    const assignedRoles = await db
      .select({ roleId: membershipRoles.roleId })
      .from(membershipRoles)
      .where(eq(membershipRoles.membershipId, membershipId));

    if (assignedRoles.length === 0) {
      return [];
    }

    const roleIds = assignedRoles.map((r: { roleId: string }) => r.roleId);

    const roleDetails = await db
      .select({ code: roles.code })
      .from(roles)
      .where(inArray(roles.id, roleIds));

    if (
      roleDetails.some(
        (r: { code: string }) =>
          r.code === "admin" || r.code === "owner" || r.code === "system_admin",
      )
    ) {
      return ["*"];
    }

    const perms = await db
      .select({ code: permissions.code })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(inArray(rolePermissions.roleId, roleIds));

    return Array.from(new Set(perms.map((p: { code: string }) => p.code)));
  }

  static hasPermission(
    userPermissions: string[],
    requiredPermission: string,
  ): boolean {
    if (userPermissions.includes("*")) {
      return true;
    }
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }
    const [scope] = requiredPermission.split(":");
    if (scope && userPermissions.includes(`${scope}:*`)) {
      return true;
    }
    return false;
  }
}
