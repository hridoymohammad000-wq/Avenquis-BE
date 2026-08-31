import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { ClientPortalService } from "../../services/client-portal.service.js";
import { ApiError } from "../../errors/api-error.js";

export const clientPortalRouter = Router();

const createUserSchema = z.object({
  clientId: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1).max(255),
  password: z.string().min(8), // In a real app, generate an invite link instead of passing password
});

const uploadDocSchema = z.object({
  clientId: z.string().uuid(),
  engagementId: z.string().uuid().optional(),
  documentUrl: z.string().url(),
  fileName: z.string().min(1).max(255),
  accessLevel: z.enum(["internal_only", "client_visible"]),
  // Note: if a client is uploading, accessLevel shouldn't be mutable, but here we assume a staff context
});

// ──────────── USERS ────────────

clientPortalRouter.post(
  "/users",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"), // Only firm admins can provision client access initially
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = createUserSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid client user payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await ClientPortalService.createClientUser(tenantId, {
        ...parseResult.data,
        passwordRaw: parseResult.data.password,
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── DOCUMENTS ────────────

clientPortalRouter.post(
  "/documents",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = uploadDocSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid document payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await ClientPortalService.uploadSecureDocument(tenantId, {
        ...parseResult.data,
        uploadedByMembershipId: membershipId,
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

clientPortalRouter.get(
  "/documents/:clientId",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const { clientId } = req.params;
      const forClientPortal = req.query.forClient === "true";

      const result = await ClientPortalService.getClientDocuments(
        tenantId,
        clientId,
        forClientPortal,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);
