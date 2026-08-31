import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { NotificationService } from "../../services/notification.service.js";
import { ApiError } from "../../errors/api-error.js";

export const notificationRouter = Router();

const createNotificationSchema = z.object({
  recipientMembershipId: z.string().uuid(),
  title: z.string().min(2).max(255),
  message: z.string().min(2),
  type: z.enum([
    "task_assignment",
    "review_note",
    "leave_approval",
    "kyc_verification",
    "invoice_payment",
    "independence_flag",
    "system_alert",
  ]),
  link: z.string().optional(),
});

const logActivitySchema = z.object({
  entityType: z.enum([
    "client",
    "engagement",
    "working_paper",
    "task",
    "invoice",
    "certificate",
  ]),
  entityId: z.string().uuid(),
  action: z.enum([
    "created",
    "updated",
    "submitted",
    "approved",
    "rejected",
    "signed_and_sealed",
    "revoked",
  ]),
  description: z.string().min(2),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// GET / - List user notifications
notificationRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("notifications:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const isRead = req.query.isRead ? req.query.isRead === "true" : undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : undefined;

      const list = await NotificationService.listNotifications(
        tenantId,
        membershipId,
        {
          isRead,
          limit,
          offset,
        },
      );

      res.json({
        success: true,
        data: list,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /unread-count - Get unread count
notificationRouter.get(
  "/unread-count",
  authenticate,
  requireTenantContext,
  requirePermission("notifications:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;

      const result = await NotificationService.getUnreadCount(
        tenantId,
        membershipId,
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST / - Dispatch notification
notificationRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("notifications:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = createNotificationSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid notification payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const notif = await NotificationService.createNotification(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: notif,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /read-all - Mark all user notifications as read
notificationRouter.patch(
  "/read-all",
  authenticate,
  requireTenantContext,
  requirePermission("notifications:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;

      const result = await NotificationService.markAllAsRead(
        tenantId,
        membershipId,
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /:id/read - Mark specific notification as read
notificationRouter.patch(
  "/:id/read",
  authenticate,
  requireTenantContext,
  requirePermission("notifications:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const notificationId = req.params.id;
      const membershipId = req.membership!.id;

      const updated = await NotificationService.markAsRead(
        tenantId,
        notificationId,
        membershipId,
      );

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /activity - Query firm activity feed
notificationRouter.get(
  "/activity",
  authenticate,
  requireTenantContext,
  requirePermission("notifications:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const entityType = req.query.entityType as string | undefined;
      const entityId = req.query.entityId as string | undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : undefined;

      const feed = await NotificationService.listActivityFeed(tenantId, {
        entityType,
        entityId,
        limit,
        offset,
      });

      res.json({
        success: true,
        data: feed,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /activity - Log audit activity event
notificationRouter.post(
  "/activity",
  authenticate,
  requireTenantContext,
  requirePermission("notifications:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = logActivitySchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid activity payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const event = await NotificationService.logActivityEvent(
        tenantId,
        membershipId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },
);
