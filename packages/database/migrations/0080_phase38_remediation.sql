-- Migration 0080_phase38_remediation.sql
-- Extend dedicated_tenant_configs and create infrastructure_provisioning_logs & infrastructure_audit_events

ALTER TABLE "dedicated_tenant_configs" 
  ADD COLUMN IF NOT EXISTS "provisioning_status" varchar(50) NOT NULL DEFAULT 'CONFIGURATION_STORED',
  ADD COLUMN IF NOT EXISTS "isolation_mode" varchar(50) NOT NULL DEFAULT 'SHARED_SCHEMA_RLS',
  ADD COLUMN IF NOT EXISTS "isolation_verified" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "requested_region" varchar(100) NOT NULL DEFAULT 'ap-southeast-1',
  ADD COLUMN IF NOT EXISTS "actual_region" varchar(100),
  ADD COLUMN IF NOT EXISTS "provider_region" varchar(100),
  ADD COLUMN IF NOT EXISTS "residency_policy" varchar(100) NOT NULL DEFAULT 'DEFAULT_DATA_RESIDENCY',
  ADD COLUMN IF NOT EXISTS "residency_verified" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "expected_schema_version" varchar(50) DEFAULT '0080',
  ADD COLUMN IF NOT EXISTS "actual_schema_version" varchar(50),
  ADD COLUMN IF NOT EXISTS "migration_status" varchar(50) NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS "backup_policy" varchar(50) NOT NULL DEFAULT 'DAILY_AUTOMATED',
  ADD COLUMN IF NOT EXISTS "last_backup_evidence" jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "restore_readiness" varchar(50) NOT NULL DEFAULT 'UNTESTED',
  ADD COLUMN IF NOT EXISTS "dr_status" varchar(50) NOT NULL DEFAULT 'UNCONFIGURED',
  ADD COLUMN IF NOT EXISTS "target_rpo_minutes" integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS "target_rto_minutes" integer DEFAULT 240,
  ADD COLUMN IF NOT EXISTS "readiness_status" varchar(50) NOT NULL DEFAULT 'NOT_READY',
  ADD COLUMN IF NOT EXISTS "readiness_evaluated_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "readiness_failure_reasons" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "provider_type" varchar(50) NOT NULL DEFAULT 'TEST_STUB',
  ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(255),
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS "dedicated_tenant_config_idx" ON "dedicated_tenant_configs" ("tenant_id");

CREATE TABLE IF NOT EXISTS "infrastructure_provisioning_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "config_id" uuid REFERENCES "dedicated_tenant_configs"("id") ON DELETE SET NULL,
  "action" varchar(100) NOT NULL,
  "status" varchar(50) NOT NULL,
  "requested_by" uuid REFERENCES "user_profiles"("id"),
  "approved_by" uuid REFERENCES "user_profiles"("id"),
  "isolation_mode" varchar(50),
  "requested_region" varchar(100),
  "details" jsonb DEFAULT '{}'::jsonb,
  "failure_reason" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "infra_log_tenant_idx" ON "infrastructure_provisioning_logs" ("tenant_id");

CREATE TABLE IF NOT EXISTS "infrastructure_audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "user_id" uuid REFERENCES "user_profiles"("id"),
  "event_type" varchar(100) NOT NULL,
  "provider" varchar(50),
  "from_status" varchar(50),
  "to_status" varchar(50),
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "infra_audit_tenant_idx" ON "infrastructure_audit_events" ("tenant_id");
