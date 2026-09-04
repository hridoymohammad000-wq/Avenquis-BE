import {
  db,
  webhookEndpoints,
  workflowAutomationRules,
  automationExecutions,
  eq,
  and,
  desc,
} from "@avenquis/database";
import crypto from "crypto";
import { SsrfGuard } from "./automation/ssrf-guard.js";
import { WebhookDeliveryEngine } from "./automation/webhook-delivery.engine.js";
import { ApiError } from "../errors/api-error.js";

export class AutomationService {
  // ──────────── WEBHOOKS ────────────

  static async registerWebhook(
    tenantId: string,
    data: {
      url: string;
      eventTypes: string[];
    },
  ) {
    // Validate target URL for SSRF vulnerabilities
    SsrfGuard.validateUrl(data.url);

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
        failureCount: 0,
      })
      .returning();

    return webhook;
  }

  static async getWebhooks(tenantId: string) {
    return db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.tenantId, tenantId))
      .orderBy(desc(webhookEndpoints.createdAt));
  }

  static async deleteWebhook(tenantId: string, webhookId: string) {
    const [deleted] = await db
      .delete(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.tenantId, tenantId),
          eq(webhookEndpoints.id, webhookId),
        ),
      )
      .returning();

    if (!deleted) {
      throw new ApiError(404, "Webhook endpoint not found", "NOT_FOUND");
    }

    return deleted;
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
        executionCount: 0,
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
      .orderBy(desc(workflowAutomationRules.createdAt));
  }

  static async getAutomationExecutions(tenantId: string, ruleId?: string) {
    const filters = [eq(automationExecutions.tenantId, tenantId)];
    if (ruleId) {
      filters.push(eq(automationExecutions.ruleId, ruleId));
    }

    return db
      .select()
      .from(automationExecutions)
      .where(and(...filters))
      .orderBy(desc(automationExecutions.executedAt));
  }

  // ──────────── EVENT DISPATCHER ────────────

  /**
   * Internal Event Dispatch Engine.
   * Finds matching webhooks and automation rules, dispatches webhook requests, and logs execution audit.
   */
  static async dispatchEvent(
    tenantId: string,
    eventType: string,
    payload: Record<string, unknown>,
    idempotencyKey?: string,
  ): Promise<{
    webhooksDispatched: number;
    rulesExecuted: number;
  }> {
    let webhooksDispatched = 0;
    let rulesExecuted = 0;

    if (idempotencyKey) {
      // Check if we already executed rules for this idempotency key
      const [existingExecution] = await db
        .select()
        .from(automationExecutions)
        .where(
          and(
            eq(automationExecutions.tenantId, tenantId),
            eq(automationExecutions.idempotencyKey, idempotencyKey)
          )
        );
      if (existingExecution) {
        return { webhooksDispatched: 0, rulesExecuted: 0 };
      }
    }

    // 1. Dispatch Webhooks
    const endpoints = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.tenantId, tenantId),
          eq(webhookEndpoints.status, "active"),
        ),
      );

    for (const ep of endpoints) {
      const eventTypes = (ep.eventTypes as string[]) || [];
      if (eventTypes.includes(eventType) || eventTypes.includes("*")) {
        webhooksDispatched++;
        // Asynchronously deliver or deliver inline
        WebhookDeliveryEngine.deliver({
          endpointId: ep.id,
          tenantId,
          url: ep.url,
          secret: ep.secret,
          eventType,
          payload,
          idempotencyKey,
        }).catch((err) =>
          console.error(`[WebhookDelivery] Dispatch failed for ${ep.id}:`, err),
        );
      }
    }

    // 2. Evaluate Automation Rules
    const rules = await db
      .select()
      .from(workflowAutomationRules)
      .where(
        and(
          eq(workflowAutomationRules.tenantId, tenantId),
          eq(workflowAutomationRules.triggerEvent, eventType),
          eq(workflowAutomationRules.isActive, true),
        ),
      );

    for (const rule of rules) {
      const condition = rule.condition as Record<string, unknown> | null;
      let conditionMatched = true;

      if (condition) {
        for (const [key, val] of Object.entries(condition)) {
          if (payload[key] !== val) {
            conditionMatched = false;
            break;
          }
        }
      }

      if (conditionMatched) {
        rulesExecuted++;

        await db
          .update(workflowAutomationRules)
          .set({
            executionCount: (rule.executionCount || 0) + 1,
            lastTriggeredAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(workflowAutomationRules.id, rule.id));

        await db.insert(automationExecutions).values({
          tenantId,
          ruleId: rule.id,
          triggerEvent: eventType,
          eventPayload: payload,
          idempotencyKey,
          conditionMatched: true,
          actionStatus: "SUCCESS",
          resultPayload: {
            actionType: rule.actionType,
            actionPayload: rule.actionPayload,
          },
        });
      }
    }

    return {
      webhooksDispatched,
      rulesExecuted,
    };
  }
}
