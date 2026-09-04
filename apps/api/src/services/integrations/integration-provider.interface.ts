export type IntegrationStatus =
  | "NOT_CONFIGURED"
  | "CONFIGURED"
  | "CONNECTING"
  | "CONNECTED"
  | "DEGRADED"
  | "ERROR"
  | "DISABLED";

export interface IntegrationConnectionResult {
  success: boolean;
  status: IntegrationStatus;
  message: string;
  tokenExpiresAt?: Date;
  updatedCredentials?: string;
}

export interface IntegrationSyncResult {
  records: Record<string, unknown>[];
  nextCursor?: string;
  hasMore: boolean;
  rateLimited?: boolean;
  status: "SUCCESS" | "FAILED" | "DEGRADED";
  errorDetails?: string;
}

export interface IIntegrationProviderAdapter {
  testConnection(
    tenantIntegrationId: string,
    credentials: string,
    settings?: Record<string, unknown>,
  ): Promise<IntegrationConnectionResult>;

  fetchSyncData(
    tenantId: string,
    tenantIntegrationId: string,
    credentials: string,
    cursor?: string,
    limit?: number,
  ): Promise<IntegrationSyncResult>;

  refreshToken?(credentials: string): Promise<{
    valid: boolean;
    newCredentials?: string;
    expiresAt?: Date;
  }>;
}
