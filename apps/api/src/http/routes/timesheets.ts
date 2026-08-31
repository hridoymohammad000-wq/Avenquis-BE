import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { TimesheetService } from "../../services/timesheet.service.js";
import { ApiError } from "../../errors/api-error.js";

export const timesheetRouter = Router();

const logTimesheetSchema = z.object({
  engagementId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  workDate: z.string().transform((val) => new Date(val)),
  hours: z.number().int().min(1).max(24),
  activityType: z.enum([
    "audit_fieldwork",
    "tax_preparation",
    "client_meeting",
    "report_writing",
    "review",
    "administrative",
    "training",
  ]),
  description: z.string().optional(),
});

const approveTimesheetSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

// GET / - List timesheets
timesheetRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("timesheets:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.query.membershipId as string | undefined;
      const engagementId = req.query.engagementId as string | undefined;
      const status = req.query.status as string | undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : undefined;

      const list = await TimesheetService.listTimesheets(tenantId, {
        membershipId,
        engagementId,
        status,
        limit,
        offset,
      });

      res.json({
        success: true,
        data: list,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST / - Log time entry
timesheetRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("timesheets:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = logTimesheetSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid timesheet payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const entry = await TimesheetService.logTimesheet(
        tenantId,
        membershipId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /:id/approve - Approve or reject timesheet entry
timesheetRouter.patch(
  "/:id/approve",
  authenticate,
  requireTenantContext,
  requirePermission("timesheets:approve"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const timesheetId = req.params.id;
      const approverMembershipId = req.membership!.id;
      const parseResult = approveTimesheetSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid approval payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const updated = await TimesheetService.approveTimesheet(
        tenantId,
        timesheetId,
        approverMembershipId,
        parseResult.data.status,
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
