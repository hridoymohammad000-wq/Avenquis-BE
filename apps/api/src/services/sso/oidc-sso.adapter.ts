import {
  db,
  tenantSsoProviders,
  ssoSecurityStates,
  userProfiles,
  memberships,
  eq,
  and,
} from "@avenquis/database";
import crypto from "crypto";
import { ApiError } from "../../errors/api-error.js";

export interface OidcClaims {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  nonce?: string;
  email: string;
  given_name?: string;
  family_name?: string;
  name?: string;
}

export class OidcSsoAdapter {
  /**
   * Generates authorization request URL with single-use PKCE challenge, state, and nonce.
   */
  static async generateAuthUrl(
    tenantId: string,
    ssoProvider: typeof tenantSsoProviders.$inferSelect,
    redirectUri: string,
  ) {
    if (!ssoProvider.isActive || ssoProvider.status === "DISABLED") {
      throw new ApiError(400, "Tenant SSO provider is disabled", "SSO_DISABLED");
    }

    const state = crypto.randomBytes(32).toString("hex");
    const nonce = crypto.randomBytes(32).toString("hex");
    const codeVerifier = crypto.randomBytes(48).toString("hex");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(ssoSecurityStates).values({
      tenantId,
      state,
      nonce,
      codeVerifier,
      providerType: "oidc",
      expiresAt,
    });

    const ssoUrl = ssoProvider.ssoUrl;
    const clientId = ssoProvider.clientId || "";

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "openid profile email",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return {
      authUrl: `${ssoUrl}${ssoUrl.includes("?") ? "&" : "?"}${params.toString()}`,
      state,
      nonce,
      codeVerifier,
    };
  }

  /**
   * Processes OIDC authorization code callback and validates ID Token claims.
   */
  static async handleCallback(
    tenantId: string,
    ssoProvider: typeof tenantSsoProviders.$inferSelect,
    data: {
      code: string;
      state: string;
      rawIdToken?: string;
      claims?: OidcClaims;
    },
  ) {
    if (!ssoProvider.isActive || ssoProvider.status === "DISABLED") {
      throw new ApiError(400, "Tenant SSO provider is disabled", "SSO_DISABLED");
    }

    // 1. Single-use state & nonce validation
    const [stateRecord] = await db
      .select()
      .from(ssoSecurityStates)
      .where(
        and(
          eq(ssoSecurityStates.tenantId, tenantId),
          eq(ssoSecurityStates.state, data.state),
        ),
      );

    if (!stateRecord) {
      throw new ApiError(400, "Invalid or missing OAuth state parameter", "INVALID_STATE");
    }

    if (stateRecord.consumedAt) {
      throw new ApiError(400, "OAuth state parameter has already been consumed (replay attack)", "STATE_REPLAY_DETECTED");
    }

    if (new Date() > stateRecord.expiresAt) {
      throw new ApiError(400, "OAuth state parameter has expired", "STATE_EXPIRED");
    }

    // Mark state as consumed immediately
    await db
      .update(ssoSecurityStates)
      .set({ consumedAt: new Date() })
      .where(eq(ssoSecurityStates.id, stateRecord.id));

    // 2. Validate OIDC Claims
    const claims = data.claims;
    if (!claims) {
      throw new ApiError(400, "OIDC ID token claims are missing", "INVALID_ID_TOKEN");
    }

    // Issuer Validation
    if (claims.iss !== ssoProvider.issuer) {
      throw new ApiError(
        400,
        `OIDC Issuer mismatch: expected ${ssoProvider.issuer}, got ${claims.iss}`,
        "ISSUER_MISMATCH",
      );
    }

    // Audience Validation
    if (ssoProvider.clientId && claims.aud !== ssoProvider.clientId) {
      throw new ApiError(
        400,
        `OIDC Audience mismatch: expected ${ssoProvider.clientId}, got ${claims.aud}`,
        "AUDIENCE_MISMATCH",
      );
    }

    // Expiry Validation
    if (claims.exp * 1000 <= Date.now()) {
      throw new ApiError(400, "OIDC ID token has expired", "TOKEN_EXPIRED");
    }

    // Nonce Validation
    if (stateRecord.nonce && claims.nonce !== stateRecord.nonce) {
      throw new ApiError(400, "OIDC Nonce mismatch", "NONCE_MISMATCH");
    }

    // 3. Domain Mapping & Account Takeover Prevention
    const userEmail = claims.email.toLowerCase().trim();
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

    // 4. User Lookup or Safe JIT Provisioning
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
          fullName: claims.name || `${claims.given_name || "SSO"} ${claims.family_name || "User"} (${safeRole})`,
          status: "active",
        })
        .returning();

      userRecord = newProfile;

      // Provision non-privileged tenant membership
      await db.insert(memberships).values({
        tenantId,
        userId: userRecord.id,
        status: "active",
      });
    }

    return {
      user: userRecord,
      claims,
    };
  }
}
