import {
  db,
  tenantSsoProviders,
  enterpriseAuditLogs,
  eq,
  desc,
} from "@avenquis/database";

import { SecretService } from "./secret.service.js";

export class EnterpriseSecurityService {
  private static redactProvider<T extends { certificate?: string | null }>(
    provider: T,
  ) {
    const safeProvider = { ...provider };
    delete safeProvider.certificate;
    return safeProvider;
  }

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
    },
  ) {
    const encryptedCertificate = data.certificate
      ? SecretService.encryptSecret(data.certificate)
      : undefined;

    const [existing] = await db
      .select()
      .from(tenantSsoProviders)
      .where(eq(tenantSsoProviders.tenantId, tenantId));

    if (existing) {
      const [updated] = await db
        .update(tenantSsoProviders)
        .set({
          ...data,
          certificate: encryptedCertificate,
          updatedAt: new Date(),
        })
        .where(eq(tenantSsoProviders.id, existing.id))
        .returning();
      return {
        ...this.redactProvider(updated),
        ssoFlowStatus: "CONFIGURATION_ONLY_NOT_CONNECTED",
        isLiveIdentityProvider: false,
        note: "SSO metadata saved. Live SAML/OIDC identity assertion binding requires active IdP connection endpoint.",
      };
    }

    const [inserted] = await db
      .insert(tenantSsoProviders)
      .values({
        tenantId,
        ...data,
        certificate: encryptedCertificate,
      })
      .returning();

    return {
      ...this.redactProvider(inserted),
      ssoFlowStatus: "CONFIGURATION_ONLY_NOT_CONNECTED",
      isLiveIdentityProvider: false,
      note: "SSO metadata saved. Live SAML/OIDC identity assertion binding requires active IdP connection endpoint.",
    };
  }

  static async getSsoProvider(tenantId: string) {
    const [provider] = await db
      .select()
      .from(tenantSsoProviders)
      .where(eq(tenantSsoProviders.tenantId, tenantId));

    return provider
      ? {
          ...this.redactProvider(provider),
          ssoFlowStatus: "CONFIGURATION_ONLY_NOT_CONNECTED",
          isLiveIdentityProvider: false,
        }
      : null;
  }

  // --- Enterprise Audit Logs ---
  static async logEvent(
    tenantId: string,
    data: {
      userId?: string;
      action: string;
      resourceType?: string;
      resourceId?: string;
      metadata?: unknown;
      ipAddress?: string;
      userAgent?: string;
    },
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
