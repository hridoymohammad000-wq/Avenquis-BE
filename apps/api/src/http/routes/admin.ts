import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { AdminService } from "../../services/admin.service.js";
import { ApiError } from "../../errors/api-error.js";

export const adminRouter = Router();

const updateFeatureFlagSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z0-9_.-]+$/),
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
      const paginationSchema = z.object({
        limit: z.coerce.number().int().min(1).max(100).optional(),
        offset: z.coerce.number().int().min(0).optional(),
        severity: z.enum(["info", "warning", "critical"]).optional(),
      });
      const pagination = paginationSchema.safeParse(req.query);
      if (!pagination.success) {
        throw new ApiError(
          400,
          "Invalid security events query",
          "INVALID_QUERY",
          pagination.error.flatten(),
        );
      }

      const events = await AdminService.listSecurityEvents(tenantId, {
        ...pagination.data,
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
