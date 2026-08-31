-- Enable Row Level Security (RLS) on Phase 35 Regulatory Packs tables
-- global_regulatory_bodies and regulatory_rule_packs are global, readable by all.

ALTER TABLE "tenant_regulatory_packs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_regulatory_packs" FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "tenant_regulatory_packs_isolation_policy" ON "tenant_regulatory_packs"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
