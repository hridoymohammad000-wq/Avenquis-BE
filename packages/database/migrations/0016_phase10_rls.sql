-- Enable Row Level Security (RLS) on Phase 10 Sign-off & Digital Certificate tables
ALTER TABLE "digital_certificates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "signoff_audit_logs" ENABLE ROW LEVEL SECURITY;

-- Force Row Level Security for table owners
ALTER TABLE "digital_certificates" FORCE ROW LEVEL SECURITY;
ALTER TABLE "signoff_audit_logs" FORCE ROW LEVEL SECURITY;

-- RLS Policies for digital_certificates
CREATE POLICY "digital_certificates_tenant_isolation_policy" ON "digital_certificates"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for signoff_audit_logs
CREATE POLICY "signoff_audit_logs_tenant_isolation_policy" ON "signoff_audit_logs"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
