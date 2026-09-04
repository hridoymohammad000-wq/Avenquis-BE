export type ProvisionerType =
  | "TEST_STUB"
  | "RENDER_SUPABASE_API"
  | "AWS_RDS"
  | "MANUAL_PROVISIONER";

export type ProvisioningLifecycleStatus =
  | "PROVISIONING_REQUESTED"
  | "CONFIGURATION_STORED"
  | "PROVISIONING_IN_PROGRESS"
  | "PROVISIONED"
  | "VERIFICATION_FAILED"
  | "DEPROVISIONING"
  | "DEPROVISIONED"
  | "PROVISIONING_FAILED";

export type IsolationMode =
  | "SHARED_SCHEMA_RLS"
  | "DEDICATED_DATABASE"
  | "DEDICATED_DEPLOYMENT";

export type ReadinessStatus =
  | "NOT_READY"
  | "PENDING_VERIFICATION"
  | "READY"
  | "DEGRADED"
  | "UNKNOWN";

export type MigrationStatus =
  | "UNKNOWN"
  | "SCHEMA_UP_TO_DATE"
  | "MIGRATION_PENDING"
  | "MIGRATION_FAILED";

export interface ProvisionRequestParams {
  tenantId: string;
  isolationMode: IsolationMode;
  requestedRegion: string;
  databaseUrlSecret?: string;
  storageBucketName?: string;
  kmsKeyId?: string;
  idempotencyKey?: string;
}

export interface ProvisionResult {
  success: boolean;
  status: ProvisioningLifecycleStatus;
  actualRegion?: string;
  providerRegion?: string;
  actualSchemaVersion?: string;
  migrationStatus?: MigrationStatus;
  isolationVerified?: boolean;
  residencyVerified?: boolean;
  errorDetails?: string;
  providerType: ProvisionerType;
}

export interface VerificationResult {
  verified: boolean;
  databaseReachable: boolean;
  schemaVersionMatches: boolean;
  actualSchemaVersion?: string;
  migrationStatus: MigrationStatus;
  isolationVerified: boolean;
  residencyVerified: boolean;
  backupVerified: boolean;
  failureReasons: string[];
}

export interface IInfrastructureProvisioner {
  readonly providerType: ProvisionerType;
  readonly name: string;
  readonly isConfigured: boolean;

  requestProvisioning(params: ProvisionRequestParams): Promise<ProvisionResult>;
  verifyProvisioning(params: { tenantId: string; configId: string }): Promise<VerificationResult>;
  checkHealth(params: { tenantId: string; configId: string }): Promise<{ healthy: boolean; details: Record<string, unknown> }>;
  runMigrations(params: { tenantId: string; configId: string; targetVersion: string }): Promise<{ success: boolean; appliedVersion: string; error?: string }>;
  checkBackupStatus(params: { tenantId: string; configId: string }): Promise<{ backupConfigured: boolean; lastBackupTimestamp?: Date; evidence?: Record<string, unknown> }>;
  requestDeprovisioning(params: { tenantId: string; configId: string }): Promise<{ success: boolean; status: ProvisioningLifecycleStatus; errorDetails?: string }>;
}
