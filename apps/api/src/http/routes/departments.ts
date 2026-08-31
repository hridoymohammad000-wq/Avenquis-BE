import { Router } from "express";
import { z } from "zod";
import { StaffService } from "../../services/staff.service.js";
import { AuditService } from "../../services/audit.service.js";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { ApiError } from "../../errors/api-error.js";

export const departmentRouter = Router();

const createDeptSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
  code: z
    .string()
    .min(2, "Department code must be at least 2 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Department code must be alphanumeric"),
  description: z.string().optional(),
  headMembershipId: z.string().uuid().optional(),
});

// GET / - List all departments in current tenant
departmentRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("staff:read"),
  async (req, res, next) => {
    try {
      const depts = await StaffService.listDepartments(req.tenantId!);
      res.json({
        success: true,
        data: depts,
      });
    } catch (err) {
      next(err);
    }
  },
);

// POST / - Create department
departmentRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("departments:manage"),
  async (req, res, next) => {
    try {
      const parseResult = createDeptSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Validation failed",
          "VALIDATION_ERROR",
          parseResult.error.format(),
        );
      }

      const dept = await StaffService.createDepartment(
        req.tenantId!,
        parseResult.data,
      );

      await AuditService.logActivity({
        tenantId: req.tenantId!,
        membershipId: req.membership!.id,
        action: "CREATE_DEPARTMENT",
        resourceType: "department",
        resourceId: dept.id,
        metadata: { name: dept.name, code: dept.code },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        data: dept,
      });
    } catch (err) {
      next(err);
    }
  },
);
