import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { MaterialityService } from "../../services/materiality.service.js";
import { ApiError } from "../../errors/api-error.js";

export const materialityRouter = Router();

const riskLevelEnum = z.enum(["low", "medium", "high"]);
const assertionEnum = z.enum([
  "existence",
  "completeness",
  "valuation",
  "rights_and_obligations",
  "presentation",
  "accuracy",
  "cutoff",
  "occurrence",
  "classification",
]);

const calculateMaterialitySchema = z.object({
  engagementId: z.string().uuid(),
  benchmark: z.enum([
    "total_revenue",
    "total_assets",
    "profit_before_tax",
    "total_expenses",
    "equity",
  ]),
  benchmarkAmount: z.number().finite().nonnegative(),
  percentageApplied: z.number().finite().int().min(1).max(10000), // basis points
  performanceMaterialityPct: z
    .number()
    .finite()
    .int()
    .min(1)
    .max(10000)
    .optional(),
  clearlyTrivialPct: z.number().finite().int().min(1).max(10000).optional(),
  rationale: z.string().optional(),
});

const createRiskAssessmentSchema = z.object({
  engagementId: z.string().uuid(),
  lineItemId: z.string().uuid().optional(),
  areaName: z.string().min(2).max(255),
  assertion: assertionEnum,
  inherentRisk: riskLevelEnum,
  controlRisk: riskLevelEnum,
  riskDescription: z.string().optional(),
  responseStrategy: z.string().optional(),
});

// ──────────── MATERIALITY ROUTES ────────────

// POST /materiality - Calculate & store materiality
materialityRouter.post(
  "/materiality",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = calculateMaterialitySchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid materiality payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await MaterialityService.calculateMateriality(
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

// GET /materiality?engagementId= - Get latest materiality for engagement
materialityRouter.get(
  "/materiality",
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

      const result = await MaterialityService.getMaterialityForEngagement(
        tenantId,
        engagementId,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── RISK ASSESSMENT ROUTES ────────────

// POST /risks - Create a risk assessment
materialityRouter.post(
  "/risks",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = createRiskAssessmentSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid risk assessment payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await MaterialityService.createRiskAssessment(
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

// GET /risks?engagementId=&assertion= - List risk assessments
materialityRouter.get(
  "/risks",
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

      const assertion = req.query.assertion as string | undefined;
      const list = await MaterialityService.listRiskAssessments(
        tenantId,
        engagementId,
        { assertion },
      );

      res.json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  },
);

// GET /risks/matrix?engagementId= - Get risk matrix summary
materialityRouter.get(
  "/risks/matrix",
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

      const matrix = await MaterialityService.getRiskMatrix(
        tenantId,
        engagementId,
      );

      res.json({ success: true, data: matrix });
    } catch (error) {
      next(error);
    }
  },
);
