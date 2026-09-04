import {
  db,
  tenantSsoProviders,
  samlReplayAudit,
  userProfiles,
  memberships,
  eq,
} from "@avenquis/database";
import { ApiError } from "../../errors/api-error.js";

export interface SamlAssertion {
  assertionId: string;
  issuer: string;
  audience: string;
  subjectEmail: string;
  notOnOrAfter: Date;
  isSigned: boolean;
  signatureValid: boolean;
  attributes?: Record<string, string>;
}

export class SamlSsoAdapter {
  /**
   * Generates SP Metadata XML for tenant SAML configuration.
   */
  static generateSpMetadata(tenantId: string, baseUrl: string): string {
    const entityId = `${baseUrl}/api/v1/security/sso/saml/metadata?tenantId=${tenantId}`;
    const acsUrl = `${baseUrl}/api/v1/security/sso/saml/acs?tenantId=${tenantId}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${entityId}">
  <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acsUrl}" index="1"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
  }

  /**
   * Processes SAML Response ACS payload with assertion signature, issuer, audience, replay, and expiry checks.
   */
  static async processAcsResponse(
    tenantId: string,
    ssoProvider: typeof tenantSsoProviders.$inferSelect,
    baseUrl: string,
    assertion: SamlAssertion,
  ) {
    if (!ssoProvider.isActive || ssoProvider.status === "DISABLED") {
      throw new ApiError(400, "Tenant SSO provider is disabled", "SSO_DISABLED");
    }

    // 1. Signature Verification Requirement
    if (!ssoProvider.certificate) {
      throw new ApiError(
        400,
        "Tenant SSO provider missing X.509 verification certificate",
        "MISSING_CERTIFICATE",
      );
    }

    if (!assertion.isSigned || !assertion.signatureValid) {
      throw new ApiError(
        400,
        "SAML Assertion signature verification failed or signature missing",
        "SAML_SIGNATURE_INVALID",
      );
    }

    // 2. Issuer Validation
    if (assertion.issuer !== ssoProvider.issuer) {
      throw new ApiError(
        400,
        `SAML Issuer mismatch: expected ${ssoProvider.issuer}, got ${assertion.issuer}`,
        "ISSUER_MISMATCH",
      );
    }

    // 3. Audience Validation
    const expectedAudience = `${baseUrl}/api/v1/security/sso/saml/metadata?tenantId=${tenantId}`;
    if (assertion.audience && assertion.audience !== expectedAudience && !assertion.audience.includes(tenantId)) {
      throw new ApiError(
        400,
        `SAML Audience mismatch: expected ${expectedAudience}, got ${assertion.audience}`,
        "AUDIENCE_MISMATCH",
      );
    }

    // 4. Expiry Validation
    if (assertion.notOnOrAfter.getTime() <= Date.now()) {
      throw new ApiError(400, "SAML Assertion has expired", "ASSERTION_EXPIRED");
    }

    // 5. Replay Protection
    const [existingReplay] = await db
      .select()
      .from(samlReplayAudit)
      .where(eq(samlReplayAudit.assertionId, assertion.assertionId));

    if (existingReplay) {
      throw new ApiError(
        400,
        "SAML Assertion ID has already been consumed (replay attack)",
        "SAML_REPLAY_DETECTED",
      );
    }

    await db.insert(samlReplayAudit).values({
      tenantId,
      assertionId: assertion.assertionId,
      issuer: assertion.issuer,
      expiresAt: assertion.notOnOrAfter,
    });

    // 6. Domain Mapping & Account Takeover Prevention
    const userEmail = assertion.subjectEmail.toLowerCase().trim();
    const emailDomain = userEmail.split("@")[1];

    if (ssoProvider.domain && emailDomain !== ssoProvider.domain.toLowerCase()) {
      const allowed = (ssoProvider.allowedDomains as string[]) || [];
      if (!allowed.includes(emailDomain)) {
        throw new ApiError(
          403,
          `User domain ${emailDomain} is not authorized for tenant SSO domain ${ssoProvider.domain}`,
          "TENANT_SSO_DOMAIN_MISMATCH",
        );
      }
    }

    // 7. User Lookup / Safe JIT Provisioning
    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.email, userEmail));

    let userRecord = existingProfile;

    if (!userRecord) {
      if (!ssoProvider.jitEnabled) {
        throw new ApiError(
          403,
          "User profile does not exist and JIT provisioning is disabled for this tenant",
          "JIT_DISABLED",
        );
      }

      // Safe JIT Provisioning Rule: NEVER grant privileged roles automatically!
      const requestedRole = ssoProvider.jitDefaultRole || "audit:read";
      const FORBIDDEN_JIT_ROLES = ["admin", "partner", "super_admin", "admin:manage"];
      const safeRole = FORBIDDEN_JIT_ROLES.includes(requestedRole.toLowerCase())
        ? "audit:read"
        : requestedRole;

      const [newProfile] = await db
        .insert(userProfiles)
        .values({
          email: userEmail,
          fullName: assertion.attributes?.fullName || `SAML User (${userEmail}) - ${safeRole}`,
          status: "active",
        })
        .returning();

      userRecord = newProfile;

      await db.insert(memberships).values({
        tenantId,
        userId: userRecord.id,
        status: "active",
      });
    }

    return {
      user: userRecord,
      assertionId: assertion.assertionId,
    };
  }
}
