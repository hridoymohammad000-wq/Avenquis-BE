-- Enable Row Level Security (RLS) on Phase 15 Materiality & Risk Assessment tables
ALTER TABLE "materiality_assessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "risk_assessments" ENABLE ROW LEVEL SECURITY;

-- Force Row Level Security for table owners
ALTER TABLE "materiality_assessments" FORCE ROW LEVEL SECURITY;
ALTER TABLE "risk_assessments" FORCE ROW LEVEL SECURITY;

-- RLS Policies for materiality_assessments
CREATE POLICY "materiality_assessments_tenant_isolation_policy" ON "materiality_assessments"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for risk_assessments
CREATE POLICY "risk_assessments_tenant_isolation_policy" ON "risk_assessments"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
