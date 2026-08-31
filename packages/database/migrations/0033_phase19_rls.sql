-- Enable Row Level Security (RLS) on Phase 19 Completion & Reporting tables
ALTER TABLE "audit_completion_checklists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_reports" ENABLE ROW LEVEL SECURITY;

-- Force Row Level Security for table owners
ALTER TABLE "audit_completion_checklists" FORCE ROW LEVEL SECURITY;
ALTER TABLE "audit_reports" FORCE ROW LEVEL SECURITY;

-- RLS Policies for audit_completion_checklists
CREATE POLICY "audit_completion_checklists_tenant_isolation_policy" ON "audit_completion_checklists"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for audit_reports
CREATE POLICY "audit_reports_tenant_isolation_policy" ON "audit_reports"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
