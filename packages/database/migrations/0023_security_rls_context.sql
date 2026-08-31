-- Security remediation: force RLS on every tenant-owned table.
-- Context is set by withTenantContext() transaction-locally.
DO $$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT table_schema, table_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'tenant_id'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', item.table_schema, item.table_name);
    EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', item.table_schema, item.table_name);
  END LOOP;

  FOR item IN
    SELECT DISTINCT p.schemaname, p.tablename, p.policyname
    FROM pg_policies p
    JOIN information_schema.columns c
      ON c.table_schema = p.schemaname
     AND c.table_name = p.tablename
     AND c.column_name = 'tenant_id'
    WHERE p.schemaname = 'public' AND p.cmd <> 'r'
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON %I.%I WITH CHECK (tenant_id = app.current_tenant_id())',
      item.policyname, item.schemaname, item.tablename
    );
  END LOOP;
END $$;
