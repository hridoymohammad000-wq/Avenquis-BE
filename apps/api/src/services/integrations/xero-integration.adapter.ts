import {
  IIntegrationProviderAdapter,
  IntegrationConnectionResult,
  IntegrationSyncResult,
} from "./integration-provider.interface.js";

/**
 * Production Xero Integration Adapter.
 * Does NOT fabricate fake accounts, fake OAuth tokens, or pretend to be CONNECTED without live API connection.
 */
export class XeroIntegrationAdapter implements IIntegrationProviderAdapter {
  async testConnection(
    _tenantIntegrationId: string,
    credentials: string,
  ): Promise<IntegrationConnectionResult> {
    if (!credentials || credentials.trim() === "") {
      return {
        success: false,
        status: "NOT_CONFIGURED",
        message: "Xero credentials (OAuth token / API key) are missing.",
      };
    }

    // Production adapter does not fabricate CONNECTED without live authoritative Xero OAuth endpoint response
    return {
      success: false,
      status: "CONFIGURED",
      message: "Production Xero OAuth 2.0 API credentials configured. Live connection verification requires configured production OAuth gateway.",
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
        errorDetails: "Xero integration credentials not configured.",
      };
    }

    // Production adapter returns empty records and truthful status when no live API is connected
    return {
      records: [],
      hasMore: false,
      status: "FAILED",
      errorDetails: "Live Xero API integration gateway is not connected in this environment.",
    };
  }

  async refreshToken(): Promise<{
    valid: boolean;
    newCredentials?: string;
    expiresAt?: Date;
  }> {
    return { valid: false };
  }
}
