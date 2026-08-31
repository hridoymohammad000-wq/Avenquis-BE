-- Phase 2: PostgreSQL Row-Level Security (RLS) & Helper Functions

CREATE SCHEMA IF NOT EXISTS app;

-- Helper function to retrieve active tenant ID from request context
CREATE OR REPLACE FUNCTION app.current_tenant_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to retrieve active membership ID from request context
CREATE OR REPLACE FUNCTION app.current_membership_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_membership_id', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable Row-Level Security on all tenant-owned tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_deployment_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_hash_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation RLS Policies
CREATE POLICY tenant_isolation_tenants ON tenants
  FOR ALL USING (id = app.current_tenant_id());

CREATE POLICY tenant_isolation_tenant_settings ON tenant_settings
  FOR ALL USING (tenant_id = app.current_tenant_id());

CREATE POLICY tenant_isolation_tenant_deployment_profiles ON tenant_deployment_profiles
  FOR ALL USING (tenant_id = app.current_tenant_id());

CREATE POLICY tenant_isolation_memberships ON memberships
  FOR ALL USING (tenant_id = app.current_tenant_id());

CREATE POLICY tenant_isolation_resource_access_grants ON resource_access_grants
  FOR ALL USING (tenant_id = app.current_tenant_id());

CREATE POLICY tenant_isolation_activity_events ON activity_events
  FOR ALL USING (tenant_id = app.current_tenant_id());

CREATE POLICY tenant_isolation_security_events ON security_events
  FOR ALL USING (tenant_id = app.current_tenant_id() OR tenant_id IS NULL);

CREATE POLICY tenant_isolation_event_hash_checkpoints ON event_hash_checkpoints
  FOR ALL USING (tenant_id = app.current_tenant_id());
