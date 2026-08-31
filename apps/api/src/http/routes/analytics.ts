import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { AnalyticsService } from "../../services/analytics.service.js";

export const analyticsRouter = Router();

// GET /dashboard - Executive dashboard metrics & KPIs
analyticsRouter.get(
  "/dashboard",
  authenticate,
  requireTenantContext,
  requirePermission("analytics:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const data =
        await AnalyticsService.getExecutiveDashboardMetrics(tenantId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /engagements/:id/health - Engagement health report
analyticsRouter.get(
  "/engagements/:id/health",
  authenticate,
  requireTenantContext,
  requirePermission("analytics:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const engagementId = req.params.id;

      const report = await AnalyticsService.getEngagementHealthReport(
        tenantId,
        engagementId,
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },
);
