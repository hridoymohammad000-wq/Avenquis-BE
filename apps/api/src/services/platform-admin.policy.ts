import { ApiError } from "../errors/api-error.js";
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

export interface PlanSeatLimits {
  proprietorSeats: number;
  partnerSeats?: number;
  studentSeats: number;
}

export interface RequestedSeatCounts {
  proprietorSeats?: number;
  partnerSeats?: number;
  studentSeats?: number;
}

export function assertSeatAllocation(
  plan: PlanSeatLimits,
  requested: RequestedSeatCounts,
): void {
  const reqProprietor = requested.proprietorSeats ?? 0;
  const reqPartner = requested.partnerSeats ?? 0;
  const reqStudent = requested.studentSeats ?? 0;

  const maxProprietor = plan.proprietorSeats;
  const maxPartner = plan.partnerSeats ?? 0;
  const maxStudent = plan.studentSeats;

  if (
    reqProprietor < 0 ||
    reqPartner < 0 ||
    reqStudent < 0 ||
    reqProprietor > maxProprietor ||
    reqPartner > maxPartner ||
    reqStudent > maxStudent
  ) {
    throw new ApiError(400, "Plan seat limit exceeded", "SEAT_LIMIT_EXCEEDED");
  }
}

export function classifyMemberRoleCode(
  roleCode: string | null | undefined,
  plan: PlanSeatLimits,
): "proprietor" | "partner" | "student" | null {
  const code = (roleCode || "").toLowerCase().trim();
  if (!code) return null;

  if (code === "proprietor") return "proprietor";
  if (code === "partner" || code === "lead_partner") return "partner";
  if (code === "student" || code === "articled_student") return "student";

  if (code === "owner") {
    if (plan.proprietorSeats > 0) return "proprietor";
    if ((plan.partnerSeats ?? 0) > 0) return "partner";
    return "student";
  }

  return null;
}
