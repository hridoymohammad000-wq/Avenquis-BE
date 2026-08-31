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
});

const engReviewSchema = z.object({
  aiModel: z.enum(["gemini-1.5-pro", "gpt-4"]),
});

// ──────────── DOCUMENT ANALYSIS ────────────

aiIntelligenceRouter.post(
  "/documents/analyze",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"), // Assuming standard staff can request doc analysis
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

      const result = await AiIntelligenceService.requestDocumentAnalysis(
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

      if (!result) {
        throw new ApiError(404, "Analysis not found", "NOT_FOUND");
      }

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
  requirePermission("audit:manage"), // Higher privilege required for full engagement AI review
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

      const result = await AiIntelligenceService.requestEngagementReview(
        tenantId,
        membershipId,
        {
          engagementId: req.params.engagementId,
          aiModel: parseResult.data.aiModel,
        },
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);
