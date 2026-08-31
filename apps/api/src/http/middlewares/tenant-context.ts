import { Request, Response, NextFunction } from "express";
import { TenantService } from "../../services/tenant.service.js";
import { PermissionService } from "../../services/permission.service.js";
import { AuditService } from "../../services/audit.service.js";
import { ApiError } from "../../errors/api-error.js";

export async function requireTenantContext(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required", "UNAUTHORIZED"));
  }

  const tenantId =
    (req.headers["x-tenant-id"] as string) ||
    req.params.tenantId ||
    (req.query.tenantId as string);

  if (!tenantId) {
    return next(
      new ApiError(
        400,
        "Tenant context required: missing x-tenant-id header",
        "TENANT_HEADER_REQUIRED",
      ),
    );
  }

  try {
    const { membership, tenant } = await TenantService.validateTenantMembership(
      req.user.id,
      tenantId,
    );

    req.tenantId = tenant.id;
    req.tenant = tenant;
    req.membership = membership;

    // Resolve permissions dynamically
    req.permissions = await PermissionService.getMembershipPermissions(
      membership.id,
    );

    return next();
  } catch (err) {
    // Log security event for suspicious/failed tenant access
    AuditService.logSecurityEvent({
      eventType: "UNAUTHORIZED_TENANT_ACCESS_ATTEMPT",
      severity: "warning",
      details: {
        userId: req.user.id,
        targetTenantId: tenantId,
        ipAddress: req.ip,
      },
      tenantId: tenantId,
      ipAddress: req.ip,
    });

    return next(err);
  }
}
