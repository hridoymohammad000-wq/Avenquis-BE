import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { AutomationService } from "../../services/automation.service.js";
import { ApiKeyService } from "../../services/api-key.service.js";
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

const dispatchEventSchema = z.object({
  eventType: z.string().min(1),
  payload: z.record(z.string(), z.any()).default({}),
  idempotencyKey: z.string().optional(),
});

const createApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  scopes: z.array(z.string()).min(1),
  expiresInDays: z.number().int().positive().optional(),
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

automationRouter.delete(
  "/webhooks/:id",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const result = await AutomationService.deleteWebhook(tenantId, id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── WORKFLOW AUTOMATION RULES ────────────

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

automationRouter.get(
  "/executions",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const ruleId = req.query.ruleId as string | undefined;

      const result = await AutomationService.getAutomationExecutions(
        tenantId,
        ruleId,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── EVENT DISPATCH ────────────

automationRouter.post(
  "/events/dispatch",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = dispatchEventSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid event payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const idempotencyKey = (req.headers["x-idempotency-key"] as string) || parseResult.data.idempotencyKey;

      const result = await AutomationService.dispatchEvent(
        tenantId,
        parseResult.data.eventType,
        parseResult.data.payload,
        idempotencyKey
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── API KEYS ────────────

automationRouter.post(
  "/api-keys",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = createApiKeySchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid API Key payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await ApiKeyService.createApiKey(tenantId, {
        ...parseResult.data,
        createdByMembershipId: membershipId,
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

automationRouter.get(
  "/api-keys",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const result = await ApiKeyService.getApiKeys(tenantId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

automationRouter.post(
  "/api-keys/:id/revoke",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const result = await ApiKeyService.revokeApiKey(tenantId, id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);
