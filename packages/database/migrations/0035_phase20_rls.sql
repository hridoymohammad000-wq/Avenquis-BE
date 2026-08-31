-- Enable Row Level Security (RLS) on Phase 20 audit_files table
ALTER TABLE "audit_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_files" FORCE ROW LEVEL SECURITY;

-- RLS Policies for audit_files
CREATE POLICY "audit_files_tenant_isolation_policy" ON "audit_files"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
