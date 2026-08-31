-- Enable Row Level Security (RLS) on Phase 22 icab_forms & icab_exam_registrations
ALTER TABLE "icab_forms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "icab_forms" FORCE ROW LEVEL SECURITY;

ALTER TABLE "icab_exam_registrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "icab_exam_registrations" FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "icab_forms_tenant_isolation_policy" ON "icab_forms"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "icab_exam_registrations_tenant_isolation_policy" ON "icab_exam_registrations"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
