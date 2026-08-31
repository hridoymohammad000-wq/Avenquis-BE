import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { SamplingEvidenceService } from "../../services/sampling-evidence.service.js";
import { ApiError } from "../../errors/api-error.js";

export const samplingEvidenceRouter = Router();

const calculateSampleSchema = z.object({
  populationSize: z.number().int().positive(),
  confidenceLevelPct: z.number().int().min(1).max(10000).optional(),
  tolerableErrorPct: z.number().int().min(1).max(10000).optional(),
});

const saveSampleSchema = z.object({
  engagementId: z.string().uuid(),
  procedureId: z.string().uuid(),
  populationSize: z.number().int().positive(),
  selectionMethod: z.enum([
    "random",
    "monetary_unit",
    "haphazard",
    "systematic",
  ]),
  confidenceLevelPct: z.number().int().min(1).max(10000).optional(),
  tolerableErrorPct: z.number().int().min(1).max(10000).optional(),
});

const uploadEvidenceSchema = z.object({
  engagementId: z.string().uuid(),
  procedureId: z.string().uuid().optional(),
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().url(),
  referenceCode: z.string().max(100).optional(),
  description: z.string().optional(),
});

// ──────────── SAMPLING ROUTES ────────────

// POST /audit/sampling/calculate - Calculate sample size purely (no save)
samplingEvidenceRouter.post(
  "/sampling/calculate",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  (req, res, next) => {
    try {
      const parseResult = calculateSampleSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid calculation payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const conf = parseResult.data.confidenceLevelPct ?? 9500;
      const te = parseResult.data.tolerableErrorPct ?? 500;

      const sampleSize = SamplingEvidenceService.calculateSampleSize(
        parseResult.data.populationSize,
        conf,
        te,
      );

      res.json({ success: true, data: { sampleSize } });
    } catch (error) {
      next(error);
    }
  },
);

// POST /audit/sampling - Save a sample plan
samplingEvidenceRouter.post(
  "/sampling",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = saveSampleSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid sampling payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await SamplingEvidenceService.saveSamplePlan(
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

// ──────────── EVIDENCE ROUTES ────────────

// POST /audit/evidence - Save evidence metadata
samplingEvidenceRouter.post(
  "/evidence",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = uploadEvidenceSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid evidence payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await SamplingEvidenceService.uploadEvidenceMetadata(
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

// GET /audit/evidence?engagementId= - List evidence
samplingEvidenceRouter.get(
  "/evidence",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const engagementId = req.query.engagementId as string;
      const procedureId = req.query.procedureId as string | undefined;

      if (!engagementId) {
        throw new ApiError(
          400,
          "engagementId query parameter is required",
          "MISSING_ENGAGEMENT_ID",
        );
      }

      const list = await SamplingEvidenceService.listEvidence(
        tenantId,
        engagementId,
        { procedureId },
      );

      res.json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  },
);
