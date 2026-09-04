import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { DvsService } from "../../services/dvs.service.js";
import { ApiError } from "../../errors/api-error.js";

export const dvsWorkflowRouter = Router();

const generateDvsSchema = z.object({
  engagementId: z.string().uuid(),
  documentType: z.string().min(1).max(100),
});

dvsWorkflowRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("audit:signoff"), // Requires high privilege to generate DVS code
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = generateDvsSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid DVS generation payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await DvsService.generateDvsCode(
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

dvsWorkflowRouter.get(
  "/:code",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership?.id;
      const result = await DvsService.verifyDvsCode(tenantId, req.params.code, membershipId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

dvsWorkflowRouter.get(
  "/engagement/:engagementId",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const list = await DvsService.getEngagementDvsRecords(
        tenantId,
        req.params.engagementId,
      );
      res.json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  },
);
