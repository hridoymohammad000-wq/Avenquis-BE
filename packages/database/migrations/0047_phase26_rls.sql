-- Enable Row Level Security (RLS) on Phase 26 compliance_templates & regulatory_calendar_events
ALTER TABLE "compliance_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compliance_templates" FORCE ROW LEVEL SECURITY;

ALTER TABLE "regulatory_calendar_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "regulatory_calendar_events" FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "compliance_templates_tenant_isolation_policy" ON "compliance_templates"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "regulatory_calendar_events_tenant_isolation_policy" ON "regulatory_calendar_events"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
