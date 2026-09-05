import {
  IIntegrationProviderAdapter,
  IntegrationConnectionResult,
  IntegrationSyncResult,
} from "./integration-provider.interface.js";

/**
 * Production SAP S/4HANA Integration Adapter.
 * Does NOT fabricate fake documents or pretend to be CONNECTED without live API connection.
 */
export class SapIntegrationAdapter implements IIntegrationProviderAdapter {
  async testConnection(
    _tenantIntegrationId: string,
    credentials: string,
  ): Promise<IntegrationConnectionResult> {
    if (!credentials || credentials.trim() === "") {
      return {
        success: false,
        status: "NOT_CONFIGURED",
        message: "SAP S/4HANA credentials or OData service key missing.",
      };
    }

    return {
      success: false,
      status: "CONFIGURED",
      message: "Production SAP S/4HANA OData service key configured. Live verification requires active SAP OData gateway connection.",
    };
  }

  async fetchSyncData(
    _tenantId: string,
    _tenantIntegrationId: string,
    credentials: string,
  ): Promise<IntegrationSyncResult> {
    if (!credentials || credentials.trim() === "") {
      return {
        records: [],
        hasMore: false,
        status: "FAILED",
        errorDetails: "SAP S/4HANA credentials not configured.",
      };
    }

    return {
      records: [],
      hasMore: false,
      status: "FAILED",
      errorDetails: "Live SAP S/4HANA OData service gateway is not connected in this environment.",
    };
  }
}
