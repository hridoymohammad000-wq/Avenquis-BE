import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { AiIntelligenceService } from "../../services/ai-intelligence.service.js";
import { ApiError } from "../../errors/api-error.js";

export const aiIntelligenceRouter = Router();

const docAnalysisSchema = z.object({
  engagementId: z.string().uuid().optional(),
  documentUrl: z.string().url(),
  documentType: z.string().min(1).max(100),
  model: z.string().optional(),
  provider: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

const engReviewSchema = z.object({
  aiModel: z.string().min(1),
  provider: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

const humanReviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "OVERRIDDEN"]),
  humanCorrections: z.record(z.string(), z.unknown()).optional(),
  reviewNotes: z.string().optional(),
});

// ──────────── DOCUMENT ANALYSIS ────────────

aiIntelligenceRouter.post(
  "/documents/analyze",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = docAnalysisSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid analysis payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const idempotencyKey =
        (req.headers["x-idempotency-key"] as string) || parseResult.data.idempotencyKey;

      const result = await AiIntelligenceService.requestDocumentAnalysis(
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

aiIntelligenceRouter.get(
  "/documents/analyze/:id",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const result = await AiIntelligenceService.getDocumentAnalysis(
        tenantId,
        req.params.id,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

aiIntelligenceRouter.post(
  "/documents/analyze/:id/review",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = humanReviewSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid human review payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await AiIntelligenceService.reviewDocumentAnalysis(
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

// ──────────── ENGAGEMENT REVIEW ────────────

aiIntelligenceRouter.post(
  "/engagements/:engagementId/review",
  authenticate,
  requireTenantContext,
  requirePermission("audit:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = engReviewSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid review payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const idempotencyKey =
        (req.headers["x-idempotency-key"] as string) || parseResult.data.idempotencyKey;

      const result = await AiIntelligenceService.requestEngagementReview(
        tenantId,
        membershipId,
        {
          engagementId: req.params.engagementId,
          aiModel: parseResult.data.aiModel,
          provider: parseResult.data.provider,
          idempotencyKey,
        },
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

aiIntelligenceRouter.get(
  "/engagements/:engagementId/review/:id",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const result = await AiIntelligenceService.getEngagementReview(
        tenantId,
        req.params.id,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

aiIntelligenceRouter.post(
  "/engagements/:engagementId/review/:id/review",
  authenticate,
  requireTenantContext,
  requirePermission("audit:signoff"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = humanReviewSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid human review payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await AiIntelligenceService.reviewEngagementReview(
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
