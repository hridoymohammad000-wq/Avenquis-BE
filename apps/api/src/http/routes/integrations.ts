import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { IntegrationsService } from "../../services/integrations.service.js";
import { ApiError } from "../../errors/api-error.js";

export const integrationsRouter = Router();

const connectSchema = z.object({
  integrationId: z.string().uuid(),
  credentials: z.string().min(1),
  settings: z.record(z.string(), z.any()).optional().default({}),
});

const syncSchema = z.object({
  cursor: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

// Get global available integrations
integrationsRouter.get("/available", authenticate, async (req, res, next) => {
  try {
    const category = req.query.category as string | undefined;
    const result = await IntegrationsService.getGlobalIntegrations(category);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get tenant connected integrations
integrationsRouter.get(
  "/tenant",
  authenticate,
  requireTenantContext,
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const result = await IntegrationsService.getTenantIntegrations(tenantId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// Connect / Configure a Tenant Integration
integrationsRouter.post(
  "/tenant",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = connectSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid integration payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await IntegrationsService.connectIntegration(
        tenantId,
        parseResult.data.integrationId,
        parseResult.data.credentials,
        parseResult.data.settings,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// Test Connection Endpoint
integrationsRouter.post(
  "/tenant/:tenantIntegrationId/test-connection",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const { tenantIntegrationId } = req.params;

      const result = await IntegrationsService.testConnection(
        tenantId,
        tenantIntegrationId,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// Incremental Sync Endpoint
integrationsRouter.post(
  "/tenant/:tenantIntegrationId/sync",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const { tenantIntegrationId } = req.params;
      const parseResult = syncSchema.safeParse(req.body);

      const result = await IntegrationsService.runIncrementalSync(
        tenantId,
        tenantIntegrationId,
        parseResult.success ? parseResult.data : undefined,
      );

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// Get Sync Audit Logs
integrationsRouter.get(
  "/tenant/:tenantIntegrationId/logs",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const { tenantIntegrationId } = req.params;

      const result = await IntegrationsService.getSyncLogs(
        tenantId,
        tenantIntegrationId,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);
