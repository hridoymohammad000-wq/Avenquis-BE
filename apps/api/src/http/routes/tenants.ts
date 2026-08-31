import { Router } from "express";
import { z } from "zod";
import { TenantService } from "../../services/tenant.service.js";
import { AuditService } from "../../services/audit.service.js";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { ApiError } from "../../errors/api-error.js";

export const tenantRouter = Router();

const createTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
});

// GET / - List all active tenants for current user
tenantRouter.get("/", authenticate, async (req, res, next) => {
  try {
    const list = await TenantService.getUserMemberships(req.user!.id);
    res.json({
      success: true,
      data: list,
    });
  } catch (err) {
    next(err);
  }
});

// POST / - Create a new tenant with current user as owner/admin
tenantRouter.post("/", authenticate, async (req, res, next) => {
  try {
    const parseResult = createTenantSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(
        400,
        "Validation failed",
        "VALIDATION_ERROR",
        parseResult.error.format(),
      );
    }

    const { name, slug } = parseResult.data;
    const result = await TenantService.createTenant({
      name,
      slug,
      ownerUserId: req.user!.id,
    });

    await AuditService.logActivity({
      tenantId: result.tenant.id,
      membershipId: result.membership.id,
      action: "CREATE_TENANT",
      resourceType: "tenant",
      resourceId: result.tenant.id,
      metadata: { name, slug },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// POST /switch - Switch tenant context and validate membership
tenantRouter.post("/switch", authenticate, async (req, res, next) => {
  try {
    const switchSchema = z.object({
      tenantId: z.string().uuid("Invalid tenant ID format"),
    });

    const parseResult = switchSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(
        400,
        "Validation failed",
        "VALIDATION_ERROR",
        parseResult.error.format(),
      );
    }

    const { tenantId } = parseResult.data;
    const { membership, tenant } = await TenantService.validateTenantMembership(
      req.user!.id,
      tenantId,
    );

    await AuditService.logActivity({
      tenantId: tenant.id,
      membershipId: membership.id,
      action: "TENANT_SWITCH",
      resourceType: "tenant",
      resourceId: tenant.id,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status,
        },
        membership: {
          id: membership.id,
          status: membership.status,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /current - Get current tenant context and resolved permissions
tenantRouter.get(
  "/current",
  authenticate,
  requireTenantContext,
  async (req, res) => {
    res.json({
      success: true,
      data: {
        tenant: req.tenant,
        membership: req.membership,
        permissions: req.permissions,
      },
    });
  },
);

// GET /admin-test - Sensitive admin endpoint protected by permission and AAT2 (MFA)
tenantRouter.get(
  "/admin-test",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage", { requireAal2: true }),
  async (req, res) => {
    res.json({
      success: true,
      message: "Admin access granted with MFA verified",
      tenantId: req.tenantId,
    });
  },
);
