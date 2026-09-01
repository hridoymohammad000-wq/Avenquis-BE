import {
  db,
  globalIntegrations,
  tenantIntegrations,
  integrationSyncLogs,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

import { SecretService } from "./secret.service.js";

export class IntegrationsService {
  private static redactCredentials<T extends { credentials?: string | null }>(
    connection: T,
  ) {
    const safeConnection = { ...connection };
    delete safeConnection.credentials;
    return safeConnection;
  }

  static async getGlobalIntegrations(category?: string) {
    const filters = [eq(globalIntegrations.isActive, true)];
    if (category) {
      filters.push(eq(globalIntegrations.category, category));
    }

    return db
      .select()
      .from(globalIntegrations)
      .where(and(...filters));
  }

  static async getTenantIntegrations(tenantId: string) {
    return db
      .select({
        id: tenantIntegrations.id,
        tenantId: tenantIntegrations.tenantId,
        integrationId: tenantIntegrations.integrationId,
        status: tenantIntegrations.status,
        lastSyncedAt: tenantIntegrations.lastSyncedAt,
        name: globalIntegrations.name,
        slug: globalIntegrations.slug,
        category: globalIntegrations.category,
      })
      .from(tenantIntegrations)
      .innerJoin(
        globalIntegrations,
        eq(tenantIntegrations.integrationId, globalIntegrations.id),
      )
      .where(eq(tenantIntegrations.tenantId, tenantId));
  }

  static async connectIntegration(
    tenantId: string,
    integrationId: string,
    credentials: string,
    settings: unknown,
  ) {
    const [integration] = await db
      .select()
      .from(globalIntegrations)
      .where(eq(globalIntegrations.id, integrationId));

    if (!integration || !integration.isActive) {
      throw new ApiError(
        400,
        "Integration not found or inactive",
        "INTEGRATION_NOT_FOUND",
      );
    }

    const encryptedCredentials = SecretService.encryptSecret(credentials);

    const existingList = await db
      .select()
      .from(tenantIntegrations)
      .where(eq(tenantIntegrations.tenantId, tenantId));

    const existingConnection = existingList.find(
      (e) => e.integrationId === integrationId,
    );

    if (existingConnection) {
      const [updated] = await db
        .update(tenantIntegrations)
        .set({
          credentials: encryptedCredentials,
          settings,
          status: "CONNECTED",
          updatedAt: new Date(),
        })
        .where(eq(tenantIntegrations.id, existingConnection.id))
        .returning();
      return this.redactCredentials(updated);
    }

    const [connected] = await db
      .insert(tenantIntegrations)
      .values({
        tenantId,
        integrationId,
        credentials: encryptedCredentials,
        settings,
        status: "CONNECTED",
      })
      .returning();

    return this.redactCredentials(connected);
  }

  static async logSyncEvent(
    tenantId: string,
    tenantIntegrationId: string,
    syncType: string,
    status: string,
    recordsProcessed: number,
    errorDetails?: string,
  ) {
    const [connection] = await db
      .select({ id: tenantIntegrations.id })
      .from(tenantIntegrations)
      .where(
        and(
          eq(tenantIntegrations.id, tenantIntegrationId),
          eq(tenantIntegrations.tenantId, tenantId),
        ),
      );

    if (!connection) {
      throw new ApiError(
        404,
        "Tenant integration not found",
        "TENANT_INTEGRATION_NOT_FOUND",
      );
    }

    const [log] = await db
      .insert(integrationSyncLogs)
      .values({
        tenantIntegrationId,
        syncType,
        status,
        recordsProcessed,
        errorDetails,
        completedAt: status === "IN_PROGRESS" ? null : new Date(),
      })
      .returning();
    return log;
  }
}
