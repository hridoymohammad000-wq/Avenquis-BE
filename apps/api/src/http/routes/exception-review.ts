import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { ExceptionReviewService } from "../../services/exception-review.service.js";
import { ApiError } from "../../errors/api-error.js";

export const exceptionReviewRouter = Router();

const raiseExceptionSchema = z.object({
  engagementId: z.string().uuid(),
  procedureId: z.string().uuid().optional(),
  exceptionType: z.enum([
    "misstatement",
    "control_failure",
    "scope_limitation",
    "compliance_breach",
  ]),
  description: z.string().min(1),
  financialImpact: z.number().optional(),
});

const updateExceptionSchema = z.object({
  resolutionStatus: z.enum([
    "open",
    "adjusted",
    "unadjusted",
    "management_letter",
    "waived",
  ]),
  managementResponse: z.string().optional(),
  financialImpact: z.number().optional(),
});

const createReviewSchema = z.object({
  engagementId: z.string().uuid(),
  reviewType: z.enum(["hot_review", "cold_review", "eqcr"]),
  findings: z.string().optional(),
});

const signOffReviewSchema = z.object({
  status: z.enum(["completed", "requires_rework"]),
  findings: z.string().optional(),
});

// ──────────── EXCEPTIONS (SUD) ────────────

exceptionReviewRouter.post(
  "/exceptions",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = raiseExceptionSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid exception payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await ExceptionReviewService.raiseException(
        tenantId,
        membershipId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

exceptionReviewRouter.patch(
  "/exceptions/:id",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = updateExceptionSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid exception update payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await ExceptionReviewService.updateExceptionStatus(
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

exceptionReviewRouter.get(
  "/exceptions/sud",
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

      const result = await ExceptionReviewService.getSudSummary(
        tenantId,
        engagementId,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── REVIEWS ────────────

exceptionReviewRouter.post(
  "/reviews",
  authenticate,
  requireTenantContext,
  requirePermission("audit:review"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = createReviewSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid review payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await ExceptionReviewService.createReview(
        tenantId,
        membershipId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

exceptionReviewRouter.patch(
  "/reviews/:id/signoff",
  authenticate,
  requireTenantContext,
  requirePermission("audit:review"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = signOffReviewSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid review signoff payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await ExceptionReviewService.signOffReview(
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

exceptionReviewRouter.get(
  "/reviews",
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

      const list = await ExceptionReviewService.listReviews(
        tenantId,
        engagementId,
      );

      res.json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  },
);
