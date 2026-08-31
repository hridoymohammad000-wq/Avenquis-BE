-- Phase 4: Enable RLS on People & Staff Management Tables

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_lifecycle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_departments ON departments
  FOR ALL USING (tenant_id = app.current_tenant_id());

CREATE POLICY tenant_isolation_designations ON designations
  FOR ALL USING (tenant_id = app.current_tenant_id());

CREATE POLICY tenant_isolation_staff_profiles ON staff_profiles
  FOR ALL USING (tenant_id = app.current_tenant_id());

CREATE POLICY tenant_isolation_staff_lifecycle_events ON staff_lifecycle_events
  FOR ALL USING (tenant_id = app.current_tenant_id());
