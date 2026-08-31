import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { RegulatoryFilingService } from "../../services/regulatory-filing.service.js";
import { ApiError } from "../../errors/api-error.js";

export const regulatoryFilingRouter = Router();

const createFilingSchema = z.object({
  engagementId: z.string().uuid(),
  regulator: z.enum(["FRC", "BSEC", "NBR", "BB", "ICAB"]),
  filingType: z.string().min(1).max(100),
  documentUrl: z.string().url().optional(),
});

const updateFilingSchema = z.object({
  status: z.enum(["pending", "submitted", "accepted", "rejected"]),
  referenceNumber: z.string().optional(),
});

regulatoryFilingRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = createFilingSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid filing payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await RegulatoryFilingService.createFiling(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

regulatoryFilingRouter.patch(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = updateFilingSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid update payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await RegulatoryFilingService.updateFilingStatus(
        tenantId,
        req.params.id,
        membershipId,
        parseResult.data,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

regulatoryFilingRouter.get(
  "/",
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

      const list = await RegulatoryFilingService.getEngagementFilings(
        tenantId,
        engagementId,
      );
      res.json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  },
);
