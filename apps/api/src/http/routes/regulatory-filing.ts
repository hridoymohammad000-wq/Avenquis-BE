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
  idempotencyKey: z.string().optional(),
  status: z.string().optional(),
});

const updateFilingSchema = z.object({
  status: z.string().min(1),
  referenceNumber: z.string().optional(),
  rejectionReason: z.string().optional(),
});

const manualReceiptSchema = z.object({
  referenceNumber: z.string().min(1),
  status: z.enum(["SUBMITTED", "ACCEPTED"]).optional(),
  receiptMetadata: z.record(z.string(), z.unknown()).optional(),
});

regulatoryFilingRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = createFilingSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid filing payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const idempotencyKey =
        (req.headers["x-idempotency-key"] as string) || parseResult.data.idempotencyKey;

      const result = await RegulatoryFilingService.createFiling(
        tenantId,
        membershipId,
        {
          ...parseResult.data,
          idempotencyKey,
        },
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

regulatoryFilingRouter.post(
  "/:id/submit",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const idempotencyKey = req.headers["x-idempotency-key"] as string;

      const result = await RegulatoryFilingService.submitFiling(
        tenantId,
        req.params.id,
        membershipId,
        { idempotencyKey },
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

regulatoryFilingRouter.post(
  "/:id/manual-receipt",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = manualReceiptSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid manual receipt payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await RegulatoryFilingService.recordManualReceipt(
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
