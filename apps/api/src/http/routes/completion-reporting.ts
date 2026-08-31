import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { CompletionReportingService } from "../../services/completion-reporting.service.js";
import { ApiError } from "../../errors/api-error.js";

export const completionReportingRouter = Router();

const addChecklistSchema = z.object({
  engagementId: z.string().uuid(),
  category: z.string().min(1).max(100),
  item: z.string().min(1),
});

const updateChecklistSchema = z.object({
  isCompleted: z.boolean(),
  comments: z.string().optional(),
});

const draftReportSchema = z.object({
  engagementId: z.string().uuid(),
  reportType: z.enum(["unqualified", "qualified", "adverse", "disclaimer"]),
  opinionText: z.string().min(1),
  basisForOpinion: z.string().optional(),
  emphasisOfMatter: z.string().optional(),
  keyAuditMatters: z.string().optional(),
  otherInformation: z.string().optional(),
});

// ──────────── COMPLETION CHECKLIST ────────────

completionReportingRouter.post(
  "/completion/checklist",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = addChecklistSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid checklist payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await CompletionReportingService.addChecklistItem(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

completionReportingRouter.patch(
  "/completion/checklist/:id",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = updateChecklistSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid checklist update payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await CompletionReportingService.markChecklistItemComplete(
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

completionReportingRouter.get(
  "/completion/checklist",
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

      const list = await CompletionReportingService.getChecklist(
        tenantId,
        engagementId,
      );

      res.json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── AUDIT REPORTING ────────────

completionReportingRouter.post(
  "/reports",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = draftReportSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid report payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await CompletionReportingService.draftReport(
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

completionReportingRouter.patch(
  "/reports/:id/sign",
  authenticate,
  requireTenantContext,
  requirePermission("audit:signoff"), // Requires high privilege to sign report
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;

      const result = await CompletionReportingService.signReport(
        tenantId,
        membershipId,
        req.params.id,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

completionReportingRouter.get(
  "/reports",
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

      const report = await CompletionReportingService.getReport(
        tenantId,
        engagementId,
      );

      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  },
);
