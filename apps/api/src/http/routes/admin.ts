import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { AdminService } from "../../services/admin.service.js";
import { ApiError } from "../../errors/api-error.js";

export const adminRouter = Router();

const updateFeatureFlagSchema = z.object({
  code: z.string().min(2).max(100),
  enabled: z.boolean(),
});

// GET /system-health - Global system health check
adminRouter.get(
  "/system-health",
  authenticate,
  requireTenantContext,
  requirePermission("admin:read"),
  async (_req, res, next) => {
    try {
      const health = await AdminService.getSystemHealth();
      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /security-events - Tenant security audit logs
adminRouter.get(
  "/security-events",
  authenticate,
  requireTenantContext,
  requirePermission("admin:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const severity = req.query.severity as string | undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : undefined;

      const events = await AdminService.listSecurityEvents(tenantId, {
        severity,
        limit,
        offset,
      });

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /deployment-profile - Get tenant deployment profile & feature flags
adminRouter.get(
  "/deployment-profile",
  authenticate,
  requireTenantContext,
  requirePermission("admin:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const profile = await AdminService.getTenantDeploymentProfile(tenantId);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /feature-flags - Update tenant feature flag
adminRouter.patch(
  "/feature-flags",
  authenticate,
  requireTenantContext,
  requirePermission("admin:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = updateFeatureFlagSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid feature flag payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const flag = await AdminService.updateFeatureFlag(
        tenantId,
        parseResult.data.code,
        parseResult.data.enabled,
      );

      res.json({
        success: true,
        data: flag,
      });
    } catch (error) {
      next(error);
    }
  },
);
