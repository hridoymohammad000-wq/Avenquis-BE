import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { I18nService } from "../../services/i18n.service.js";
import { ApiError } from "../../errors/api-error.js";

export const i18nRouter = Router();

const setLocaleSchema = z.object({
  localeCode: z.string().trim().min(2).max(10),
  isDefault: z.boolean().optional().default(false),
});

// Get global supported locales (Public/Authenticated)
i18nRouter.get("/supported", authenticate, async (req, res, next) => {
  try {
    const result = await I18nService.getSupportedLocales();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get tenant configured locales
i18nRouter.get(
  "/tenant",
  authenticate,
  requireTenantContext,
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const result = await I18nService.getTenantLocales(tenantId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// Set tenant locale
i18nRouter.post(
  "/tenant",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = setLocaleSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid locale payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await I18nService.setTenantLocale(
        tenantId,
        parseResult.data.localeCode,
        parseResult.data.isDefault,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);
