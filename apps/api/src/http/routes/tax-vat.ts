import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { TaxVatService } from "../../services/tax-vat.service.js";
import { ApiError } from "../../errors/api-error.js";

export const taxVatRouter = Router();

const createWorkflowSchema = z.object({
  clientId: z.string().uuid(),
  workflowType: z.enum(["corporate_tax", "vat_return", "withholding_tax"]),
  period: z.string().min(1).max(50),
  dueDate: z.string().datetime().optional(),
  assignedToMembershipId: z.string().uuid().optional(),
});

const updateWorkflowSchema = z.object({
  status: z.enum([
    "data_collection",
    "computation",
    "review",
    "filed",
    "completed",
  ]),
  notes: z.string().optional(),
});

taxVatRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"), // assuming general write access for tax workflows
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = createWorkflowSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid workflow payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await TaxVatService.createWorkflow(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

taxVatRouter.patch(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = updateWorkflowSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid update payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await TaxVatService.updateWorkflowStatus(
        tenantId,
        req.params.id,
        parseResult.data,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

taxVatRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const clientId = req.query.clientId as string;

      if (!clientId) {
        throw new ApiError(
          400,
          "clientId query parameter is required",
          "MISSING_CLIENT_ID",
        );
      }

      const list = await TaxVatService.getClientWorkflows(tenantId, clientId);
      res.json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  },
);
