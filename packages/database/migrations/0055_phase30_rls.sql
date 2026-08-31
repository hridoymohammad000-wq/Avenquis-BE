-- Enable Row Level Security (RLS) on Phase 30 Client Portal tables
ALTER TABLE "client_portal_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_portal_users" FORCE ROW LEVEL SECURITY;

ALTER TABLE "secure_document_exchanges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "secure_document_exchanges" FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "client_portal_users_tenant_isolation_policy" ON "client_portal_users"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "secure_doc_tenant_isolation_policy" ON "secure_document_exchanges"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
