-- Enable Row Level Security (RLS) on Phase 38 SaaS Readiness tables

ALTER TABLE "dedicated_tenant_configs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dedicated_tenant_configs" FORCE ROW LEVEL SECURITY;

-- saas_readiness_signoffs is a system-wide platform admin table, no tenant_id, so no RLS needed.

-- RLS Policies
CREATE POLICY "dedicated_tenant_configs_isolation_policy" ON "dedicated_tenant_configs"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
