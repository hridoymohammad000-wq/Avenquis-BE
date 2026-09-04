-- Fix RLS bootstrap access for memberships
CREATE POLICY user_bootstrap_memberships ON memberships FOR SELECT USING (user_id = app.current_user_id());
CREATE POLICY user_bootstrap_tenants ON tenants FOR SELECT USING (id IN (SELECT tenant_id FROM memberships WHERE user_id = app.current_user_id()));
