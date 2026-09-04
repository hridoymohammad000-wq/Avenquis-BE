import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission, requirePlatformAdmin } from "../middlewares/rbac.js";
import { InfrastructureService } from "../../services/infrastructure.service.js";
import { ApiError } from "../../errors/api-error.js";

export const infrastructureRouter = Router();

const dedicatedConfigSchema = z.object({
  databaseUrlSecret: z.string().min(10),
  storageBucketName: z.string().min(3),
  kmsKeyId: z.string().optional(),
  isolationMode: z.enum(["SHARED_SCHEMA_RLS", "DEDICATED_DATABASE", "DEDICATED_DEPLOYMENT"]).optional(),
  requestedRegion: z.string().optional(),
  residencyPolicy: z.string().optional(),
  providerType: z.enum(["TEST_STUB", "RENDER_SUPABASE_API", "AWS_RDS", "MANUAL_PROVISIONER"]).optional(),
});

const provisionRequestSchema = z.object({
  isolationMode: z.enum(["SHARED_SCHEMA_RLS", "DEDICATED_DATABASE", "DEDICATED_DEPLOYMENT"]),
  requestedRegion: z.string().min(2),
  providerType: z.enum(["TEST_STUB", "RENDER_SUPABASE_API", "AWS_RDS", "MANUAL_PROVISIONER"]).optional(),
  idempotencyKey: z.string().optional(),
});

const signoffSchema = z.object({
  moduleName: z.string().min(2),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  notes: z.string().optional(),
});

// GET Tenant Dedicated Config (Tenant Admin read-only, secrets redacted)
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

// POST Store Dedicated Tenant Configuration (PLATFORM ADMIN ONLY)
infrastructureRouter.post(
  "/tenant-config",
  authenticate,
  requireTenantContext,
  requirePlatformAdmin,
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
        req.user?.id,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// POST Trigger Dedicated Tenant Infrastructure Provisioning (PLATFORM ADMIN ONLY)
infrastructureRouter.post(
  "/provision",
  authenticate,
  requireTenantContext,
  requirePlatformAdmin,
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = provisionRequestSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await InfrastructureService.requestProvisioning(
        tenantId,
        parseResult.data,
        req.user?.id,
      );

      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message?.startsWith("CONFLICT:")) {
        return next(new ApiError(409, err.message, "PROVISIONING_CONFLICT"));
      }
      if (err.message?.startsWith("NOT_FOUND:")) {
        return next(new ApiError(404, err.message, "CONFIG_NOT_FOUND"));
      }
      next(error);
    }
  },
);

// POST Evaluate Authoritative Readiness for Tenant
infrastructureRouter.post(
  "/evaluate-readiness",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const result = await InfrastructureService.evaluateTenantReadiness(tenantId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// GET System Release Readiness Summary (PLATFORM ADMIN ONLY)
infrastructureRouter.get(
  "/release-readiness",
  authenticate,
  requirePlatformAdmin,
  async (req, res, next) => {
    try {
      const result = await InfrastructureService.evaluateReleaseReadiness();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// GET Readiness Sign-offs (PLATFORM ADMIN ONLY)
infrastructureRouter.get(
  "/signoffs",
  authenticate,
  requirePlatformAdmin,
  async (req, res, next) => {
    try {
      const result = await InfrastructureService.getReadinessSignoffs();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// POST Submit QA Sign-off (PLATFORM ADMIN ONLY)
infrastructureRouter.post(
  "/signoffs",
  authenticate,
  requirePlatformAdmin,
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
