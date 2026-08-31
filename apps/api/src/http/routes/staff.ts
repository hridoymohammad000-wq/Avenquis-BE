import { Router } from "express";
import { z } from "zod";
import { StaffService } from "../../services/staff.service.js";
import { AuditService } from "../../services/audit.service.js";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { ApiError } from "../../errors/api-error.js";

export const staffRouter = Router();

const createStaffSchema = z.object({
  membershipId: z.string().uuid("Invalid membership ID"),
  employeeCode: z
    .string()
    .min(1, "Employee code is required")
    .regex(/^[a-zA-Z0-9_-]+$/, "Employee code must be alphanumeric"),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  employmentType: z
    .enum(["full_time", "part_time", "contract", "intern"])
    .default("full_time"),
  status: z
    .enum(["active", "probation", "notice_period", "exited", "suspended"])
    .default("active"),
  joiningDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  phone: z.string().optional(),
  emergencyContact: z.record(z.string(), z.unknown()).optional(),
  bio: z.string().optional(),
  address: z.record(z.string(), z.unknown()).optional(),
});

const updateStaffSchema = z.object({
  departmentId: z.string().uuid().nullable().optional(),
  designationId: z.string().uuid().nullable().optional(),
  employmentType: z
    .enum(["full_time", "part_time", "contract", "intern"])
    .optional(),
  status: z
    .enum(["active", "probation", "notice_period", "exited", "suspended"])
    .optional(),
  phone: z.string().optional(),
  emergencyContact: z.record(z.string(), z.unknown()).optional(),
  bio: z.string().optional(),
  address: z.record(z.string(), z.unknown()).optional(),
});

const lifecycleEventSchema = z.object({
  eventType: z.enum([
    "joined",
    "probation_cleared",
    "promoted",
    "transferred",
    "resigned",
    "terminated",
    "suspended",
    "reinstated",
  ]),
  effectiveDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  remarks: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  newStatus: z
    .enum(["active", "probation", "notice_period", "exited", "suspended"])
    .optional(),
  newDepartmentId: z.string().uuid().optional(),
  newDesignationId: z.string().uuid().optional(),
});

// GET / - List staff with search and filters
staffRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("staff:read"),
  async (req, res, next) => {
    try {
      const { departmentId, designationId, status, search, limit, offset } =
        req.query;

      const staffList = await StaffService.listStaff(req.tenantId!, {
        departmentId: departmentId as string | undefined,
        designationId: designationId as string | undefined,
        status: status as string | undefined,
        search: search as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json({
        success: true,
        data: staffList,
      });
    } catch (err) {
      next(err);
    }
  },
);

// POST / - Create staff profile
staffRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("staff:create"),
  async (req, res, next) => {
    try {
      const parseResult = createStaffSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "VALIDATION_ERROR",
          parseResult.error.format(),
        );
      }

      const staff = await StaffService.createStaff(req.tenantId!, {
        ...parseResult.data,
        performedByMembershipId: req.membership!.id,
      });

      await AuditService.logActivity({
        tenantId: req.tenantId!,
        membershipId: req.membership!.id,
        action: "CREATE_STAFF_PROFILE",
        resourceType: "staff_profile",
        resourceId: staff.id,
        metadata: {
          employeeCode: staff.employeeCode,
          membershipId: staff.membershipId,
        },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        data: staff,
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /:id - Get staff profile and lifecycle history
staffRouter.get(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("staff:read"),
  async (req, res, next) => {
    try {
      const staff = await StaffService.getStaffById(
        req.tenantId!,
        req.params.id,
      );
      res.json({
        success: true,
        data: staff,
      });
    } catch (err) {
      next(err);
    }
  },
);

// PATCG /:id - Update staff profile
staffRouter.patch(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("staff:update"),
  async (req, res, next) => {
    try {
      const parseResult = updateStaffSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "VALIDATION_ERROR",
          parseResult.error.format(),
        );
      }

      const updated = await StaffService.updateStaff(
        req.tenantId!,
        req.params.id,
        parseResult.data,
      );

      await AuditService.logActivity({
        tenantId: req.tenantId!,
        membershipId: req.membership!.id,
        action: "UPDATE_STAFF_PROFILE",
        resourceType: "staff_profile",
        resourceId: updated.id,
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },
);

// POST /:id/lifecycle - Record lifecycle event (promotions, transfers, exits)
staffRouter.post(
  "/:id/lifecycle",
  authenticate,
  requireTenantContext,
  requirePermission("staff:manage_lifecycle"),
  async (req, res, next) => {
    try {
      const parseResult = lifecycleEventSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Validation failed",
          "VALIDATION_ERROR",
          parseResult.error.format(),
        );
      }

      const event = await StaffService.recordLifecycleEvent(
        req.tenantId!,
        req.params.id,
        {
          ...parseResult.data,
          performedByMembershipId: req.membership!.id,
        },
      );

      await AuditService.logActivity({
        tenantId: req.tenantId!,
        membershipId: req.membership!.id,
        action: `STAFF_LIFECYCLE_${parseResult.data.eventType.toUpperCase()}`,
        resourceType: "staff_lifecycle_event",
        resourceId: event.id,
        metadata: {
          staffId: req.params.id,
          eventType: parseResult.data.eventType,
          remarks: parseResult.data.remarks,
        },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        data: event,
      });
    } catch (err) {
      next(err);
    }
  },
);
