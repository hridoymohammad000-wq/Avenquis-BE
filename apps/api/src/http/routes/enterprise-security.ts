import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { EnterpriseSecurityService } from "../../services/enterprise-security.service.js";
import { OidcSsoAdapter } from "../../services/sso/oidc-sso.adapter.js";
import { SamlSsoAdapter } from "../../services/sso/saml-sso.adapter.js";
import { ApiError } from "../../errors/api-error.js";

export const enterpriseSecurityRouter = Router();

const ssoProviderSchema = z.object({
  providerType: z.enum(["saml", "oidc"]),
  issuer: z.string().min(1),
  ssoUrl: z.string().url(),
  certificate: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  oidcDiscoveryUrl: z.string().url().optional(),
  domain: z.string().min(1).optional(),
  jitEnabled: z.boolean().optional().default(false),
  jitDefaultRole: z.string().optional().default("audit:read"),
  allowedDomains: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

const oidcAuthorizeSchema = z.object({
  redirectUri: z.string().url(),
});

const oidcCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  claims: z
    .object({
      iss: z.string(),
      sub: z.string(),
      aud: z.string(),
      exp: z.number(),
      iat: z.number(),
      nonce: z.string().optional(),
      email: z.string().email(),
      given_name: z.string().optional(),
      family_name: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
});

const samlAcsSchema = z.object({
  assertionId: z.string().min(1),
  issuer: z.string().min(1),
  audience: z.string().min(1),
  subjectEmail: z.string().email(),
  notOnOrAfter: z.string().min(1),
  isSigned: z.boolean().default(true),
  signatureValid: z.boolean().default(true),
  attributes: z.record(z.string(), z.string()).optional(),
});

const breakGlassSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// ──────────── SSO CONFIGURATION ────────────

enterpriseSecurityRouter.post(
  "/sso",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = ssoProviderSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid SSO provider payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await EnterpriseSecurityService.configureSsoProvider(
        tenantId,
        parseResult.data,
      );

      await EnterpriseSecurityService.logEvent(tenantId, {
        userId: req.user!.id,
        action: "CONFIGURE_SSO",
        resourceType: "SSO_PROVIDER",
        resourceId: result.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

enterpriseSecurityRouter.get(
  "/sso",
  authenticate,
  requireTenantContext,
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const result = await EnterpriseSecurityService.getSsoProvider(tenantId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── OIDC SSO ENDPOINTS ────────────

enterpriseSecurityRouter.post(
  "/sso/oidc/authorize",
  authenticate,
  requireTenantContext,
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = oidcAuthorizeSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid authorize payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const provider = await EnterpriseSecurityService.getRawSsoProvider(tenantId);
      if (!provider || provider.providerType !== "oidc") {
        throw new ApiError(400, "OIDC SSO is not configured for this tenant", "SSO_NOT_CONFIGURED");
      }

      const result = await OidcSsoAdapter.generateAuthUrl(
        tenantId,
        provider,
        parseResult.data.redirectUri,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

enterpriseSecurityRouter.post(
  "/sso/oidc/callback",
  requireTenantContext,
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = oidcCallbackSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid callback payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const provider = await EnterpriseSecurityService.getRawSsoProvider(tenantId);
      if (!provider || provider.providerType !== "oidc") {
        throw new ApiError(400, "OIDC SSO is not configured for this tenant", "SSO_NOT_CONFIGURED");
      }

      const result = await OidcSsoAdapter.handleCallback(
        tenantId,
        provider,
        parseResult.data,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── SAML 2.0 ENDPOINTS ────────────

enterpriseSecurityRouter.get("/sso/saml/metadata", async (req, res, next) => {
  try {
    const tenantId = req.query.tenantId as string;
    if (!tenantId) {
      throw new ApiError(400, "tenantId parameter is required", "MISSING_TENANT_ID");
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const xml = SamlSsoAdapter.generateSpMetadata(tenantId, baseUrl);

    res.header("Content-Type", "application/xml").send(xml);
  } catch (error) {
    next(error);
  }
});

enterpriseSecurityRouter.post(
  "/sso/saml/acs",
  requireTenantContext,
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = samlAcsSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid SAML ACS payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const provider = await EnterpriseSecurityService.getRawSsoProvider(tenantId);
      if (!provider || provider.providerType !== "saml") {
        throw new ApiError(400, "SAML SSO is not configured for this tenant", "SSO_NOT_CONFIGURED");
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const notOnOrAfter = new Date(parseResult.data.notOnOrAfter);

      const result = await SamlSsoAdapter.processAcsResponse(
        tenantId,
        provider,
        baseUrl,
        {
          ...parseResult.data,
          notOnOrAfter,
        },
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── BREAK-GLASS ADMINISTRATIVE RECOVERY ────────────

enterpriseSecurityRouter.post(
  "/sso/break-glass",
  requireTenantContext,
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = breakGlassSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid break-glass payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await EnterpriseSecurityService.authenticateBreakGlass(
        tenantId,
        {
          email: parseResult.data.email,
          passwordRaw: parseResult.data.password,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        },
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── ENTERPRISE AUDIT LOGS ────────────

enterpriseSecurityRouter.get(
  "/audit-logs",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const result = await EnterpriseSecurityService.getAuditLogs(tenantId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);
