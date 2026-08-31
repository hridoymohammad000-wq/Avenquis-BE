-- Enable Row Level Security (RLS) on Phase 9 Tasks, Timesheets & Billing tables
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "timesheet_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;

-- Force Row Level Security for table owners
ALTER TABLE "tasks" FORCE ROW LEVEL SECURITY;
ALTER TABLE "timesheet_entries" FORCE ROW LEVEL SECURITY;
ALTER TABLE "invoices" FORCE ROW LEVEL SECURITY;
ALTER TABLE "payments" FORCE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "tasks_tenant_isolation_policy" ON "tasks"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for timesheet_entries
CREATE POLICY "timesheet_entries_tenant_isolation_policy" ON "timesheet_entries"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for invoices
CREATE POLICY "invoices_tenant_isolation_policy" ON "invoices"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for payments
CREATE POLICY "payments_tenant_isolation_policy" ON "payments"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
