-- Enable Row Level Security (RLS) on Phase 37 Integration tables
-- global_integrations is global, readable by all.

ALTER TABLE "tenant_integrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_integrations" FORCE ROW LEVEL SECURITY;

-- Note: integration_sync_logs doesn't have a direct tenant_id column, 
-- but it references tenant_integrations. We can enforce RLS using a join or just trust the backend.
-- For strictness, we use a subquery on tenant_integrations.
ALTER TABLE "integration_sync_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "integration_sync_logs" FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "tenant_integrations_isolation_policy" ON "tenant_integrations"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "integration_sync_logs_isolation_policy" ON "integration_sync_logs"
    FOR ALL
    USING (
        tenant_integration_id IN (
            SELECT id FROM "tenant_integrations" WHERE tenant_id = app.current_tenant_id()
        )
    )
    WITH CHECK (
        tenant_integration_id IN (
            SELECT id FROM "tenant_integrations" WHERE tenant_id = app.current_tenant_id()
        )
    );
