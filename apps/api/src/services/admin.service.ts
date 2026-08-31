import {
  db,
  securityEvents,
  featureFlags,
  tenants,
  memberships,
  userProfiles,
  eq,
  and,
  desc,
} from "@avenquis/database";

export class AdminService {
  static async listSecurityEvents(
    tenantId: string,
    options?: {
      severity?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const conditions = [eq(securityEvents.tenantId, tenantId)];
    if (options?.severity) {
      conditions.push(eq(securityEvents.severity, options.severity));
    }

    const events = await db
      .select({
        id: securityEvents.id,
        tenantId: securityEvents.tenantId,
        membershipId: securityEvents.membershipId,
        userFullName: userProfiles.fullName,
        userEmail: userProfiles.email,
        eventType: securityEvents.eventType,
        severity: securityEvents.severity,
        details: securityEvents.details,
        ipAddress: securityEvents.ipAddress,
        createdAt: securityEvents.createdAt,
      })
      .from(securityEvents)
      .leftJoin(memberships, eq(securityEvents.membershipId, memberships.id))
      .leftJoin(userProfiles, eq(memberships.userId, userProfiles.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(securityEvents.createdAt));

    return events;
  }

  static async getSystemHealth() {
    const dbCheck = await db.query.tenants.findFirst();
    const activeTenantsCount = (await db.select().from(tenants)).length;

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: dbCheck ? "connected" : "idle",
        authentication: "healthy",
        multiTenantRls: "active",
      },
      metrics: {
        activeTenantsCount,
        uptimeSeconds: Math.floor(process.uptime()),
      },
    };
  }

  static async getTenantDeploymentProfile(tenantId: string) {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    const flags = await db.query.featureFlags.findMany({
      where: eq(featureFlags.tenantId, tenantId),
    });

    return {
      tenantId,
      tenantName: tenant?.name,
      tenantSlug: tenant?.slug,
      status: tenant?.status,
      deploymentTier: "enterprise",
      featureFlags: flags.map((f) => ({
        code: f.code,
        enabled: f.enabled,
      })),
    };
  }

  static async updateFeatureFlag(
    tenantId: string,
    code: string,
    enabled: boolean,
  ) {
    const existing = await db.query.featureFlags.findFirst({
      where: and(
        eq(featureFlags.tenantId, tenantId),
        eq(featureFlags.code, code),
      ),
    });

    if (existing) {
      const [updated] = await db
        .update(featureFlags)
        .set({ enabled })
        .where(eq(featureFlags.id, existing.id))
        .returning();
      return updated;
    }

    const [inserted] = await db
      .insert(featureFlags)
      .values({
        tenantId,
        code,
        enabled,
      })
      .returning();

    return inserted;
  }
}
