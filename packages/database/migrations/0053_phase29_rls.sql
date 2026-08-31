-- Enable Row Level Security (RLS) on Phase 29 Advanced HR & Finance tables
ALTER TABLE "hr_payroll_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr_payroll_records" FORCE ROW LEVEL SECURITY;

ALTER TABLE "finance_expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "finance_expenses" FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "hr_payroll_records_tenant_isolation_policy" ON "hr_payroll_records"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "finance_expenses_tenant_isolation_policy" ON "finance_expenses"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
