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
  credentials: z.string(), // E.g., Encrypted OAuth Token JSON
  settings: z.record(z.string(), z.any()).optional().default({}),
});

// Get global available integrations
integrationsRouter.get("/available", authenticate, async (req, res, next) => {
  try {
    const result = await IntegrationsService.getGlobalIntegrations();
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

// Connect / Update a Tenant Integration
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
          "Invalid payload",
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

// Mock sync endpoint to simulate syncing from ERP
integrationsRouter.post(
  "/tenant/:tenantIntegrationId/sync",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const { tenantIntegrationId } = req.params;
      
      // MOCK SYNC PROCESS
      const log = await IntegrationsService.logSyncEvent(
        tenantIntegrationId,
        "TRIAL_BALANCE_IMPORT",
        "SUCCESS",
        150 // Mock records count
      );

      res.status(200).json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  },
);
