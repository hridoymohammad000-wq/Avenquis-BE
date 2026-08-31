import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { RegulatoryPacksService } from "../../services/regulatory-packs.service.js";
import { ApiError } from "../../errors/api-error.js";

export const regulatoryPacksRouter = Router();

const activatePackSchema = z.object({
  packId: z.string().uuid(),
});

// Get available global regulatory packs (Public/Authenticated)
regulatoryPacksRouter.get("/packs", authenticate, async (req, res, next) => {
  try {
    const countryCode = req.query.countryCode as string | undefined;
    const result = await RegulatoryPacksService.getAvailablePacks(countryCode);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get tenant's active regulatory packs
regulatoryPacksRouter.get(
  "/tenant-packs",
  authenticate,
  requireTenantContext,
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const result = await RegulatoryPacksService.getTenantPacks(tenantId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// Activate a regulatory pack for the tenant
regulatoryPacksRouter.post(
  "/tenant-packs",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = activatePackSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await RegulatoryPacksService.activatePackForTenant(
        tenantId,
        parseResult.data.packId,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);
