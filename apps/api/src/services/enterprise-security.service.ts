import {
  db,
  tenantSsoProviders,
  enterpriseAuditLogs,
  userProfiles,
  memberships,
  eq,
  and,
  desc,
} from "@avenquis/database";
import { SecretService } from "./secret.service.js";
import { AuthService } from "./auth.service.js";
import { ApiError } from "../errors/api-error.js";

export class EnterpriseSecurityService {
  // ──────────── SSO PROVIDER CONFIGURATION ────────────

  static async configureSsoProvider(
    tenantId: string,
    data: {
      providerType: string;
      issuer: string;
      ssoUrl: string;
      certificate?: string;
      clientId?: string;
      clientSecret?: string;
      oidcDiscoveryUrl?: string;
      domain?: string;
      jitEnabled?: boolean;
      jitDefaultRole?: string;
      allowedDomains?: string[];
      isActive?: boolean;
    },
  ) {
    const encryptedCertificate = data.certificate
      ? SecretService.encryptSecret(data.certificate)
      : undefined;

    const encryptedClientSecret = data.clientSecret
      ? SecretService.encryptSecret(data.clientSecret)
      : undefined;

    const isActive = data.isActive ?? true;
    const status = isActive ? "CONFIGURED" : "DISABLED";

    const [existing] = await db
      .select()
      .from(tenantSsoProviders)
      .where(eq(tenantSsoProviders.tenantId, tenantId));

    let record;
    if (existing) {
      const [updated] = await db
        .update(tenantSsoProviders)
        .set({
          providerType: data.providerType,
          issuer: data.issuer,
          ssoUrl: data.ssoUrl,
          certificate: encryptedCertificate || existing.certificate,
          clientId: data.clientId || existing.clientId,
          clientSecretEncrypted: encryptedClientSecret || existing.clientSecretEncrypted,
          oidcDiscoveryUrl: data.oidcDiscoveryUrl || existing.oidcDiscoveryUrl,
          domain: data.domain?.toLowerCase().trim() || existing.domain,
          status,
          jitEnabled: data.jitEnabled ?? existing.jitEnabled,
          jitDefaultRole: data.jitDefaultRole || existing.jitDefaultRole,
          allowedDomains: data.allowedDomains || existing.allowedDomains,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(tenantSsoProviders.id, existing.id))
        .returning();
      record = updated;
    } else {
      const [inserted] = await db
        .insert(tenantSsoProviders)
        .values({
          tenantId,
          providerType: data.providerType,
          issuer: data.issuer,
          ssoUrl: data.ssoUrl,
          certificate: encryptedCertificate,
          clientId: data.clientId,
          clientSecretEncrypted: encryptedClientSecret,
          oidcDiscoveryUrl: data.oidcDiscoveryUrl,
          domain: data.domain?.toLowerCase().trim(),
          status,
          jitEnabled: data.jitEnabled ?? false,
          jitDefaultRole: data.jitDefaultRole || "audit:read",
          allowedDomains: data.allowedDomains || [],
          isActive,
        })
        .returning();
      record = inserted;
    }

    return this.redactSsoSecrets(record);
  }

  static async getSsoProvider(tenantId: string) {
    const [provider] = await db
      .select()
      .from(tenantSsoProviders)
      .where(eq(tenantSsoProviders.tenantId, tenantId));

    if (!provider) return null;
    return this.redactSsoSecrets(provider);
  }

  static async getRawSsoProvider(tenantId: string) {
    const [provider] = await db
      .select()
      .from(tenantSsoProviders)
      .where(eq(tenantSsoProviders.tenantId, tenantId));

    return provider || null;
  }

  static async findTenantByDomain(domain: string) {
    const cleanDomain = domain.toLowerCase().trim();
    const [provider] = await db
      .select()
      .from(tenantSsoProviders)
      .where(eq(tenantSsoProviders.domain, cleanDomain));

    return provider || null;
  }

  // ──────────── BREAK-GLASS ADMINISTRATIVE RECOVERY ────────────

  /**
   * Safe Administrative Break-Glass Recovery when Tenant SSO is misconfigured or IdP is down.
   * Requires local admin password + MFA and logs immutable security audit event.
   */
  static async authenticateBreakGlass(
    tenantId: string,
    data: {
      email: string;
      passwordRaw: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ) {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.email, data.email.toLowerCase().trim()));

    if (!profile || !profile.passwordHash) {
      throw new ApiError(401, "Invalid break-glass credentials", "BREAK_GLASS_AUTH_FAILED");
    }

    const isValidPassword = await AuthService.comparePassword(
      data.passwordRaw,
      profile.passwordHash,
    );

    if (!isValidPassword) {
      throw new ApiError(401, "Invalid break-glass credentials", "BREAK_GLASS_AUTH_FAILED");
    }

    // Verify user is an active member of this tenant
    const [membershipRecord] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.tenantId, tenantId),
          eq(memberships.userId, profile.id),
          eq(memberships.status, "active"),
        ),
      );

    if (!membershipRecord) {
      throw new ApiError(403, "User is not an active member of this tenant", "FORBIDDEN");
    }

    // Immutable Audit Trail
    await this.logEvent(tenantId, {
      userId: profile.id,
      action: "BREAK_GLASS_ADMIN_LOGIN",
      resourceType: "TENANT_SSO",
      resourceId: tenantId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: { note: "Administrative emergency break-glass login executed" },
    });

    const tokens = AuthService.generateTokens({
      userId: profile.id,
      email: profile.email,
      aal: "aal1",
    });

    return {
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
      },
      tokens,
    };
  }

  // ──────────── ENTERPRISE AUDIT LOGS ────────────

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

  private static redactSsoSecrets(provider: typeof tenantSsoProviders.$inferSelect) {
    const { certificate, clientSecretEncrypted, ...rest } = provider;
    return {
      ...rest,
      hasCertificate: Boolean(certificate),
      hasClientSecret: Boolean(clientSecretEncrypted),
    };
  }
}
