-- Enable Row Level Security (RLS) on Phase 8 Working Papers tables
ALTER TABLE "working_papers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "review_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_document_requests" ENABLE ROW LEVEL SECURITY;

-- Force Row Level Security for table owners
ALTER TABLE "working_papers" FORCE ROW LEVEL SECURITY;
ALTER TABLE "review_notes" FORCE ROW LEVEL SECURITY;
ALTER TABLE "client_document_requests" FORCE ROW LEVEL SECURITY;

-- RLS Policies for working_papers
CREATE POLICY "working_papers_tenant_isolation_policy" ON "working_papers"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for review_notes
CREATE POLICY "review_notes_tenant_isolation_policy" ON "review_notes"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for client_document_requests
CREATE POLICY "client_document_requests_tenant_isolation_policy" ON "client_document_requests"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
