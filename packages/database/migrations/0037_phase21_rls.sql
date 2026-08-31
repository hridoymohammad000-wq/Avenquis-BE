-- Enable Row Level Security (RLS) on Phase 21 audit_quality_controls table
ALTER TABLE "audit_quality_controls" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_quality_controls" FORCE ROW LEVEL SECURITY;

-- RLS Policies for audit_quality_controls
CREATE POLICY "audit_quality_controls_tenant_isolation_policy" ON "audit_quality_controls"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
