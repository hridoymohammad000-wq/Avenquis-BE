import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { InfrastructureService } from "../../services/infrastructure.service.js";
import { ApiError } from "../../errors/api-error.js";

export const infrastructureRouter = Router();

const dedicatedConfigSchema = z.object({
  databaseUrlSecret: z.string().min(10),
  storageBucketName: z.string().min(3),
  kmsKeyId: z.string().optional(),
});

const signoffSchema = z.object({
  moduleName: z.string().min(2),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  notes: z.string().optional(),
});

// GET Tenant Dedicated Config
infrastructureRouter.get(
  "/tenant-config",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const result = await InfrastructureService.getTenantConfig(tenantId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// POST Configure Dedicated Tenant
infrastructureRouter.post(
  "/tenant-config",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = dedicatedConfigSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await InfrastructureService.configureDedicatedTenant(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// PLATFORM ADMIN ONLY: Get Readiness Sign-offs
infrastructureRouter.get(
  "/signoffs",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const result = await InfrastructureService.getReadinessSignoffs();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// PLATFORM ADMIN ONLY: Submit QA Sign-off
infrastructureRouter.post(
  "/signoffs",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const parseResult = signoffSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await InfrastructureService.addSignoff(
        parseResult.data.moduleName,
        parseResult.data.status,
        req.user!.id,
        parseResult.data.notes,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);
