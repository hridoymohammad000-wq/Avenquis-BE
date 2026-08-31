-- Enable Row Level Security (RLS) on Phase 31 Automation tables
ALTER TABLE "webhook_endpoints" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhook_endpoints" FORCE ROW LEVEL SECURITY;

ALTER TABLE "workflow_automation_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_automation_rules" FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "webhook_endpoints_tenant_isolation_policy" ON "webhook_endpoints"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "workflow_rules_tenant_isolation_policy" ON "workflow_automation_rules"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
