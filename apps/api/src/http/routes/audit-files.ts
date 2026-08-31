import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { AuditFilesService } from "../../services/audit-files.service.js";
import { ApiError } from "../../errors/api-error.js";

export const auditFilesRouter = Router();

const uploadAuditFileSchema = z.object({
  clientId: z.string().uuid(),
  engagementId: z.string().uuid().optional(),
  fileType: z.enum(["PAF", "CAF"]),
  category: z.string().min(1).max(100),
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().url(),
  description: z.string().optional(),
});

auditFilesRouter.post(
  "/files",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"), // Assuming 'audit:write' covers file uploads for now
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = uploadAuditFileSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid audit file payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await AuditFilesService.uploadAuditFile(
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

auditFilesRouter.get(
  "/files/paf",
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

      const files = await AuditFilesService.getPermanentFiles(
        tenantId,
        clientId,
      );
      res.json({ success: true, data: files });
    } catch (error) {
      next(error);
    }
  },
);

auditFilesRouter.get(
  "/files/caf",
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

      const files = await AuditFilesService.getCurrentFiles(
        tenantId,
        engagementId,
      );
      res.json({ success: true, data: files });
    } catch (error) {
      next(error);
    }
  },
);
