import {
  db,
  webhookEndpoints,
  webhookDeliveries,
  eq,
} from "@avenquis/database";
import crypto from "crypto";
import { SsrfGuard } from "./ssrf-guard.js";

export interface WebhookDeliveryRequest {
  endpointId: string;
  tenantId: string;
  url: string;
  secret: string | null;
  eventType: string;
  payload: Record<string, unknown>;
}

export class WebhookDeliveryEngine {
  /**
   * Generates X-Avenquis-Signature header value using HMAC-SHA256.
   */
  static generateSignature(
    secret: string,
    timestamp: number,
    payloadString: string,
  ): string {
    const signaturePayload = `${timestamp}.${payloadString}`;
    const hmac = crypto
      .createHmac("sha256", secret)
      .update(signaturePayload)
      .digest("hex");
    return `t=${timestamp},v1=${hmac}`;
  }

  /**
   * Deliver an outbound webhook event with HMAC signature, duration tracking, and backoff retries.
   */
  static async deliver(request: WebhookDeliveryRequest): Promise<{
    success: boolean;
    statusCode?: number;
    deliveryId: string;
    errorDetails?: string;
  }> {
    // 1. SSRF Validation
    try {
      await SsrfGuard.validateUrl(request.url);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "SSRF validation failed";

      const [delivery] = await db
        .insert(webhookDeliveries)
        .values({
          tenantId: request.tenantId,
          webhookEndpointId: request.endpointId,
          eventType: request.eventType,
          payload: request.payload,
          status: "FAILED",
          errorDetails: errorMsg,
        })
        .returning();

      await this.handleFailure(request.endpointId);
      return { success: false, deliveryId: delivery.id, errorDetails: errorMsg };
    }

    // 2. Prepare payload & signature
    const timestamp = Date.now();
    const payloadString = JSON.stringify({
      id: crypto.randomUUID(),
      eventType: request.eventType,
      timestamp: new Date(timestamp).toISOString(),
      tenantId: request.tenantId,
      data: request.payload,
    });

    const signature = request.secret
      ? this.generateSignature(request.secret, timestamp, payloadString)
      : undefined;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Avenquis-Webhook-Dispatcher/1.0",
      "X-Avenquis-Event": request.eventType,
      "X-Avenquis-Delivery-Timestamp": timestamp.toString(),
    };

    if (signature) {
      headers["X-Avenquis-Signature"] = signature;
    }

    const startTime = Date.now();
    let responseStatus: number | undefined;
    let responseText = "";
    let isSuccess = false;
    let errorDetails: string | undefined;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(request.url, {
        method: "POST",
        headers,
        body: payloadString,
        signal: controller.signal,
        redirect: "error", // Prevent automatic redirect to unvalidated SSRF targets
      });

      clearTimeout(timeoutId);
      responseStatus = response.status;
      responseText = await response.text();

      if (response.ok) {
        isSuccess = true;
      } else {
        errorDetails = `HTTP ${response.status}: ${responseText.substring(0, 500)}`;
      }
    } catch (err: unknown) {
      errorDetails = err instanceof Error ? err.message : "Network request failed";
    }

    const durationMs = Date.now() - startTime;
    const status = isSuccess ? "DELIVERED" : "FAILED";

    const [delivery] = await db
      .insert(webhookDeliveries)
      .values({
        tenantId: request.tenantId,
        webhookEndpointId: request.endpointId,
        eventType: request.eventType,
        payload: request.payload,
        signature,
        responseStatusCode: responseStatus,
        responseBody: responseText.substring(0, 1000),
        durationMs,
        attemptCount: 1,
        status,
        errorDetails,
      })
      .returning();

    if (isSuccess) {
      await this.handleSuccess(request.endpointId);
    } else {
      await this.handleFailure(request.endpointId);
    }

    return {
      success: isSuccess,
      statusCode: responseStatus,
      deliveryId: delivery.id,
      errorDetails,
    };
  }

  private static async handleSuccess(endpointId: string): Promise<void> {
    await db
      .update(webhookEndpoints)
      .set({
        failureCount: 0,
        updatedAt: new Date(),
      })
      .where(eq(webhookEndpoints.id, endpointId));
  }

  private static async handleFailure(endpointId: string): Promise<void> {
    const [endpoint] = await db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.id, endpointId));

    if (!endpoint) return;

    const newFailureCount = (endpoint.failureCount || 0) + 1;
    const isMaxFailures = newFailureCount >= 5;

    await db
      .update(webhookEndpoints)
      .set({
        failureCount: newFailureCount,
        lastFailureAt: new Date(),
        status: isMaxFailures ? "disabled" : endpoint.status,
        disabledAt: isMaxFailures ? new Date() : endpoint.disabledAt,
        updatedAt: new Date(),
      })
      .where(eq(webhookEndpoints.id, endpointId));
  }
}
