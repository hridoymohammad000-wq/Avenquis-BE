-- Forward-safe migration for Phase 36 (Enterprise Identity) & Phase 37 (Integrations) Remediation

ALTER TABLE "tenant_sso_providers" ADD COLUMN IF NOT EXISTS "client_secret_encrypted" text;
ALTER TABLE "tenant_sso_providers" ADD COLUMN IF NOT EXISTS "oidc_discovery_url" varchar(1024);
ALTER TABLE "tenant_sso_providers" ADD COLUMN IF NOT EXISTS "domain" varchar(255);
ALTER TABLE "tenant_sso_providers" ADD COLUMN IF NOT EXISTS "status" varchar(50) NOT NULL DEFAULT 'NOT_CONFIGURED';
ALTER TABLE "tenant_sso_providers" ADD COLUMN IF NOT EXISTS "jit_enabled" boolean NOT NULL DEFAULT false;
ALTER TABLE "tenant_sso_providers" ADD COLUMN IF NOT EXISTS "jit_default_role" varchar(100) NOT NULL DEFAULT 'audit:read';
ALTER TABLE "tenant_sso_providers" ADD COLUMN IF NOT EXISTS "allowed_domains" jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS "tenant_sso_domain_idx" ON "tenant_sso_providers" ("domain");

CREATE TABLE IF NOT EXISTS "sso_security_states" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "state" varchar(255) NOT NULL UNIQUE,
  "nonce" varchar(255),
  "code_verifier" varchar(255),
  "provider_type" varchar(50) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "sso_state_tenant_idx" ON "sso_security_states" ("tenant_id");
CREATE INDEX IF NOT EXISTS "sso_state_idx" ON "sso_security_states" ("state");

CREATE TABLE IF NOT EXISTS "saml_replay_audit" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "assertion_id" varchar(255) NOT NULL UNIQUE,
  "issuer" varchar(255) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "saml_replay_tenant_idx" ON "saml_replay_audit" ("tenant_id");
CREATE INDEX IF NOT EXISTS "saml_replay_assertion_idx" ON "saml_replay_audit" ("assertion_id");

ALTER TABLE "tenant_integrations" ADD COLUMN IF NOT EXISTS "token_expires_at" timestamp with time zone;
ALTER TABLE "tenant_integrations" ADD COLUMN IF NOT EXISTS "last_sync_status" varchar(50);
ALTER TABLE "tenant_integrations" ADD COLUMN IF NOT EXISTS "last_sync_error" text;
ALTER TABLE "tenant_integrations" ADD COLUMN IF NOT EXISTS "sync_cursor" text;

ALTER TABLE "integration_sync_logs" ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "integration_sync_logs" ADD COLUMN IF NOT EXISTS "checkpoint" text;
ALTER TABLE "integration_sync_logs" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(255);
ALTER TABLE "integration_sync_logs" ADD COLUMN IF NOT EXISTS "rate_limited" boolean NOT NULL DEFAULT false;
