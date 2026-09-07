import { Request, Response, NextFunction } from "express";
import {
  db,
  platformUserRoles,
  eq,
  withUserBootstrapContext,
} from "@avenquis/database";
import { ApiError } from "../../errors/api-error.js";
import { canAccessPlatformRoute, normalizePlatformRoles } from "../../services/platform-admin.policy.js";

export const PLATFORM_ROLES = [
  "PLATFORM_SUPER_ADMIN",
  "PLATFORM_ADMIN",
  "SALES",
  "MARKETING",
  "SUPPORT",
  "FINANCE",
  "OPS",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export function requirePlatformRole(...allowedRoles: PlatformRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required", "UNAUTHORIZED"));
    }

    return withUserBootstrapContext({ userId: req.user.id }, async () => {
      const rows = await db
        .select({ role: platformUserRoles.role })
        .from(platformUserRoles)
        .where(eq(platformUserRoles.userId, req.user!.id));
      const roles = normalizePlatformRoles(rows.map((row) => row.role));

      if (!canAccessPlatformRoute(roles, allowedRoles)) {
        throw new ApiError(403, "Platform administrator access required", "PLATFORM_ROLE_REQUIRED");
      }

      req.platformRoles = roles;
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
    }).catch(next);
  };
}

export function hasPlatformRole(req: Request, role: PlatformRole): boolean {
  return req.platformRoles?.includes(role) ?? false;
}
