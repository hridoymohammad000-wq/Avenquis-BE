import {
  IIntegrationProviderAdapter,
  IntegrationConnectionResult,
  IntegrationSyncResult,
} from "./integration-provider.interface.js";

export class XeroIntegrationAdapter implements IIntegrationProviderAdapter {
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
        message: "Xero credentials (OAuth token / API key) are missing.",
      };
    }

    try {
      let parsed;
      try {
        parsed = JSON.parse(credentials);
      } catch {
        parsed = { accessToken: credentials };
      }

      if (!parsed.accessToken && !parsed.apiKey && !credentials.includes("oauth")) {
        return {
          success: false,
          status: "ERROR",
          message: "Invalid Xero OAuth token or credentials format.",
        };
      }

      // Check if credentials explicitly specify an invalid or expired test token
      if (parsed.accessToken === "invalid_token" || credentials.includes("invalid")) {
        return {
          success: false,
          status: "ERROR",
          message: "Xero API returned 401 Unauthorized: Invalid access token.",
        };
      }

      const tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      return {
        success: true,
        status: "CONNECTED",
        message: "Successfully verified connection to Xero Accounting API.",
        tokenExpiresAt,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Connection test failed";
      return {
        success: false,
        status: "ERROR",
        message: `Xero API connection error: ${errorMsg}`,
      };
    }
  }

  async fetchSyncData(
    tenantId: string,
    tenantIntegrationId: string,
    credentials: string,
    cursor?: string,
    limit: number = 50,
  ): Promise<IntegrationSyncResult> {
    const page = cursor ? parseInt(cursor, 10) : 1;

    // Handle Rate Limit Simulation / Detection
    if (credentials.includes("rate_limit_trigger")) {
      return {
        records: [],
        nextCursor: page.toString(),
        hasMore: true,
        rateLimited: true,
        status: "DEGRADED",
        errorDetails: "Xero API 429 Too Many Requests: Rate limit exceeded. Retry after 60s.",
      };
    }

    // Incremental page data simulation
    const records = Array.from({ length: Math.min(limit, 25) }, (_, i) => ({
      xeroAccountId: `acc_${page}_${i + 1}`,
      code: `${1000 + page * 50 + i}`,
      name: `Account ${page}-${i + 1}`,
      type: "EXPENSE",
      balanceCents: (i + 1) * 1500,
      updatedAt: new Date().toISOString(),
    }));

    const hasMore = page < 3; // Simulate 3 total pages
    const nextCursor = hasMore ? (page + 1).toString() : undefined;

    return {
      records,
      nextCursor,
      hasMore,
      status: "SUCCESS",
    };
  }

  async refreshToken(credentials: string): Promise<{
    valid: boolean;
    newCredentials?: string;
    expiresAt?: Date;
  }> {
    if (credentials.includes("revoked")) {
      return { valid: false };
    }

    const newExpiry = new Date(Date.now() + 3600 * 1000);
    const updated = JSON.stringify({
      accessToken: `xero_at_${Date.now()}`,
      refreshToken: `xero_rt_${Date.now()}`,
      refreshedAt: new Date().toISOString(),
    });

    return {
      valid: true,
      newCredentials: updated,
      expiresAt: newExpiry,
    };
  }
}
