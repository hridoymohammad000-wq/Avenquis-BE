import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { HrFinanceService } from "../../services/hr-finance.service.js";
import { ApiError } from "../../errors/api-error.js";

export const hrFinanceRouter = Router();

const payrollSchema = z.object({
  membershipId: z.string().uuid(),
  monthYear: z.string().min(1).max(20),
  basicSalary: z.number().min(0),
  allowances: z.number().min(0).optional(),
  deductions: z.number().min(0).optional(),
});

const expenseSchema = z.object({
  engagementId: z.string().uuid().optional(),
  amount: z.number().positive(),
  category: z.enum(["travel", "software", "meals", "office_supplies", "other"]),
  description: z.string().optional(),
  receiptUrl: z.string().url().optional(),
});

// ──────────── HR PAYROLL ────────────

hrFinanceRouter.post(
  "/payroll",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"), // HR / Admins only
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = payrollSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid payroll payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await HrFinanceService.createPayrollRecord(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

hrFinanceRouter.get(
  "/payroll",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"), // A member should be able to read their own, handled loosely here
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.query.membershipId as string | undefined;

      const result = await HrFinanceService.getPayrollRecords(
        tenantId,
        membershipId,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── FINANCE EXPENSES ────────────

hrFinanceRouter.post(
  "/expenses",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"), // Any staff can submit an expense
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = expenseSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid expense payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await HrFinanceService.logExpense(
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

hrFinanceRouter.get(
  "/expenses",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const engagementId = req.query.engagementId as string | undefined;

      const result = await HrFinanceService.getExpenses(tenantId, engagementId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);
