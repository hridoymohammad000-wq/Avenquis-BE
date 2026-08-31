import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { TrialBalanceService } from "../../services/trial-balance.service.js";
import { ApiError } from "../../errors/api-error.js";

export const trialBalanceRouter = Router();

const lineItemSchema = z.object({
  accountCode: z.string().min(1).max(50),
  accountName: z.string().min(1).max(255),
  debitAmount: z.number().int().min(0).default(0),
  creditAmount: z.number().int().min(0).default(0),
  priorYearBalance: z.number().int().optional(),
  mappedFinancialStatementGroup: z
    .enum(["asset", "liability", "equity", "revenue", "expense"])
    .optional(),
  mappedLeadSchedule: z.string().optional(),
});

const importTrialBalanceSchema = z.object({
  engagementId: z.string().uuid(),
  name: z.string().min(2).max(255),
  asOfDate: z.string().transform((val) => new Date(val)),
  currency: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
});

const batchMapSchema = z.object({
  mappings: z
    .array(
      z.object({
        lineItemId: z.string().uuid(),
        mappedFinancialStatementGroup: z.enum([
          "asset",
          "liability",
          "equity",
          "revenue",
          "expense",
        ]),
        mappedLeadSchedule: z.string().min(2).max(100),
      }),
    )
    .min(1),
});

// POST / - Import trial balance
trialBalanceRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = importTrialBalanceSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid trial balance payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await TrialBalanceService.importTrialBalance(
        tenantId,
        membershipId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET / - List trial balances for an engagement
trialBalanceRouter.get(
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

      const list = await TrialBalanceService.listTrialBalances(
        tenantId,
        engagementId,
      );

      res.json({
        success: true,
        data: list,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /:id - Get trial balance details with line items
trialBalanceRouter.get(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const tbId = req.params.id;

      const tb = await TrialBalanceService.getTrialBalanceDetails(
        tenantId,
        tbId,
      );

      res.json({
        success: true,
        data: tb,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /:id/map - Batch map line items to FS groups & lead schedules
trialBalanceRouter.patch(
  "/:id/map",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const tbId = req.params.id;
      const parseResult = batchMapSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid mapping payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const updated = await TrialBalanceService.mapTbLineItems(
        tenantId,
        tbId,
        parseResult.data.mappings,
      );

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /:id/lead-schedules - Get lead schedule summary
trialBalanceRouter.get(
  "/:id/lead-schedules",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const tbId = req.params.id;

      const summary = await TrialBalanceService.getLeadScheduleSummary(
        tenantId,
        tbId,
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  },
);
