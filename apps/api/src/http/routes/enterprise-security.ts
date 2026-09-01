import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { EnterpriseSecurityService } from "../../services/enterprise-security.service.js";
import { ApiError } from "../../errors/api-error.js";

export const enterpriseSecurityRouter = Router();

const ssoProviderSchema = z.object({
  providerType: z.enum(["saml", "oidc"]),
  issuer: z.string().min(1),
  ssoUrl: z.string().url(),
  certificate: z.string().optional(),
  clientId: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Configure SSO
enterpriseSecurityRouter.post(
  "/sso",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage", { requireAal2: true }),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = ssoProviderSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await EnterpriseSecurityService.configureSsoProvider(
        tenantId,
        parseResult.data,
      );

      // Log this action
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

// Get SSO Config
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

// Get Audit Logs
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
