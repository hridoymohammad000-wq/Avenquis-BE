import {
  db,
  globalIntegrations,
  tenantIntegrations,
  integrationSyncLogs,
  eq,
  and,
  desc,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";
import { SecretService } from "./secret.service.js";
import { XeroIntegrationAdapter } from "./integrations/xero-integration.adapter.js";
import { SapIntegrationAdapter } from "./integrations/sap-integration.adapter.js";
import { IIntegrationProviderAdapter } from "./integrations/integration-provider.interface.js";

export class IntegrationsService {
  private static adapters: Record<string, IIntegrationProviderAdapter> = {
    xero: new XeroIntegrationAdapter(),
    "sap-erp": new SapIntegrationAdapter(),
    sap: new SapIntegrationAdapter(),
  };

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
    const records = await db
      .select({
        id: tenantIntegrations.id,
        tenantId: tenantIntegrations.tenantId,
        integrationId: tenantIntegrations.integrationId,
        status: tenantIntegrations.status,
        lastSyncedAt: tenantIntegrations.lastSyncedAt,
        lastSyncStatus: tenantIntegrations.lastSyncStatus,
        lastSyncError: tenantIntegrations.lastSyncError,
        syncCursor: tenantIntegrations.syncCursor,
        tokenExpiresAt: tenantIntegrations.tokenExpiresAt,
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

    return records;
  }

  static async connectIntegration(
    tenantId: string,
    integrationId: string,
    credentials: string,
    settings: unknown = {},
  ) {
    const [integration] = await db
      .select()
      .from(globalIntegrations)
      .where(eq(globalIntegrations.id, integrationId));

    if (!integration || !integration.isActive) {
      throw new ApiError(400, "Integration not found or inactive", "INTEGRATION_NOT_FOUND");
    }

    const encryptedCredentials = SecretService.encryptSecret(credentials);

    const existingList = await db
      .select()
      .from(tenantIntegrations)
      .where(eq(tenantIntegrations.tenantId, tenantId));

    const existingConnection = existingList.find((e) => e.integrationId === integrationId);

    let connectionRecord;
    if (existingConnection) {
      const [updated] = await db
        .update(tenantIntegrations)
        .set({
          credentials: encryptedCredentials,
          settings,
          status: "CONFIGURED", // CONFIGURED state until connection test succeeds
          updatedAt: new Date(),
        })
        .where(eq(tenantIntegrations.id, existingConnection.id))
        .returning();
      connectionRecord = updated;
    } else {
      const [inserted] = await db
        .insert(tenantIntegrations)
        .values({
          tenantId,
          integrationId,
          credentials: encryptedCredentials,
          settings,
          status: "CONFIGURED",
        })
        .returning();
      connectionRecord = inserted;
    }

    return this.redactIntegrationSecrets(connectionRecord);
  }

  static async testConnection(tenantId: string, tenantIntegrationId: string) {
    const [tenantIntegration] = await db
      .select({
        id: tenantIntegrations.id,
        tenantId: tenantIntegrations.tenantId,
        integrationId: tenantIntegrations.integrationId,
        credentials: tenantIntegrations.credentials,
        settings: tenantIntegrations.settings,
        slug: globalIntegrations.slug,
      })
      .from(tenantIntegrations)
      .innerJoin(
        globalIntegrations,
        eq(tenantIntegrations.integrationId, globalIntegrations.id),
      )
      .where(
        and(
          eq(tenantIntegrations.tenantId, tenantId),
          eq(tenantIntegrations.id, tenantIntegrationId),
        ),
      );

    if (!tenantIntegration) {
      throw new ApiError(404, "Tenant integration connection not found", "NOT_FOUND");
    }

    const adapter = this.adapters[tenantIntegration.slug.toLowerCase()];
    if (!adapter) {
      await db
        .update(tenantIntegrations)
        .set({
          status: "NOT_CONFIGURED",
          lastSyncError: `No active provider adapter registered for ${tenantIntegration.slug}`,
          updatedAt: new Date(),
        })
        .where(eq(tenantIntegrations.id, tenantIntegrationId));

      return {
        success: false,
        status: "NOT_CONFIGURED",
        message: `Adapter for ${tenantIntegration.slug} is NOT_CONFIGURED`,
      };
    }

    const decryptedCredentials = tenantIntegration.credentials
      ? SecretService.decryptSecret(tenantIntegration.credentials)
      : "";

    const testResult = await adapter.testConnection(
      tenantIntegrationId,
      decryptedCredentials,
      (tenantIntegration.settings as Record<string, unknown>) || {},
    );

    await db
      .update(tenantIntegrations)
      .set({
        status: testResult.status,
        tokenExpiresAt: testResult.tokenExpiresAt,
        lastSyncError: testResult.success ? null : testResult.message,
        updatedAt: new Date(),
      })
      .where(eq(tenantIntegrations.id, tenantIntegrationId));

    return testResult;
  }

  static async runIncrementalSync(
    tenantId: string,
    tenantIntegrationId: string,
    data?: { cursor?: string; idempotencyKey?: string },
  ) {
    const [tenantIntegration] = await db
      .select({
        id: tenantIntegrations.id,
        tenantId: tenantIntegrations.tenantId,
        integrationId: tenantIntegrations.integrationId,
        credentials: tenantIntegrations.credentials,
        settings: tenantIntegrations.settings,
        syncCursor: tenantIntegrations.syncCursor,
        slug: globalIntegrations.slug,
      })
      .from(tenantIntegrations)
      .innerJoin(
        globalIntegrations,
        eq(tenantIntegrations.integrationId, globalIntegrations.id),
      )
      .where(
        and(
          eq(tenantIntegrations.tenantId, tenantId),
          eq(tenantIntegrations.id, tenantIntegrationId),
        ),
      );

    if (!tenantIntegration) {
      throw new ApiError(404, "Tenant integration connection not found", "NOT_FOUND");
    }

    // Idempotency Check
    if (data?.idempotencyKey) {
      const [existingLog] = await db
        .select()
        .from(integrationSyncLogs)
        .where(
          and(
            eq(integrationSyncLogs.tenantId, tenantId),
            eq(integrationSyncLogs.idempotencyKey, data.idempotencyKey),
          ),
        );

      if (existingLog) {
        return {
          duplicate: true,
          message: "Idempotent sync request already processed",
          log: existingLog,
        };
      }
    }

    const adapter = this.adapters[tenantIntegration.slug.toLowerCase()];
    if (!adapter) {
      throw new ApiError(
        400,
        `No adapter available for provider ${tenantIntegration.slug}`,
        "PROVIDER_UNAVAILABLE",
      );
    }

    const decryptedCredentials = tenantIntegration.credentials
      ? SecretService.decryptSecret(tenantIntegration.credentials)
      : "";

    const cursorToUse = data?.cursor || tenantIntegration.syncCursor || undefined;
    const syncResult = await adapter.fetchSyncData(
      tenantId,
      tenantIntegrationId,
      decryptedCredentials,
      cursorToUse,
    );

    const isRateLimited = Boolean(syncResult.rateLimited);
    const newStatus = isRateLimited ? "DEGRADED" : syncResult.status === "SUCCESS" ? "CONNECTED" : "ERROR";

    await db
      .update(tenantIntegrations)
      .set({
        status: newStatus,
        lastSyncedAt: new Date(),
        lastSyncStatus: syncResult.status,
        lastSyncError: syncResult.errorDetails,
        syncCursor: syncResult.nextCursor || tenantIntegration.syncCursor,
        updatedAt: new Date(),
      })
      .where(eq(tenantIntegrations.id, tenantIntegrationId));

    const log = await this.logSyncEvent(
      tenantId,
      tenantIntegrationId,
      "INCREMENTAL_SYNC",
      syncResult.status,
      syncResult.records.length,
      syncResult.nextCursor,
      data?.idempotencyKey,
      isRateLimited,
      syncResult.errorDetails,
    );

    return {
      recordsProcessed: syncResult.records.length,
      nextCursor: syncResult.nextCursor,
      hasMore: syncResult.hasMore,
      status: syncResult.status,
      rateLimited: isRateLimited,
      log,
    };
  }

  static async logSyncEvent(
    tenantId: string,
    tenantIntegrationId: string,
    syncType: string,
    status: string,
    recordsProcessed: number,
    checkpoint?: string,
    idempotencyKey?: string,
    rateLimited: boolean = false,
    errorDetails?: string,
  ) {
    const [log] = await db
      .insert(integrationSyncLogs)
      .values({
        tenantId,
        tenantIntegrationId,
        syncType,
        status,
        recordsProcessed,
        checkpoint,
        idempotencyKey,
        rateLimited,
        errorDetails: errorDetails ? errorDetails.substring(0, 1000) : undefined,
        completedAt: status === "IN_PROGRESS" ? null : new Date(),
      })
      .returning();

    return log;
  }

  static async getSyncLogs(tenantId: string, tenantIntegrationId?: string) {
    const filters = [eq(integrationSyncLogs.tenantId, tenantId)];
    if (tenantIntegrationId) {
      filters.push(eq(integrationSyncLogs.tenantIntegrationId, tenantIntegrationId));
    }

    return db
      .select()
      .from(integrationSyncLogs)
      .where(and(...filters))
      .orderBy(desc(integrationSyncLogs.startedAt));
  }

  private static redactIntegrationSecrets(record: typeof tenantIntegrations.$inferSelect) {
    const copy = { ...record } as Record<string, unknown>;
    delete copy.credentials;
    copy.hasCredentials = Boolean(record.credentials);
    return copy;
  }
}
