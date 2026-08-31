-- Enable Row Level Security (RLS) on Phase 28 Advanced Analytics tables
ALTER TABLE "resource_allocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resource_allocations" FORCE ROW LEVEL SECURITY;

ALTER TABLE "engagement_profitability_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "engagement_profitability_metrics" FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "resource_allocations_tenant_isolation_policy" ON "resource_allocations"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "engagement_profitability_tenant_isolation_policy" ON "engagement_profitability_metrics"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
