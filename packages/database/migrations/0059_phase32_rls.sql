-- Enable Row Level Security (RLS) on Phase 32 Enterprise tables
ALTER TABLE "firm_branches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "firm_branches" FORCE ROW LEVEL SECURITY;

ALTER TABLE "staff_branch_allocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_branch_allocations" FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "firm_branches_tenant_isolation_policy" ON "firm_branches"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "staff_branch_allocations_tenant_isolation_policy" ON "staff_branch_allocations"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
