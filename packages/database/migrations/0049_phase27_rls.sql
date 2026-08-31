-- Enable Row Level Security (RLS) on Phase 27 AI Intelligence tables
ALTER TABLE "ai_document_analyses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_document_analyses" FORCE ROW LEVEL SECURITY;

ALTER TABLE "ai_engagement_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_engagement_reviews" FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "ai_document_analyses_tenant_isolation_policy" ON "ai_document_analyses"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "ai_engagement_reviews_tenant_isolation_policy" ON "ai_engagement_reviews"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
