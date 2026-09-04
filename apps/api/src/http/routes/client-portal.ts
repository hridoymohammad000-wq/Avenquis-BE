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
  password: z.string().min(8),
});

const inviteUserSchema = z.object({
  clientId: z.string().uuid(),
  email: z.string().email(),
  expiresInDays: z.number().int().positive().optional().default(7),
});

const activateInviteSchema = z.object({
  token: z.string().min(10),
  fullName: z.string().min(1).max(255),
  password: z.string().min(8),
});

const updateStatusSchema = z.object({
  status: z.enum(["active", "suspended", "disabled"]),
});

const uploadDocSchema = z.object({
  clientId: z.string().uuid(),
  engagementId: z.string().uuid().optional(),
  documentUrl: z.string(),
  fileName: z.string().min(1).max(255),
  accessLevel: z.enum(["internal_only", "client_visible"]).default("client_visible"),
  storageProvider: z.string().optional().default("s3"),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  extension: z.string().optional(),
  scanStatus: z.enum(["PENDING", "PASSED", "FAILED", "CLEAN", "QUARANTINED"]).optional().default("CLEAN"),
});

// ──────────── CLIENT USERS & INVITATIONS ────────────

clientPortalRouter.post(
  "/users",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
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

clientPortalRouter.post(
  "/invitations",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = inviteUserSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid invitation payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await ClientPortalService.inviteClientUser(tenantId, {
        ...parseResult.data,
        invitedByMembershipId: membershipId,
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

clientPortalRouter.post("/invitations/activate", async (req, res, next) => {
  try {
    const parseResult = activateInviteSchema.safeParse(req.body);

    if (!parseResult.success) {
      throw new ApiError(
        400,
        "Invalid activation payload",
        "INVALID_PAYLOAD",
        parseResult.error.flatten(),
      );
    }

    const result = await ClientPortalService.activateClientInvitation({
      rawToken: parseResult.data.token,
      fullName: parseResult.data.fullName,
      passwordRaw: parseResult.data.password,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

clientPortalRouter.post(
  "/invitations/:id/revoke",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const result = await ClientPortalService.revokeClientInvitation(
        tenantId,
        id,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

clientPortalRouter.get(
  "/invitations",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const clientId = req.query.clientId as string | undefined;

      const result = await ClientPortalService.getClientInvitations(
        tenantId,
        clientId,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

clientPortalRouter.patch(
  "/users/:id/status",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const parseResult = updateStatusSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid status payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await ClientPortalService.updateClientUserStatus(
        tenantId,
        id,
        parseResult.data.status,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── SECURE DOCUMENTS & AUDIT LOGS ────────────

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
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
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

clientPortalRouter.get(
  "/access-logs",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const clientId = req.query.clientId as string | undefined;

      const result = await ClientPortalService.getPortalAccessLogs(
        tenantId,
        clientId,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);
