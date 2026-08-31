-- Enable Row Level Security (RLS) on Phase 33 Internationalization tables
-- supported_locales is global, no RLS needed or maybe RLS but readable by all

ALTER TABLE "tenant_locales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_locales" FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "tenant_locales_isolation_policy" ON "tenant_locales"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
