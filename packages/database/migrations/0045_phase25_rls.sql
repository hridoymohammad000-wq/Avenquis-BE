-- Enable Row Level Security (RLS) on Phase 25 tax_vat_workflows
ALTER TABLE "tax_vat_workflows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tax_vat_workflows" FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "tax_vat_workflows_tenant_isolation_policy" ON "tax_vat_workflows"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
