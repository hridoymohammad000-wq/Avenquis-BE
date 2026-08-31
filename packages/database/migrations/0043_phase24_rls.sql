-- Enable Row Level Security (RLS) on Phase 24 regulatory_filings
ALTER TABLE "regulatory_filings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "regulatory_filings" FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "regulatory_filings_tenant_isolation_policy" ON "regulatory_filings"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
