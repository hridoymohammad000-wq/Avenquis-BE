-- Enable Row Level Security (RLS) on Phase 36 Enterprise Security tables

ALTER TABLE "tenant_sso_providers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_sso_providers" FORCE ROW LEVEL SECURITY;

ALTER TABLE "enterprise_audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enterprise_audit_logs" FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "tenant_sso_providers_isolation_policy" ON "tenant_sso_providers"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "enterprise_audit_logs_isolation_policy" ON "enterprise_audit_logs"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
