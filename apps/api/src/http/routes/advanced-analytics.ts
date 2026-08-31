import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { AdvancedAnalyticsService } from "../../services/advanced-analytics.service.js";
import { ApiError } from "../../errors/api-error.js";

export const advancedAnalyticsRouter = Router();

const allocateSchema = z.object({
  membershipId: z.string().uuid(),
  engagementId: z.string().uuid(),
  allocatedHours: z.number().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  notes: z.string().optional(),
});

const profitabilitySchema = z.object({
  engagementId: z.string().uuid(),
  budgetedHours: z.number().min(0),
  actualHours: z.number().min(0),
  estimatedRevenue: z.number().min(0),
  actualCost: z.number().min(0),
});

// ──────────── WORKLOAD ────────────

advancedAnalyticsRouter.post(
  "/allocations",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"), // Resource managers / Partners
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = allocateSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid allocation payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await AdvancedAnalyticsService.allocateResource(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

advancedAnalyticsRouter.get(
  "/workload/:membershipId",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const result = await AdvancedAnalyticsService.getStaffWorkload(
        tenantId,
        req.params.membershipId,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── PROFITABILITY ────────────

advancedAnalyticsRouter.post(
  "/profitability",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"), // Partner only
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = profitabilitySchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid profitability payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await AdvancedAnalyticsService.recordProfitabilitySnapshot(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

advancedAnalyticsRouter.get(
  "/profitability/:engagementId",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const result = await AdvancedAnalyticsService.getEngagementProfitability(
        tenantId,
        req.params.engagementId,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);
