import {
  db,
  tenantSsoProviders,
  enterpriseAuditLogs,
  eq,
  desc,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class EnterpriseSecurityService {
  // --- SSO Provider Management ---
  static async configureSsoProvider(
    tenantId: string,
    data: {
      providerType: string;
      issuer: string;
      ssoUrl: string;
      certificate?: string;
      clientId?: string;
      isActive: boolean;
    }
  ) {
    const [existing] = await db
      .select()
      .from(tenantSsoProviders)
      .where(eq(tenantSsoProviders.tenantId, tenantId));

    if (existing) {
      const [updated] = await db
        .update(tenantSsoProviders)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(tenantSsoProviders.id, existing.id))
        .returning();
      return updated;
    }

    const [inserted] = await db
      .insert(tenantSsoProviders)
      .values({
        tenantId,
        ...data,
      })
      .returning();

    return inserted;
  }

  static async getSsoProvider(tenantId: string) {
    const [provider] = await db
      .select()
      .from(tenantSsoProviders)
      .where(eq(tenantSsoProviders.tenantId, tenantId));
    
    return provider || null;
  }

  // --- Enterprise Audit Logs ---
  static async logEvent(
    tenantId: string,
    data: {
      userId?: string;
      action: string;
      resourceType?: string;
      resourceId?: string;
      metadata?: any;
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    const [log] = await db
      .insert(enterpriseAuditLogs)
      .values({
        tenantId,
        ...data,
      })
      .returning();
    return log;
  }

  static async getAuditLogs(tenantId: string, limit = 50, offset = 0) {
    return db
      .select()
      .from(enterpriseAuditLogs)
      .where(eq(enterpriseAuditLogs.tenantId, tenantId))
      .orderBy(desc(enterpriseAuditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }
}
