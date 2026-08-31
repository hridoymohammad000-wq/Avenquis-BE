import { Router } from "express";
import { z } from "zod";
import { StaffService } from "../../services/staff.service.js";
import { AuditService } from "../../services/audit.service.js";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { ApiError } from "../../errors/api-error.js";

export const designationRouter = Router();

const createDesigSchema = z.object({
  name: z.string().min(2, "Designation name must be at least 2 characters"),
  code: z
    .string()
    .min(2, "Designation code must be at least 2 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Designation code must be alphanumeric"),
  level: z.number().int().min(1).default(1),
  description: z.string().optional(),
});

// GET / - List all designations in current tenant
designationRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("staff:read"),
  async (req, res, next) => {
    try {
      const desigs = await StaffService.listDesignations(req.tenantId!);
      res.json({
        success: true,
        data: desigs,
      });
    } catch (err) {
      next(err);
    }
  },
);

// POST / - Create designation
designationRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("designations:manage"),
  async (req, res, next) => {
    try {
      const parseResult = createDesigSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Validation failed",
          "VALIDATION_ERROR",
          parseResult.error.format(),
        );
      }

      const desig = await StaffService.createDesignation(
        req.tenantId!,
        parseResult.data,
      );

      await AuditService.logActivity({
        tenantId: req.tenantId!,
        membershipId: req.membership!.id,
        action: "CREATE_DESIGNATION",
        resourceType: "designation",
        resourceId: desig.id,
        metadata: { name: desig.name, code: desig.code, level: desig.level },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        data: desig,
      });
    } catch (err) {
      next(err);
    }
  },
);
