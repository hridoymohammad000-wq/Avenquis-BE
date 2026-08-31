-- Enable Row Level Security (RLS) on Phase 6 Client CRM tables
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_kyc_documents" ENABLE ROW LEVEL SECURITY;

-- Force Row Level Security for table owners
ALTER TABLE "clients" FORCE ROW LEVEL SECURITY;
ALTER TABLE "client_contacts" FORCE ROW LEVEL SECURITY;
ALTER TABLE "client_kyc_documents" FORCE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "clients_tenant_isolation_policy" ON "clients"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for client_contacts
CREATE POLICY "client_contacts_tenant_isolation_policy" ON "client_contacts"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for client_kyc_documents
CREATE POLICY "client_kyc_documents_tenant_isolation_policy" ON "client_kyc_documents"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
