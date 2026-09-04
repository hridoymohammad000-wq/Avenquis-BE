-- Batch 1 security remediation: user-scoped bootstrap and durable refresh sessions.
CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_id', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

ALTER POLICY tenant_isolation_tenants ON tenants
  USING (id = app.current_tenant_id()
    OR id IN (SELECT tenant_id FROM memberships WHERE user_id = app.current_user_id()))
  WITH CHECK (id = app.current_tenant_id() OR app.current_user_id() IS NOT NULL);

ALTER POLICY tenant_isolation_memberships ON memberships
  USING (tenant_id = app.current_tenant_id() OR user_id = app.current_user_id());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'roles'
      AND policyname = 'tenant_isolation_roles'
  ) THEN
    CREATE POLICY tenant_isolation_roles ON roles
      FOR ALL
      USING (tenant_id = app.current_tenant_id()
        OR tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = app.current_user_id()))
      WITH CHECK (tenant_id = app.current_tenant_id());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS refresh_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  replaced_by_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refresh_sessions_user_id_idx ON refresh_sessions(user_id);
CREATE INDEX IF NOT EXISTS refresh_sessions_expires_at_idx ON refresh_sessions(expires_at);
