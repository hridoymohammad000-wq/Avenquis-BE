import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { QualityControlService } from "../../services/quality-control.service.js";
import { ApiError } from "../../errors/api-error.js";

export const qualityControlRouter = Router();

const addQcItemSchema = z.object({
  engagementId: z.string().uuid(),
  category: z.string().min(1).max(50),
  questionText: z.string().min(1),
});

const evaluateQcItemSchema = z.object({
  isCompliant: z.boolean(),
  comments: z.string().optional(),
});

qualityControlRouter.post(
  "/quality-controls",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = addQcItemSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid QC payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await QualityControlService.addQcItem(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

qualityControlRouter.patch(
  "/quality-controls/:id",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = evaluateQcItemSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid QC evaluation payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await QualityControlService.evaluateQcItem(
        tenantId,
        membershipId,
        req.params.id,
        parseResult.data,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

qualityControlRouter.get(
  "/quality-controls",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const engagementId = req.query.engagementId as string;

      if (!engagementId) {
        throw new ApiError(
          400,
          "engagementId query parameter is required",
          "MISSING_ENGAGEMENT_ID",
        );
      }

      const list = await QualityControlService.getQcItems(
        tenantId,
        engagementId,
      );

      res.json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  },
);
