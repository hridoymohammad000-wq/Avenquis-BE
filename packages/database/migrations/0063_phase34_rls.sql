-- Enable Row Level Security (RLS) on Phase 34 Regional tables
-- global_countries is global, readable by all.

ALTER TABLE "tenant_regional_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_regional_settings" FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "tenant_regional_settings_isolation_policy" ON "tenant_regional_settings"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
