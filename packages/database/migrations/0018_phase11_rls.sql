-- Enable Row Level Security (RLS) on Phase 11 Notification & Activity tables
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_feed_events" ENABLE ROW LEVEL SECURITY;

-- Force Row Level Security for table owners
ALTER TABLE "notifications" FORCE ROW LEVEL SECURITY;
ALTER TABLE "activity_feed_events" FORCE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "notifications_tenant_isolation_policy" ON "notifications"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());

-- RLS Policies for activity_feed_events
CREATE POLICY "activity_feed_events_tenant_isolation_policy" ON "activity_feed_events"
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
