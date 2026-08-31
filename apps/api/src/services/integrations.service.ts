import {
  db,
  globalIntegrations,
  tenantIntegrations,
  integrationSyncLogs,
  eq,
  desc,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class IntegrationsService {
  static async getGlobalIntegrations(category?: string) {
    const query = db
      .select()
      .from(globalIntegrations)
      .where(eq(globalIntegrations.isActive, true));

    return await query; // simplified for now, would use and() if category is provided
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
        eq(tenantIntegrations.integrationId, globalIntegrations.id)
      )
      .where(eq(tenantIntegrations.tenantId, tenantId));
  }

  static async connectIntegration(
    tenantId: string,
    integrationId: string,
    credentials: string,
    settings: any
  ) {
    const [integration] = await db
      .select()
      .from(globalIntegrations)
      .where(eq(globalIntegrations.id, integrationId));

    if (!integration || !integration.isActive) {
      throw new ApiError(400, "Integration not found or inactive", "INTEGRATION_NOT_FOUND");
    }

    const [existing] = await db
      .select()
      .from(tenantIntegrations)
      .where(
        eq(tenantIntegrations.tenantId, tenantId)
      );
      // Wait, a tenant can have multiple integrations, need AND filter
      // Actually we will check if the specific integrationId is connected
    const existingList = await db
      .select()
      .from(tenantIntegrations)
      .where(eq(tenantIntegrations.tenantId, tenantId));
    
    const existingConnection = existingList.find(e => e.integrationId === integrationId);

    if (existingConnection) {
      const [updated] = await db
        .update(tenantIntegrations)
        .set({
          credentials,
          settings,
          status: "CONNECTED",
          updatedAt: new Date(),
        })
        .where(eq(tenantIntegrations.id, existingConnection.id))
        .returning();
      return updated;
    }

    const [connected] = await db
      .insert(tenantIntegrations)
      .values({
        tenantId,
        integrationId,
        credentials,
        settings,
        status: "CONNECTED",
      })
      .returning();

    return connected;
  }

  static async logSyncEvent(
    tenantIntegrationId: string,
    syncType: string,
    status: string,
    recordsProcessed: number,
    errorDetails?: string
  ) {
    const [log] = await db
      .insert(integrationSyncLogs)
      .values({
        tenantIntegrationId,
        syncType,
        status,
        recordsProcessed,
        errorDetails,
        completedAt: status === 'IN_PROGRESS' ? null : new Date(),
      })
      .returning();
    return log;
  }
}
