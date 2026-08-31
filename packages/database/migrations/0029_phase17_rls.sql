-- Enable Row Level Security (RLS) on Phase 17 Sampling & Evidence tables
ALTER TABLE "audit_samples" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_evidence" ENABLE ROW LEVEL SECURITY;

-- Force Row Level Security for table owners
ALTER TABLE "audit_samples" FORCE ROW LEVEL SECURITY;
ALTER TABLE "audit_evidence" FORCE ROW LEVEL SECURITY;

-- RLS Policies for audit_samples
CREATE POLICY "audit_samples_tenant_isolation_policy" ON "audit_samples"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for audit_evidence
CREATE POLICY "audit_evidence_tenant_isolation_policy" ON "audit_evidence"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
