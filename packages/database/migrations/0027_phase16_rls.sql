-- Enable Row Level Security (RLS) on Phase 16 Audit Programs & Procedures tables
ALTER TABLE "audit_programs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_procedures" ENABLE ROW LEVEL SECURITY;

-- Force Row Level Security for table owners
ALTER TABLE "audit_programs" FORCE ROW LEVEL SECURITY;
ALTER TABLE "audit_procedures" FORCE ROW LEVEL SECURITY;

-- RLS Policies for audit_programs
CREATE POLICY "audit_programs_tenant_isolation_policy" ON "audit_programs"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for audit_procedures
CREATE POLICY "audit_procedures_tenant_isolation_policy" ON "audit_procedures"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
