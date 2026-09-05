import {
  IIntegrationProviderAdapter,
  IntegrationConnectionResult,
  IntegrationSyncResult,
} from "./integration-provider.interface.js";

/**
 * TEST ONLY Integration Adapter.
 * Explicitly used for unit tests to simulate pagination, rate limits, and record syncing deterministically.
 * MUST NOT be registered as default production adapter.
 */
export class TestIntegrationAdapter implements IIntegrationProviderAdapter {
  async testConnection(
    _tenantIntegrationId: string,
    credentials: string,
  ): Promise<IntegrationConnectionResult> {
    if (!credentials || credentials.trim() === "") {
      return {
        success: false,
        status: "NOT_CONFIGURED",
        message: "Credentials missing.",
      };
    }

    if (credentials.includes("invalid") || credentials === "bad_key") {
      return {
        success: false,
        status: "ERROR",
        message: "Invalid credentials.",
      };
    }

    return {
      success: true,
      status: "CONNECTED",
      message: "Test connection successful.",
      tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
    };
  }

  async fetchSyncData(
    _tenantId: string,
    _tenantIntegrationId: string,
    credentials: string,
    cursor?: string,
    limit: number = 50,
  ): Promise<IntegrationSyncResult> {
    if (credentials.includes("rate_limit_trigger")) {
      return {
        records: [],
        hasMore: true,
        rateLimited: true,
        status: "DEGRADED",
        errorDetails: "Rate limit exceeded.",
      };
    }

    const page = cursor ? parseInt(cursor, 10) : 1;
    const records = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      id: `rec_${page}_${i + 1}`,
      name: `Test Record ${page}-${i + 1}`,
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
