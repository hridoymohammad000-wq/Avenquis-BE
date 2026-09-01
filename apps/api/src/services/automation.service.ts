import {
  db,
  webhookEndpoints,
  workflowAutomationRules,
  eq,
  and,
} from "@avenquis/database";
import crypto from "crypto";

export class AutomationService {
  // ──────────── WEBHOOKS ────────────
  static async registerWebhook(
    tenantId: string,
    data: {
      url: string;
      eventTypes: string[];
    },
  ) {
    // Generate a random secret for webhook payload signing
    const secret = crypto.randomBytes(32).toString("hex");

    const [webhook] = await db
      .insert(webhookEndpoints)
      .values({
        tenantId,
        url: data.url,
        secret,
        eventTypes: data.eventTypes,
        status: "active",
      })
      .returning();

    return webhook;
  }

  static async getWebhooks(tenantId: string) {
    return db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.tenantId, tenantId));
  }

  // ──────────── WORKFLOW AUTOMATION ────────────
  static async createAutomationRule(
    tenantId: string,
    data: {
      name: string;
      triggerEvent: string;
      condition?: Record<string, unknown>;
      actionType: string;
      actionPayload?: Record<string, unknown>;
    },
  ) {
    const [rule] = await db
      .insert(workflowAutomationRules)
      .values({
        tenantId,
        name: data.name,
        triggerEvent: data.triggerEvent,
        condition: data.condition,
        actionType: data.actionType,
        actionPayload: data.actionPayload,
        isActive: true,
      })
      .returning();

    return rule;
  }

  static async getAutomationRules(tenantId: string, triggerEvent?: string) {
    const filters = [eq(workflowAutomationRules.tenantId, tenantId)];
    if (triggerEvent) {
      filters.push(eq(workflowAutomationRules.triggerEvent, triggerEvent));
    }

    return db
      .select()
      .from(workflowAutomationRules)
      .where(and(...filters))
      .orderBy(workflowAutomationRules.createdAt);
  }
}
