import {
  db,
  dedicatedTenantConfigs,
  saasReadinessSignoffs,
  infrastructureProvisioningLogs,
  infrastructureAuditEvents,
  eq,
} from "@avenquis/database";
import { SecretService } from "./secret.service.js";
import {
  IInfrastructureProvisioner,
  IsolationMode,
  ProvisionerType,
  ProvisioningLifecycleStatus,
} from "./infrastructure/infrastructure-provisioner.interface.js";
import { ManualActionProvisioner } from "./infrastructure/manual-action.provisioner.js";
import { RenderSupabaseProvisioner } from "./infrastructure/render-supabase.provisioner.js";
import { TestInfrastructureProvisioner } from "./infrastructure/test-stub.provisioner.js";

export class InfrastructureService {
  private static provisioners = new Map<ProvisionerType, IInfrastructureProvisioner>();

  private static initializeProvisioners() {
    if (this.provisioners.size === 0) {
      this.provisioners.set("MANUAL_PROVISIONER", new ManualActionProvisioner());
      this.provisioners.set("RENDER_SUPABASE_API", new RenderSupabaseProvisioner());
      this.provisioners.set("TEST_STUB", new TestInfrastructureProvisioner());
    }
  }

  public static setProvisioner(type: ProvisionerType, provisioner: IInfrastructureProvisioner) {
    this.initializeProvisioners();
    this.provisioners.set(type, provisioner);
  }

  public static getProvisioner(type: ProvisionerType): IInfrastructureProvisioner {
    this.initializeProvisioners();
    return this.provisioners.get(type) || new ManualActionProvisioner();
  }

  public static async getTenantConfig(tenantId: string) {
    const [config] = await db
      .select()
      .from(dedicatedTenantConfigs)
      .where(eq(dedicatedTenantConfigs.tenantId, tenantId));

    if (!config) return null;

    // Secret Redaction for GET operations
    return {
      ...config,
      databaseUrlSecret: "[REDACTED_DATABASE_URL]",
    };
  }

  public static async configureDedicatedTenant(
    tenantId: string,
    data: {
      databaseUrlSecret: string;
      storageBucketName: string;
      kmsKeyId?: string;
      isolationMode?: IsolationMode;
      requestedRegion?: string;
      residencyPolicy?: string;
      providerType?: ProvisionerType;
    },
    userId?: string,
  ) {
    const encryptedDatabaseUrl = SecretService.encryptSecret(data.databaseUrlSecret);
    const providerType = data.providerType || "TEST_STUB";

    const [existing] = await db
      .select()
      .from(dedicatedTenantConfigs)
      .where(eq(dedicatedTenantConfigs.tenantId, tenantId));

    let resultConfig;

    if (existing) {
      const [updated] = await db
        .update(dedicatedTenantConfigs)
        .set({
          storageBucketName: data.storageBucketName,
          kmsKeyId: data.kmsKeyId,
          databaseUrlSecret: encryptedDatabaseUrl,
          isolationMode: data.isolationMode || existing.isolationMode,
          requestedRegion: data.requestedRegion || existing.requestedRegion,
          residencyPolicy: data.residencyPolicy || existing.residencyPolicy,
          providerType,
          // CRITICAL TRUTH RULE: Saving config metadata MUST NOT set isProvisioned = true
          isProvisioned: false,
          provisioningStatus: "CONFIGURATION_STORED",
          readinessStatus: "NOT_READY",
          updatedAt: new Date(),
        })
        .where(eq(dedicatedTenantConfigs.id, existing.id))
        .returning();
      resultConfig = updated;
    } else {
      const [inserted] = await db
        .insert(dedicatedTenantConfigs)
        .values({
          tenantId,
          storageBucketName: data.storageBucketName,
          kmsKeyId: data.kmsKeyId,
          databaseUrlSecret: encryptedDatabaseUrl,
          isolationMode: data.isolationMode || "SHARED_SCHEMA_RLS",
          requestedRegion: data.requestedRegion || "ap-southeast-1",
          residencyPolicy: data.residencyPolicy || "DEFAULT_DATA_RESIDENCY",
          providerType,
          isProvisioned: false,
          provisioningStatus: "CONFIGURATION_STORED",
          readinessStatus: "NOT_READY",
        })
        .returning();
      resultConfig = inserted;
    }

    // Audit logging
    await db.insert(infrastructureAuditEvents).values({
      tenantId,
      userId: userId || null,
      eventType: "INFRASTRUCTURE_CONFIG_STORED",
      provider: providerType,
      fromStatus: existing ? existing.provisioningStatus : "NONE",
      toStatus: "CONFIGURATION_STORED",
      metadata: {
        storageBucketName: data.storageBucketName,
        isolationMode: data.isolationMode || "SHARED_SCHEMA_RLS",
        requestedRegion: data.requestedRegion || "ap-southeast-1",
      },
    });

    return {
      ...resultConfig,
      databaseUrlSecret: "[REDACTED_DATABASE_URL]",
    };
  }

  public static async requestProvisioning(
    tenantId: string,
    params: {
      isolationMode: IsolationMode;
      requestedRegion: string;
      providerType?: ProvisionerType;
      idempotencyKey?: string;
    },
    userId?: string,
  ) {
    const [existing] = await db
      .select()
      .from(dedicatedTenantConfigs)
      .where(eq(dedicatedTenantConfigs.tenantId, tenantId));

    if (!existing) {
      throw new Error("NOT_FOUND: Dedicated tenant configuration must be stored before requesting provisioning.");
    }

    // Idempotency & Concurrency Guard
    if (params.idempotencyKey && existing.idempotencyKey === params.idempotencyKey) {
      const currentConfig = await this.getTenantConfig(tenantId);
      return {
        ...currentConfig,
        idempotencyMatched: true,
      };
    }

    if (existing.provisioningStatus === "PROVISIONING_IN_PROGRESS") {
      throw new Error("CONFLICT: Provisioning request already in progress for this tenant.");
    }

    const providerType = params.providerType || existing.providerType || "TEST_STUB";
    const provisioner = this.getProvisioner(providerType as ProvisionerType);

    // Transition to PROVISIONING_IN_PROGRESS
    await db
      .update(dedicatedTenantConfigs)
      .set({
        provisioningStatus: "PROVISIONING_IN_PROGRESS",
        idempotencyKey: params.idempotencyKey || null,
        updatedAt: new Date(),
      })
      .where(eq(dedicatedTenantConfigs.id, existing.id));

    // Audit event
    await db.insert(infrastructureAuditEvents).values({
      tenantId,
      userId: userId || null,
      eventType: "PROVISIONING_STARTED",
      provider: providerType,
      fromStatus: existing.provisioningStatus,
      toStatus: "PROVISIONING_IN_PROGRESS",
      metadata: {
        isolationMode: params.isolationMode,
        requestedRegion: params.requestedRegion,
      },
    });

    // Execute provisioner request
    const provisionResult = await provisioner.requestProvisioning({
      tenantId,
      isolationMode: params.isolationMode,
      requestedRegion: params.requestedRegion,
      databaseUrlSecret: existing.databaseUrlSecret,
      storageBucketName: existing.storageBucketName,
      kmsKeyId: existing.kmsKeyId || undefined,
      idempotencyKey: params.idempotencyKey,
    });

    const isSuccess = provisionResult.success && provisionResult.status === "PROVISIONED";
    const newStatus: ProvisioningLifecycleStatus = isSuccess ? "PROVISIONED" : (provisionResult.status || "PROVISIONING_FAILED");

    // Update config truths
    const [updated] = await db
      .update(dedicatedTenantConfigs)
      .set({
        isProvisioned: isSuccess,
        provisioningStatus: newStatus,
        isolationMode: params.isolationMode,
        isolationVerified: Boolean(provisionResult.isolationVerified),
        requestedRegion: params.requestedRegion,
        actualRegion: provisionResult.actualRegion || null,
        providerRegion: provisionResult.providerRegion || null,
        residencyVerified: Boolean(provisionResult.residencyVerified),
        actualSchemaVersion: provisionResult.actualSchemaVersion || null,
        migrationStatus: provisionResult.migrationStatus || "UNKNOWN",
        provisionedAt: isSuccess ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(dedicatedTenantConfigs.id, existing.id))
      .returning();

    // Log provisioning attempt details
    await db.insert(infrastructureProvisioningLogs).values({
      tenantId,
      configId: existing.id,
      action: "PROVISION_REQUEST",
      status: isSuccess ? "SUCCESS" : "FAILED",
      requestedBy: userId || null,
      isolationMode: params.isolationMode,
      requestedRegion: params.requestedRegion,
      details: {
        providerType,
        actualRegion: provisionResult.actualRegion,
        migrationStatus: provisionResult.migrationStatus,
      },
      failureReason: isSuccess ? null : provisionResult.errorDetails || "Provisioning failed.",
    });

    // Automatically trigger readiness evaluation
    await this.evaluateTenantReadiness(tenantId);

    return {
      ...updated,
      databaseUrlSecret: "[REDACTED_DATABASE_URL]",
      idempotencyMatched: false,
    };
  }

  public static async evaluateTenantReadiness(tenantId: string) {
    const [config] = await db
      .select()
      .from(dedicatedTenantConfigs)
      .where(eq(dedicatedTenantConfigs.tenantId, tenantId));

    if (!config) {
      return { readinessStatus: "NOT_READY", isReady: false, failureReasons: ["CONFIGURATION_MISSING"] };
    }

    const failureReasons: string[] = [];

    // Check 1: Provisioning status
    if (!config.isProvisioned || config.provisioningStatus !== "PROVISIONED") {
      failureReasons.push("INFRASTRUCTURE_NOT_PROVISIONED");
    }

    // Check 2: Isolation verification
    if (!config.isolationVerified) {
      failureReasons.push("ISOLATION_UNVERIFIED");
    }

    // Check 3: Schema version & migration status
    if (config.migrationStatus !== "SCHEMA_UP_TO_DATE" || config.actualSchemaVersion !== config.expectedSchemaVersion) {
      failureReasons.push("SCHEMA_MIGRATION_MISMATCH");
    }

    // Check 4: Data residency verification
    if (!config.residencyVerified) {
      failureReasons.push("DATA_RESIDENCY_UNVERIFIED");
    }

    // Check 5: Provider health check
    const provisioner = this.getProvisioner(config.providerType as ProvisionerType);
    const health = await provisioner.checkHealth({ tenantId, configId: config.id });
    if (!health.healthy) {
      failureReasons.push("PROVIDER_HEALTH_CHECK_FAILED");
    }

    // Check 6: Backup verification
    const backupStatus = await provisioner.checkBackupStatus({ tenantId, configId: config.id });
    if (!backupStatus.backupConfigured) {
      failureReasons.push("BACKUP_POLICY_UNVERIFIED");
    }

    const isReady = failureReasons.length === 0;
    const readinessStatus = isReady ? "READY" : "NOT_READY";

    const [updated] = await db
      .update(dedicatedTenantConfigs)
      .set({
        readinessStatus,
        readinessEvaluatedAt: new Date(),
        readinessFailureReasons: failureReasons,
        updatedAt: new Date(),
      })
      .where(eq(dedicatedTenantConfigs.id, config.id))
      .returning();

    return {
      readinessStatus,
      isReady,
      failureReasons,
      evaluatedAt: updated.readinessEvaluatedAt,
    };
  }

  // Release Readiness Check across platform modules
  public static async evaluateReleaseReadiness() {
    const signoffs = await db.select().from(saasReadinessSignoffs);

    const requiredModules = [
      "V5_CORE_SECURITY",
      "TENANT_ISOLATION",
      "COMPLIANCE",
      "PERFORMANCE",
      "DISASTER_RECOVERY",
    ];

    const approvedModules = new Set(
      signoffs
        .filter((so) => so.status === "APPROVED")
        .map((so) => so.moduleName),
    );

    const missingModules = requiredModules.filter((m) => !approvedModules.has(m));
    const isReady = missingModules.length === 0;

    return {
      isReady,
      status: isReady ? "READY" : "NOT_READY_PENDING_SIGNOFFS",
      approvedModules: Array.from(approvedModules),
      pendingModules: missingModules,
      allSignoffs: signoffs,
    };
  }

  // PLATFORM LEVEL: Final QA Sign-offs
  public static async getReadinessSignoffs() {
    return db.select().from(saasReadinessSignoffs);
  }

  public static async addSignoff(
    moduleName: string,
    status: string,
    userId: string,
    notes?: string,
  ) {
    const [signoff] = await db
      .insert(saasReadinessSignoffs)
      .values({
        moduleName,
        status,
        approvedBy: userId,
        notes,
        approvedAt: status === "APPROVED" ? new Date() : null,
      })
      .returning();
    return signoff;
  }
}
