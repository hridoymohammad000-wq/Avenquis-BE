import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { AutomationService } from "../../services/automation.service.js";
import { ApiError } from "../../errors/api-error.js";

export const automationRouter = Router();

const webhookSchema = z.object({
  url: z.string().url(),
  eventTypes: z.array(z.string()).min(1),
});

const ruleSchema = z.object({
  name: z.string().min(1).max(255),
  triggerEvent: z.string().min(1),
  condition: z.record(z.string(), z.any()).optional(),
  actionType: z.string().min(1),
  actionPayload: z.record(z.string(), z.any()).optional(),
});

// ──────────── WEBHOOKS ────────────

automationRouter.post(
  "/webhooks",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = webhookSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid webhook payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await AutomationService.registerWebhook(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

automationRouter.get(
  "/webhooks",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const result = await AutomationService.getWebhooks(tenantId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── AUTOMATION RULES ────────────

automationRouter.post(
  "/rules",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = ruleSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid rule payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await AutomationService.createAutomationRule(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

automationRouter.get(
  "/rules",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const triggerEvent = req.query.triggerEvent as string | undefined;

      const result = await AutomationService.getAutomationRules(
        tenantId,
        triggerEvent,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);
