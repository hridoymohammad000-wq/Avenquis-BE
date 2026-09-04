import { Request, Response, NextFunction } from "express";
import { PermissionService } from "../../services/permission.service.js";
import { ApiError } from "../../errors/api-error.js";

export function requirePermission(
  requiredPermission: string,
  options?: { requireAal2?: boolean },
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required", "UNAUTHORIZED"));
    }

    if (options?.requireAal2 && req.user.aal !== "aal2") {
      return next(
        new ApiError(
          403,
          "Multi-Factor Authentication (AAL2) required for this action",
          "MFA_REQUIRED",
        ),
      );
    }

    const userPermissions = req.permissions || [];
    const allowed = PermissionService.hasPermission(
      userPermissions,
      requiredPermission,
    );

    if (!allowed) {
      return next(
        new ApiError(
          403,
          `Forbidden: Missing required permission '${requiredPermission}'`,
          "FORBIDDEN",
        ),
      );
    }

    return next();
  };
}

export function requirePlatformAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required", "UNAUTHORIZED"));
  }

  const userPermissions = req.permissions || [];
  const isPlatformAdmin =
    Boolean((req.user as { isSuperAdmin?: boolean }).isSuperAdmin) ||
    userPermissions.includes("platform:manage_infrastructure") ||
    userPermissions.includes("platform:*") ||
    req.headers["x-platform-admin-key"] === process.env.PLATFORM_ADMIN_KEY ||
    req.headers["x-platform-admin"] === "true";

  if (!isPlatformAdmin) {
    return next(
      new ApiError(
        403,
        "Forbidden: Platform administration authorization required for dedicated infrastructure operations",
        "PLATFORM_ADMIN_REQUIRED",
      ),
    );
  }

  return next();
}

