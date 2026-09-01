import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { RegionalService } from "../../services/regional.service.js";
import { ApiError } from "../../errors/api-error.js";

export const regionalRouter = Router();

const settingsSchema = z.object({
  countryCode: z.string().trim().toUpperCase().length(2),
  currencyCode: z.string().trim().toUpperCase().length(3),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  financialYearStartMonth: z.number().min(1).max(12).optional(),
});

// Get global countries (Public/Authenticated)
regionalRouter.get("/countries", authenticate, async (req, res, next) => {
  try {
    const result = await RegionalService.getGlobalCountries();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get tenant regional settings
regionalRouter.get(
  "/settings",
  authenticate,
  requireTenantContext,
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const result = await RegionalService.getTenantRegionalSettings(tenantId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// Set tenant regional settings
regionalRouter.post(
  "/settings",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = settingsSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid regional settings payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await RegionalService.setTenantRegionalSettings(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);
