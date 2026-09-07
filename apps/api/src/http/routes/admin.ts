import { Router, RequestHandler } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { AdminService } from "../../services/admin.service.js";
import { ApiError } from "../../errors/api-error.js";
import { requirePlatformRole } from "../middlewares/platform-admin.js";
import { PlatformAdminService } from "../../services/platform-admin.service.js";

const platformAdmin: RequestHandler[] = [authenticate, requirePlatformRole()];
const commercialAdmin: RequestHandler[] = [
  authenticate,
  requirePlatformRole("PLATFORM_SUPER_ADMIN", "PLATFORM_ADMIN", "FINANCE"),
];
const provisioningAdmin: RequestHandler[] = [
  authenticate,
  requirePlatformRole("PLATFORM_SUPER_ADMIN", "PLATFORM_ADMIN", "OPS", "SALES"),
];

export const adminRouter = Router();

const updateFeatureFlagSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z0-9_.-]+$/),
  enabled: z.boolean(),
});

// GET /system-health - Global system health check
adminRouter.get(
  "/system-health",
  authenticate,
  requirePlatformRole(),
  requireTenantContext,
  requirePermission("admin:read"),
  async (_req, res, next) => {
    try {
      const health = await AdminService.getSystemHealth();
      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /security-events - Tenant security audit logs
adminRouter.get(
  "/security-events",
  authenticate,
  requirePlatformRole(),
  requireTenantContext,
  requirePermission("admin:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const paginationSchema = z.object({
        limit: z.coerce.number().int().min(1).max(100).optional(),
        offset: z.coerce.number().int().min(0).optional(),
        severity: z.enum(["info", "warning", "critical"]).optional(),
      });
      const pagination = paginationSchema.safeParse(req.query);
      if (!pagination.success) {
        throw new ApiError(
          400,
          "Invalid security events query",
          "INVALID_QUERY",
          pagination.error.flatten(),
        );
      }

      const events = await AdminService.listSecurityEvents(tenantId, {
        ...pagination.data,
      });

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /deployment-profile - Get tenant deployment profile & feature flags
adminRouter.get(
  "/deployment-profile",
  authenticate,
  requirePlatformRole(),
  requireTenantContext,
  requirePermission("admin:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const profile = await AdminService.getTenantDeploymentProfile(tenantId);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /feature-flags - Update tenant feature flag
adminRouter.patch(
  "/feature-flags",
  authenticate,
  requirePlatformRole(),
  requireTenantContext,
  requirePermission("admin:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = updateFeatureFlagSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid feature flag payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const flag = await AdminService.updateFeatureFlag(
        tenantId,
        parseResult.data.code,
        parseResult.data.enabled,
      );

      res.json({
        success: true,
        data: flag,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Platform Admin Console foundation. These routes do not use tenant context;
// platform roles are resolved from the authenticated user in the database.
adminRouter.get("/overview", ...platformAdmin, async (_req, res, next) => {
  try {
    res.json({ success: true, data: await PlatformAdminService.getOverview() });
  } catch (error) { next(error); }
});

adminRouter.get("/firms", ...platformAdmin, async (_req, res, next) => {
  try { res.json({ success: true, data: await PlatformAdminService.listFirms() }); }
  catch (error) { next(error); }
});

adminRouter.get("/firms/:id", ...platformAdmin, async (req, res, next) => {
  try { res.json({ success: true, data: await PlatformAdminService.getFirm(req.params.id) }); }
  catch (error) { next(error); }
});

const createFirmSchema = z.object({
  legalName: z.string().trim().min(2).max(255),
  displayName: z.string().trim().min(2).max(255),
  workspaceSubdomain: z.string().trim().min(1).max(63),
  ownerUserId: z.string().uuid().optional(),
  planCode: z.string().trim().min(2).max(80),
});

adminRouter.post("/firms", ...provisioningAdmin, async (req, res, next) => {
  try {
    const parsed = createFirmSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid firm onboarding payload", "INVALID_PAYLOAD", parsed.error.flatten());
    const firm = await PlatformAdminService.createFirm({
      ...parsed.data,
      actorUserId: req.user!.id,
      actorRole: req.platformRoles![0],
      requestId: String(req.id),
    });
    res.status(201).json({ success: true, data: firm });
  } catch (error) { next(error); }
});

const updateFirmSchema = z.object({
  onboardingState: z.enum(["pending_approval", "approved", "rejected"]).optional(),
  billingState: z.string().trim().min(2).max(50).optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");

adminRouter.patch("/firms/:id", ...provisioningAdmin, async (req, res, next) => {
  try {
    const parsed = updateFirmSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid firm update payload", "INVALID_PAYLOAD", parsed.error.flatten());
    const firm = await PlatformAdminService.updateFirm(req.params.id, parsed.data, {
      actorUserId: req.user!.id,
      actorRole: req.platformRoles![0],
      requestId: String(req.id),
    });
    res.json({ success: true, data: firm });
  } catch (error) { next(error); }
});

adminRouter.post("/firms/:id/provision", ...provisioningAdmin, async (req, res, next) => {
  try {
    const firm = await PlatformAdminService.provisionFirm(req.params.id, {
      actorUserId: req.user!.id,
      actorRole: req.platformRoles![0],
      requestId: String(req.id),
    });
    res.json({ success: true, data: firm });
  } catch (error) { next(error); }
});

adminRouter.get("/leads", ...platformAdmin, async (_req, res, next) => {
  try { res.json({ success: true, data: await PlatformAdminService.listLeads() }); }
  catch (error) { next(error); }
});
const leadSchema = z.object({
  email: z.string().email(), contactName: z.string().trim().min(2).max(255),
  companyName: z.string().trim().max(255).optional(), phone: z.string().trim().max(50).optional(),
  source: z.string().trim().max(80).optional(), notes: z.string().trim().max(2000).optional(),
});
adminRouter.post("/leads", ...provisioningAdmin, async (req, res, next) => {
  try {
    const parsed = leadSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid lead payload", "INVALID_PAYLOAD", parsed.error.flatten());
    const lead = await PlatformAdminService.createLead({ ...parsed.data, actorUserId: req.user!.id, actorRole: req.platformRoles![0], requestId: String(req.id) });
    res.status(201).json({ success: true, data: lead });
  } catch (error) { next(error); }
});
adminRouter.get("/demo-requests", ...platformAdmin, async (_req, res, next) => {
  try { res.json({ success: true, data: await PlatformAdminService.listDemoRequests() }); }
  catch (error) { next(error); }
});
const demoRequestSchema = z.object({
  email: z.string().email(), contactName: z.string().trim().min(2).max(255),
  source: z.string().trim().max(80).optional(), notes: z.string().trim().max(2000).optional(),
});
adminRouter.post("/demo-requests", ...provisioningAdmin, async (req, res, next) => {
  try {
    const parsed = demoRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid demo request payload", "INVALID_PAYLOAD", parsed.error.flatten());
    const request = await PlatformAdminService.createDemoRequest({ ...parsed.data, actorUserId: req.user!.id, actorRole: req.platformRoles![0], requestId: String(req.id) });
    res.status(201).json({ success: true, data: request });
  } catch (error) { next(error); }
});
adminRouter.get("/access-requests", ...platformAdmin, async (_req, res, next) => {
  try { res.json({ success: true, data: await PlatformAdminService.listAccessRequests() }); }
  catch (error) { next(error); }
});
const accessRequestSchema = z.object({
  email: z.string().email(), requestedFirmName: z.string().trim().min(2).max(255),
  requestedPlanCode: z.string().trim().max(80).optional(), source: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(2000).optional(),
});
adminRouter.post("/access-requests", ...provisioningAdmin, async (req, res, next) => {
  try {
    const parsed = accessRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid access request payload", "INVALID_PAYLOAD", parsed.error.flatten());
    const request = await PlatformAdminService.createAccessRequest({ ...parsed.data, actorUserId: req.user!.id, actorRole: req.platformRoles![0], requestId: String(req.id) });
    res.status(201).json({ success: true, data: request });
  } catch (error) { next(error); }
});
adminRouter.get("/plans", ...commercialAdmin, async (_req, res, next) => {
  try { res.json({ success: true, data: await PlatformAdminService.listPlans() }); }
  catch (error) { next(error); }
});
adminRouter.get("/billing/subscriptions", ...commercialAdmin, async (_req, res, next) => {
  try { res.json({ success: true, data: await PlatformAdminService.listSubscriptions() }); }
  catch (error) { next(error); }
});
adminRouter.get("/billing/invoices", ...commercialAdmin, async (_req, res, next) => {
  try { res.json({ success: true, data: await PlatformAdminService.listInvoices() }); }
  catch (error) { next(error); }
});
adminRouter.get("/collections", ...commercialAdmin, async (_req, res, next) => {
  try { res.json({ success: true, data: await PlatformAdminService.listCollections() }); }
  catch (error) { next(error); }
});
adminRouter.get("/growth", ...platformAdmin, async (_req, res, next) => {
  try { res.json({ success: true, data: await PlatformAdminService.getGrowth() }); }
  catch (error) { next(error); }
});
adminRouter.get("/support", ...platformAdmin, async (_req, res, next) => {
  try { res.json({ success: true, data: await PlatformAdminService.listSupportCases() }); }
  catch (error) { next(error); }
});
adminRouter.get("/support/:id", ...platformAdmin, async (req, res, next) => {
  try { res.json({ success: true, data: await PlatformAdminService.getSupportCase(req.params.id) }); }
  catch (error) { next(error); }
});
adminRouter.get("/settings", authenticate, requirePlatformRole("PLATFORM_SUPER_ADMIN", "PLATFORM_ADMIN", "OPS"), async (_req, res, next) => {
  try { res.json({ success: true, data: await PlatformAdminService.listSettings() }); }
  catch (error) { next(error); }
});
adminRouter.get("/audit-logs", authenticate, requirePlatformRole("PLATFORM_SUPER_ADMIN", "PLATFORM_ADMIN"), async (_req, res, next) => {
  try { res.json({ success: true, data: await PlatformAdminService.listAuditLogs() }); }
  catch (error) { next(error); }
});
