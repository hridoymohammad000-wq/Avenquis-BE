import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { EnterpriseService } from "../../services/enterprise.service.js";
import { ApiError } from "../../errors/api-error.js";

export const enterpriseRouter = Router();

const createBranchSchema = z.object({
  name: z.string().min(1).max(255),
  branchCode: z.string().max(50).optional(),
  location: z.string().optional(),
  isHeadOffice: z.boolean().optional(),
});

const assignStaffSchema = z.object({
  membershipId: z.string().uuid(),
  branchId: z.string().uuid(),
  isPrimary: z.boolean().optional(),
});

// ──────────── FIRM BRANCHES ────────────

enterpriseRouter.post(
  "/branches",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = createBranchSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid branch payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await EnterpriseService.createBranch(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

enterpriseRouter.get(
  "/branches",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const result = await EnterpriseService.getBranches(tenantId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── STAFF BRANCH ASSIGNMENTS ────────────

enterpriseRouter.post(
  "/branches/staff",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = assignStaffSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid staff assignment payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await EnterpriseService.allocateStaffToBranch(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

enterpriseRouter.get(
  "/branches/staff/:membershipId",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const { membershipId } = req.params;

      const result = await EnterpriseService.getStaffBranches(
        tenantId,
        membershipId,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);
