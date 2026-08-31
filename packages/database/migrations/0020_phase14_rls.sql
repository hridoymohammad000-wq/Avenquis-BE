-- Enable Row Level Security (RLS) on Phase 14 Trial Balance tables
ALTER TABLE "trial_balances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tb_line_items" ENABLE ROW LEVEL SECURITY;

-- Force Row Level Security for table owners
ALTER TABLE "trial_balances" FORCE ROW LEVEL SECURITY;
ALTER TABLE "tb_line_items" FORCE ROW LEVEL SECURITY;

-- RLS Policies for trial_balances
CREATE POLICY "trial_balances_tenant_isolation_policy" ON "trial_balances"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for tb_line_items
CREATE POLICY "tb_line_items_tenant_isolation_policy" ON "tb_line_items"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
