-- Enable Row Level Security (RLS) on Phase 7 Engagement tables
ALTER TABLE "engagements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "engagement_team_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "engagement_independence_declarations" ENABLE ROW LEVEL SECURITY;

-- Force Row Level Security for table owners
ALTER TABLE "engagements" FORCE ROW LEVEL SECURITY;
ALTER TABLE "engagement_team_members" FORCE ROW LEVEL SECURITY;
ALTER TABLE "engagement_independence_declarations" FORCE ROW LEVEL SECURITY;

-- RLS Policies for engagements
CREATE POLICY "engagements_tenant_isolation_policy" ON "engagements"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for engagement_team_members
CREATE POLICY "engagement_team_members_tenant_isolation_policy" ON "engagement_team_members"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for engagement_independence_declarations
CREATE POLICY "engagement_independence_declarations_tenant_isolation_policy" ON "engagement_independence_declarations"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
