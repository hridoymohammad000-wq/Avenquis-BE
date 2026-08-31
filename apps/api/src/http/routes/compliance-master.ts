import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { ComplianceMasterService } from "../../services/compliance-master.service.js";
import { ApiError } from "../../errors/api-error.js";

export const complianceMasterRouter = Router();

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.enum(["RJSC", "NBR", "FRC", "ICAB"]),
  checklistData: z.array(z.any()), // expecting array of checklist items
});

const createEventSchema = z.object({
  clientId: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  eventDate: z.string().datetime(),
  eventType: z.enum(["statutory_filing", "tax_return", "icab_deadline"]),
});

// ──────────── TEMPLATES ────────────

complianceMasterRouter.post(
  "/templates",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage"), // Admin-only creation
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = createTemplateSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid template payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await ComplianceMasterService.createTemplate(
        tenantId,
        membershipId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

complianceMasterRouter.get(
  "/templates",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const category = req.query.category as string | undefined;

      const list = await ComplianceMasterService.getTemplates(
        tenantId,
        category,
      );
      res.json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── CALENDAR ────────────

complianceMasterRouter.post(
  "/calendar",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"), // Any core staff can add events
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = createEventSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid calendar event payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await ComplianceMasterService.createCalendarEvent(
        tenantId,
        membershipId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

complianceMasterRouter.get(
  "/calendar",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const clientId = req.query.clientId as string | undefined;

      const list = await ComplianceMasterService.getCalendarEvents(
        tenantId,
        clientId,
      );
      res.json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  },
);
