import {
  IInfrastructureProvisioner,
  ProvisionerType,
  ProvisionRequestParams,
  ProvisionResult,
  VerificationResult,
} from "./infrastructure-provisioner.interface.js";

export class TestInfrastructureProvisioner implements IInfrastructureProvisioner {
  readonly providerType: ProvisionerType = "TEST_STUB";
  readonly name = "Explicit Test Provisioner (Testing Only)";
  readonly isConfigured = true;

  // Configurable test behaviors
  public shouldSucceed = true;
  public simulatedSchemaVersion = "0080";
  public simulatedIsolationVerified = true;
  public simulatedResidencyVerified = true;
  public simulatedDatabaseReachable = true;
  public simulatedBackupConfigured = true;

  async requestProvisioning(params: ProvisionRequestParams): Promise<ProvisionResult> {
    if (!this.shouldSucceed) {
      return {
        success: false,
        status: "PROVISIONING_FAILED",
        providerType: this.providerType,
        errorDetails: "TEST_SIMULATED_FAILURE: Provisioner failed by test configuration.",
        migrationStatus: "MIGRATION_FAILED",
        isolationVerified: false,
        residencyVerified: false,
      };
    }

    return {
      success: true,
      status: "PROVISIONED",
      providerType: this.providerType,
      actualRegion: params.requestedRegion || "ap-southeast-1",
      providerRegion: params.requestedRegion || "ap-southeast-1",
      actualSchemaVersion: this.simulatedSchemaVersion,
      migrationStatus: "SCHEMA_UP_TO_DATE",
      isolationVerified: this.simulatedIsolationVerified,
      residencyVerified: this.simulatedResidencyVerified,
    };
  }

  async verifyProvisioning(params: { tenantId: string; configId: string }): Promise<VerificationResult> {
    void params;
    const failureReasons: string[] = [];

    if (!this.simulatedDatabaseReachable) {
      failureReasons.push("DATABASE_UNREACHABLE");
    }
    if (this.simulatedSchemaVersion !== "0080") {
      failureReasons.push("SCHEMA_VERSION_MISMATCH");
    }
    if (!this.simulatedIsolationVerified) {
      failureReasons.push("ISOLATION_UNVERIFIED");
    }
    if (!this.simulatedResidencyVerified) {
      failureReasons.push("DATA_RESIDENCY_UNVERIFIED");
    }
    if (!this.simulatedBackupConfigured) {
      failureReasons.push("BACKUP_NOT_CONFIGURED");
    }

    const verified = failureReasons.length === 0;

    return {
      verified,
      databaseReachable: this.simulatedDatabaseReachable,
      schemaVersionMatches: this.simulatedSchemaVersion === "0080",
      actualSchemaVersion: this.simulatedSchemaVersion,
      migrationStatus: this.simulatedSchemaVersion === "0080" ? "SCHEMA_UP_TO_DATE" : "MIGRATION_PENDING",
      isolationVerified: this.simulatedIsolationVerified,
      residencyVerified: this.simulatedResidencyVerified,
      backupVerified: this.simulatedBackupConfigured,
      failureReasons,
    };
  }

  async checkHealth(params: { tenantId: string; configId: string }): Promise<{ healthy: boolean; details: Record<string, unknown> }> {
    void params;
    return {
      healthy: this.simulatedDatabaseReachable,
      details: {
        provider: this.providerType,
        databaseReachable: this.simulatedDatabaseReachable,
        schemaVersion: this.simulatedSchemaVersion,
      },
    };
  }

  async runMigrations(params: { tenantId: string; configId: string; targetVersion: string }): Promise<{ success: boolean; appliedVersion: string; error?: string }> {
    void params;
    if (!this.shouldSucceed) {
      return {
        success: false,
        appliedVersion: this.simulatedSchemaVersion,
        error: "MIGRATION_FAILED: Simulated migration failure.",
      };
    }
    this.simulatedSchemaVersion = params.targetVersion;
    return {
      success: true,
      appliedVersion: params.targetVersion,
    };
  }

  async checkBackupStatus(params: { tenantId: string; configId: string }): Promise<{ backupConfigured: boolean; lastBackupTimestamp?: Date; evidence?: Record<string, unknown> }> {
    void params;
    return {
      backupConfigured: this.simulatedBackupConfigured,
      lastBackupTimestamp: this.simulatedBackupConfigured ? new Date() : undefined,
      evidence: { provider: this.providerType, type: "TEST_SNAPSHOT" },
    };
  }

  async requestDeprovisioning(params: { tenantId: string; configId: string }): Promise<{ success: boolean; status: "DEPROVISIONING" | "DEPROVISIONED" | "PROVISIONING_FAILED"; errorDetails?: string }> {
    void params;
    if (!this.shouldSucceed) {
      return {
        success: false,
        status: "PROVISIONING_FAILED",
        errorDetails: "DEPROVISION_FAILED: Test simulated failure.",
      };
    }
    return {
      success: true,
      status: "DEPROVISIONED",
    };
  }
}
