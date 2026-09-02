import { Request, Response, NextFunction } from "express";
import { TenantService } from "../../services/tenant.service.js";
import { PermissionService } from "../../services/permission.service.js";
import { AuditService } from "../../services/audit.service.js";
import { ApiError } from "../../errors/api-error.js";
import { withTenantContext } from "@avenquis/database";

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

    // Keep the transaction alive for the complete Express request. The
    // database proxy routes downstream service queries through this same
    // connection, so transaction-local RLS settings cannot leak or disappear.
    return withTenantContext(
      { tenantId: tenant.id, membershipId: membership.id },
      async () => {
        const responseComplete = new Promise<void>((resolve) => {
          if (res.writableEnded) {
            resolve();
            return;
          }
          const complete = () => resolve();
          res.once("finish", complete);
          res.once("close", complete);
        });
        next();
        await responseComplete;
      },
    ).catch(next);
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
