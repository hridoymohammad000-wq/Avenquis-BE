-- Enable Row Level Security (RLS) on Phase 18 Exceptions & Review tables
ALTER TABLE "audit_exceptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_reviews" ENABLE ROW LEVEL SECURITY;

-- Force Row Level Security for table owners
ALTER TABLE "audit_exceptions" FORCE ROW LEVEL SECURITY;
ALTER TABLE "audit_reviews" FORCE ROW LEVEL SECURITY;

-- RLS Policies for audit_exceptions
CREATE POLICY "audit_exceptions_tenant_isolation_policy" ON "audit_exceptions"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for audit_reviews
CREATE POLICY "audit_reviews_tenant_isolation_policy" ON "audit_reviews"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
