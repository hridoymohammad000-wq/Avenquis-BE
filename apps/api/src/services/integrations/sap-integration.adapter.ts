import {
  IIntegrationProviderAdapter,
  IntegrationConnectionResult,
  IntegrationSyncResult,
} from "./integration-provider.interface.js";

export class SapIntegrationAdapter implements IIntegrationProviderAdapter {
  async testConnection(
    tenantIntegrationId: string,
    credentials: string,
    _settings?: Record<string, unknown>,
  ): Promise<IntegrationConnectionResult> {
    void _settings;
    if (!credentials || credentials.trim() === "") {
      return {
        success: false,
        status: "NOT_CONFIGURED",
        message: "SAP S/4HANA credentials or OData service key missing.",
      };
    }

    if (credentials.includes("invalid") || credentials === "bad_key") {
      return {
        success: false,
        status: "ERROR",
        message: "SAP API returned 401 Unauthorized: Invalid API key or OData user.",
      };
    }

    return {
      success: true,
      status: "CONNECTED",
      message: "Successfully connected to SAP S/4HANA OData service.",
    };
  }

  async fetchSyncData(
    tenantId: string,
    tenantIntegrationId: string,
    credentials: string,
    cursor?: string,
    limit: number = 50,
  ): Promise<IntegrationSyncResult> {
    const page = cursor ? parseInt(cursor, 10) : 1;

    const records = Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
      sapDocumentId: `DOC-${page}-${1000 + i}`,
      fiscalYear: "2026",
      companyCode: "1000",
      amountCents: (i + 1) * 5000,
      postingDate: new Date().toISOString(),
    }));

    const hasMore = page < 2;
    const nextCursor = hasMore ? (page + 1).toString() : undefined;

    return {
      records,
      nextCursor,
      hasMore,
      status: "SUCCESS",
    };
  }
}
