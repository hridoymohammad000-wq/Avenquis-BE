import {
  db,
  tenants,
  memberships,
  roles,
  membershipRoles,
  eq,
  and,
  lte,
  or,
  isNull,
  gt,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class TenantService {
  static async getUserMemberships(userId: string) {
    return db
      .select({
        membershipId: memberships.id,
        tenantId: memberships.tenantId,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        status: memberships.status,
        startAt: memberships.startAt,
        expiresAt: memberships.expiresAt,
      })
      .from(memberships)
      .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.status, "active"),
          eq(tenants.status, "active"),
          lte(memberships.startAt, new Date()),
          or(
            isNull(memberships.expiresAt),
            gt(memberships.expiresAt, new Date()),
          ),
        ),
      );
  }

  static async validateTenantMembership(userId: string, tenantId: string) {
    const membership = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.userId, userId),
        eq(memberships.tenantId, tenantId),
      ),
    });

    if (!membership) {
      throw new ApiError(
        403,
        "Access denied: Not a member of this tenant",
        "TENANT_MEMBERSHIP_NOT_FOUND",
      );
    }

    if (membership.status !== "active") {
      throw new ApiError(
        403,
        `Access denied: Membership status is ${membership.status}`,
        "MEMBERSHIP_INACTIVE",
      );
    }

    const now = new Date();
    if (membership.startAt && new Date(membership.startAt) > now) {
      throw new ApiError(
        403,
        "Access denied: Membership has not started yet",
        "MEMBERSHIP_NOT_STARTED",
      );
    }

    if (membership.expiresAt && new Date(membership.expiresAt) <= now) {
      throw new ApiError(
        403,
        "Access denied: Membership has expired",
        "MEMBERSHIP_EXPIRED",
      );
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant || tenant.status !== "active") {
      throw new ApiError(
        403,
        "Access denied: Tenant is disabled or suspended",
        "TENANT_INACTIVE",
      );
    }

    return { membership, tenant };
  }

  static async createTenant(params: {
    name: string;
    slug: string;
    ownerUserId: string;
  }) {
    return db.transaction(async (tx) => {
      const [newTenant] = await tx
        .insert(tenants)
        .values({
          name: params.name,
          slug: params.slug,
          status: "active",
        })
        .returning();

      const [membership] = await tx
        .insert(memberships)
        .values({
          tenantId: newTenant.id,
          userId: params.ownerUserId,
          status: "active",
        })
        .returning();

      let adminRole = await tx.query.roles.findFirst({
        where: and(eq(roles.tenantId, newTenant.id), eq(roles.code, "admin")),
      });

      if (!adminRole) {
        const [createdRole] = await tx
          .insert(roles)
          .values({
            tenantId: newTenant.id,
            code: "admin",
            name: "Tenant Administrator",
            description: "Full administrative access to the tenant",
            isSystem: true,
          })
          .returning();
        adminRole = createdRole;
      }

      await tx.insert(membershipRoles).values({
        membershipId: membership.id,
        roleId: adminRole.id,
      });

      return { tenant: newTenant, membership };
    });
  }
}
