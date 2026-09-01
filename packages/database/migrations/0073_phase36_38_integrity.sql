-- Enforce one active configuration/connection per tenant at the database boundary.
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_sso_provider_tenant_unique_idx"
  ON "tenant_sso_providers" ("tenant_id");

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_integration_unique_idx"
  ON "tenant_integrations" ("tenant_id", "integration_id");

CREATE UNIQUE INDEX IF NOT EXISTS "dedicated_tenant_config_tenant_unique_idx"
  ON "dedicated_tenant_configs" ("tenant_id");
