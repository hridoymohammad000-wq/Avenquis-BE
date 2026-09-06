import { PlatformRole, PLATFORM_ROLES } from "../http/middlewares/platform-admin.js";

export function normalizePlatformRoles(values: string[]): PlatformRole[] {
  return values.filter(
    (value): value is PlatformRole =>
      (PLATFORM_ROLES as readonly string[]).includes(value),
  );
}

export function canAccessPlatformRoute(
  userRoles: string[],
  allowedRoles: readonly PlatformRole[] = [],
): boolean {
  const roles = normalizePlatformRoles(userRoles);
  return roles.length > 0 &&
    (allowedRoles.length === 0 || roles.some((role) => allowedRoles.includes(role)));
}

export function assertSeatAllocation(
  plan: { proprietorSeats: number; studentSeats: number },
  requested: { proprietorSeats: number; studentSeats: number },
): void {
  if (
    requested.proprietorSeats < 0 ||
    requested.studentSeats < 0 ||
    requested.proprietorSeats > plan.proprietorSeats ||
    requested.studentSeats > plan.studentSeats
  ) {
    throw new Error("Plan seat limit exceeded");
  }
}
