import {
  IInfrastructureProvisioner,
  ProvisionerType,
  ProvisionRequestParams,
  ProvisionResult,
  VerificationResult,
} from "./infrastructure-provisioner.interface.js";

export class ManualActionProvisioner implements IInfrastructureProvisioner {
  readonly providerType: ProvisionerType = "MANUAL_PROVISIONER";
  readonly name = "Manual Operator Provisioner";
  readonly isConfigured = false;

  async requestProvisioning(params: ProvisionRequestParams): Promise<ProvisionResult> {
    void params;
    return {
      success: false,
      status: "CONFIGURATION_STORED",
      providerType: this.providerType,
      errorDetails: "MANUAL_ACTION_REQUIRED: Automated infrastructure API is not configured. Manual operator intervention required.",
      migrationStatus: "UNKNOWN",
      isolationVerified: false,
      residencyVerified: false,
    };
  }

  async verifyProvisioning(params: { tenantId: string; configId: string }): Promise<VerificationResult> {
    void params;
    return {
      verified: false,
      databaseReachable: false,
      schemaVersionMatches: false,
      migrationStatus: "UNKNOWN",
      isolationVerified: false,
      residencyVerified: false,
      backupVerified: false,
      failureReasons: ["MANUAL_ACTION_REQUIRED: Unverified manual infrastructure deployment."],
    };
  }

  async checkHealth(params: { tenantId: string; configId: string }): Promise<{ healthy: boolean; details: Record<string, unknown> }> {
    void params;
    return {
      healthy: false,
      details: { message: "Manual infrastructure requires manual health verification." },
    };
  }

  async runMigrations(params: { tenantId: string; configId: string; targetVersion: string }): Promise<{ success: boolean; appliedVersion: string; error?: string }> {
    void params;
    return {
      success: false,
      appliedVersion: "0000",
      error: "MANUAL_ACTION_REQUIRED: Automatic migration execution disabled for manual infrastructure.",
    };
  }

  async checkBackupStatus(params: { tenantId: string; configId: string }): Promise<{ backupConfigured: boolean; lastBackupTimestamp?: Date; evidence?: Record<string, unknown> }> {
    void params;
    return {
      backupConfigured: false,
      evidence: { status: "MANUAL_VERIFICATION_REQUIRED" },
    };
  }

  async requestDeprovisioning(params: { tenantId: string; configId: string }): Promise<{ success: boolean; status: "DEPROVISIONING" | "DEPROVISIONED" | "PROVISIONING_FAILED"; errorDetails?: string }> {
    void params;
    return {
      success: false,
      status: "PROVISIONING_FAILED",
      errorDetails: "MANUAL_ACTION_REQUIRED: Manual infrastructure must be deprovisioned by cloud administrator.",
    };
  }
}
