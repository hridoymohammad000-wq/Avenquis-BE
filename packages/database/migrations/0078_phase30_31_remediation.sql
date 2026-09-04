-- Forward-safe migration for Phase 30 (Client Portal) & Phase 31 (Automation) Remediation

ALTER TABLE "client_portal_users" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp with time zone;

CREATE TABLE IF NOT EXISTS "client_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "client_id" uuid NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "email" varchar(255) NOT NULL,
  "token_hash" varchar(255) NOT NULL UNIQUE,
  "status" varchar(50) NOT NULL DEFAULT 'INVITED',
  "invited_by_membership_id" uuid REFERENCES "memberships"("id") ON DELETE SET NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "activated_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "client_invite_tenant_client_idx" ON "client_invitations" ("tenant_id", "client_id");
CREATE INDEX IF NOT EXISTS "client_invite_email_idx" ON "client_invitations" ("email");

ALTER TABLE "secure_document_exchanges" ADD COLUMN IF NOT EXISTS "storage_provider" varchar(50) NOT NULL DEFAULT 's3';
ALTER TABLE "secure_document_exchanges" ADD COLUMN IF NOT EXISTS "file_size" integer;
ALTER TABLE "secure_document_exchanges" ADD COLUMN IF NOT EXISTS "mime_type" varchar(100);
ALTER TABLE "secure_document_exchanges" ADD COLUMN IF NOT EXISTS "extension" varchar(20);
ALTER TABLE "secure_document_exchanges" ADD COLUMN IF NOT EXISTS "scan_status" varchar(50) NOT NULL DEFAULT 'CLEAN';

CREATE TABLE IF NOT EXISTS "portal_access_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "client_id" uuid REFERENCES "clients"("id") ON DELETE CASCADE,
  "client_user_id" uuid REFERENCES "client_portal_users"("id") ON DELETE SET NULL,
  "membership_id" uuid REFERENCES "memberships"("id") ON DELETE SET NULL,
  "document_id" uuid REFERENCES "secure_document_exchanges"("id") ON DELETE SET NULL,
  "action" varchar(50) NOT NULL,
  "ip_address" varchar(45),
  "user_agent" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "portal_log_tenant_client_idx" ON "portal_access_logs" ("tenant_id", "client_id");
CREATE INDEX IF NOT EXISTS "portal_log_action_idx" ON "portal_access_logs" ("action");

ALTER TABLE "webhook_endpoints" ADD COLUMN IF NOT EXISTS "failure_count" integer NOT NULL DEFAULT 0;
ALTER TABLE "webhook_endpoints" ADD COLUMN IF NOT EXISTS "last_failure_at" timestamp with time zone;
ALTER TABLE "webhook_endpoints" ADD COLUMN IF NOT EXISTS "disabled_at" timestamp with time zone;

CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "webhook_endpoint_id" uuid NOT NULL REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE,
  "event_type" varchar(100) NOT NULL,
  "payload" jsonb NOT NULL,
  "signature" varchar(255),
  "response_status_code" integer,
  "response_body" text,
  "duration_ms" integer,
  "attempt_count" integer NOT NULL DEFAULT 1,
  "status" varchar(50) NOT NULL DEFAULT 'DELIVERED',
  "next_retry_at" timestamp with time zone,
  "error_details" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "webhook_deliv_tenant_endpoint_idx" ON "webhook_deliveries" ("tenant_id", "webhook_endpoint_id");

ALTER TABLE "workflow_automation_rules" ADD COLUMN IF NOT EXISTS "execution_count" integer NOT NULL DEFAULT 0;
ALTER TABLE "workflow_automation_rules" ADD COLUMN IF NOT EXISTS "last_triggered_at" timestamp with time zone;

CREATE TABLE IF NOT EXISTS "automation_executions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "rule_id" uuid REFERENCES "workflow_automation_rules"("id") ON DELETE CASCADE,
  "trigger_event" varchar(100) NOT NULL,
  "event_payload" jsonb,
  "condition_matched" boolean NOT NULL DEFAULT true,
  "action_status" varchar(50) NOT NULL DEFAULT 'SUCCESS',
  "result_payload" jsonb,
  "error_details" text,
  "executed_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "auto_exec_tenant_rule_idx" ON "automation_executions" ("tenant_id", "rule_id");

CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "key_hash" varchar(255) NOT NULL UNIQUE,
  "key_prefix" varchar(20) NOT NULL,
  "scopes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "status" varchar(50) NOT NULL DEFAULT 'active',
  "expires_at" timestamp with time zone,
  "last_used_at" timestamp with time zone,
  "created_by_membership_id" uuid REFERENCES "memberships"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "api_key_tenant_idx" ON "api_keys" ("tenant_id");
CREATE INDEX IF NOT EXISTS "api_key_hash_idx" ON "api_keys" ("key_hash");
ALTER TABLE "webhook_deliveries" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(100);
ALTER TABLE "automation_executions" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(100);
