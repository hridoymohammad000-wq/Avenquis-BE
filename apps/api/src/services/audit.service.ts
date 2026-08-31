import { db, activityEvents, securityEvents } from "@avenquis/database";
import { logger } from "../logging/logger.js";

export class AuditService {
  static async logActivity(params: {
    tenantId: string;
    membershipId?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
    ipAddress?: string | null;
  }) {
    try {
      await db.insert(activityEvents).values({
        tenantId: params.tenantId,
        membershipId: params.membershipId ?? null,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId ?? null,
        metadata: params.metadata ?? {},
        ipAddress: params.ipAddress ?? null,
      });
    } catch (err) {
      logger.error({ err, params }, "Failed to record activity event");
    }
  }

  static async logSecurityEvent(params: {
    eventType: string;
    severity?: "info" | "warning" | "critical";
    details: Record<string, unknown>;
    tenantId?: string | null;
    membershipId?: string | null;
    ipAddress?: string | null;
  }) {
    try {
      await db.insert(securityEvents).values({
        eventType: params.eventType,
        severity: params.severity ?? "info",
        details: params.details,
        tenantId: params.tenantId ?? null,
        membershipId: params.membershipId ?? null,
        ipAddress: params.ipAddress ?? null,
      });
    } catch (err) {
      logger.error({ err, params }, "Failed to record security event");
    }
  }
}
