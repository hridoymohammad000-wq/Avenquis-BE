-- Enable Row Level Security (RLS) on Phase 23 dvs_records
ALTER TABLE "dvs_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dvs_records" FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "dvs_records_tenant_isolation_policy" ON "dvs_records"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
