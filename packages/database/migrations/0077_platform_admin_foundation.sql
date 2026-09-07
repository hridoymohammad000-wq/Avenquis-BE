-- Admin Console Phase 1: platform-scoped roles and commercial foundation.
-- Platform tables are deliberately separate from firm memberships and firm invoices.

CREATE TABLE IF NOT EXISTS platform_user_roles (
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role varchar(50) NOT NULL,
  granted_by_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role),
  CONSTRAINT platform_user_roles_role_check CHECK (role IN (
    'PLATFORM_SUPER_ADMIN', 'PLATFORM_ADMIN', 'SALES', 'MARKETING',
    'SUPPORT', 'FINANCE', 'OPS'
  ))
);

CREATE INDEX IF NOT EXISTS platform_user_roles_role_idx ON platform_user_roles(role);

CREATE TABLE IF NOT EXISTS platform_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(80) NOT NULL UNIQUE,
  display_name varchar(255) NOT NULL,
  proprietor_seats integer NOT NULL DEFAULT 0 CHECK (proprietor_seats >= 0),
  partner_seats integer NOT NULL DEFAULT 0 CHECK (partner_seats >= 0),
  student_seats integer NOT NULL DEFAULT 0 CHECK (student_seats >= 0),
  seat_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO platform_plans (code, display_name, proprietor_seats, partner_seats, student_seats, seat_rules)
VALUES
  ('SINGLE_ARTICLE_STUDENT', 'Single Article Student', 0, 0, 1, '{"student":1}'::jsonb),
  ('INDIVIDUAL_PROPRIETOR', 'Individual Proprietor / Firm Owner', 1, 0, 0, '{"proprietor":1}'::jsonb),
  ('PROPRIETOR_5_STUDENTS', 'Proprietor Firm with 5 Student Login', 1, 0, 5, '{"proprietor":1,"student":5}'::jsonb),
  ('PARTNERSHIP_FIRM', 'Partnership Firm', 0, 4, 10, '{"partner":4,"student":10}'::jsonb)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS platform_firm_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  legal_name varchar(255) NOT NULL,
  display_name varchar(255) NOT NULL,
  workspace_subdomain varchar(63) NOT NULL UNIQUE,
  owner_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES platform_plans(id) ON DELETE RESTRICT,
  seat_limit integer NOT NULL DEFAULT 0 CHECK (seat_limit >= 0),
  onboarding_state varchar(50) NOT NULL DEFAULT 'pending_approval',
  provisioning_state varchar(50) NOT NULL DEFAULT 'not_started',
  activation_state varchar(50) NOT NULL DEFAULT 'inactive',
  billing_state varchar(50) NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_firm_subdomain_format CHECK (workspace_subdomain ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$'),
  CONSTRAINT platform_firm_subdomain_reserved CHECK (workspace_subdomain NOT IN ('www','admin','api','app','support','status','docs','mail','demo'))
);

CREATE INDEX IF NOT EXISTS platform_firm_onboarding_owner_idx ON platform_firm_onboarding(owner_user_id);
CREATE INDEX IF NOT EXISTS platform_firm_onboarding_state_idx ON platform_firm_onboarding(onboarding_state, provisioning_state);

CREATE TABLE IF NOT EXISTS platform_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  contact_name varchar(255) NOT NULL,
  company_name varchar(255),
  phone varchar(50),
  source varchar(80),
  status varchar(50) NOT NULL DEFAULT 'new',
  assigned_to_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES platform_leads(id) ON DELETE SET NULL,
  email varchar(255) NOT NULL,
  contact_name varchar(255) NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  status varchar(50) NOT NULL DEFAULT 'requested',
  source varchar(80),
  assigned_to_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES platform_leads(id) ON DELETE SET NULL,
  email varchar(255) NOT NULL,
  requested_firm_name varchar(255) NOT NULL,
  requested_plan_code varchar(80),
  status varchar(50) NOT NULL DEFAULT 'pending',
  source varchar(80),
  reviewed_by_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES platform_plans(id) ON DELETE RESTRICT,
  status varchar(50) NOT NULL DEFAULT 'pending',
  seat_count integer NOT NULL DEFAULT 0 CHECK (seat_count >= 0),
  provider varchar(50) NOT NULL DEFAULT 'pending',
  provider_subscription_id varchar(255),
  started_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES platform_subscriptions(id) ON DELETE SET NULL,
  invoice_number varchar(80) NOT NULL UNIQUE,
  amount numeric(18,2) NOT NULL CHECK (amount >= 0),
  currency varchar(10) NOT NULL DEFAULT 'BDT',
  status varchar(50) NOT NULL DEFAULT 'draft',
  due_date timestamptz NOT NULL,
  collection_state varchar(50) NOT NULL DEFAULT 'open',
  issued_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_support_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  subject varchar(255) NOT NULL,
  description text NOT NULL,
  priority varchar(30) NOT NULL DEFAULT 'normal',
  status varchar(50) NOT NULL DEFAULT 'open',
  assigned_to_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  resolution_metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  platform_role varchar(50) NOT NULL,
  action varchar(120) NOT NULL,
  target_type varchar(80) NOT NULL,
  target_id varchar(255),
  before_metadata jsonb,
  after_metadata jsonb,
  request_id varchar(100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_audit_logs_actor_idx ON platform_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS platform_audit_logs_action_idx ON platform_audit_logs(action);
CREATE INDEX IF NOT EXISTS platform_audit_logs_created_at_idx ON platform_audit_logs(created_at);

CREATE OR REPLACE FUNCTION app.is_platform_user() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform_user_roles
    WHERE user_id = app.current_user_id()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, app;

CREATE OR REPLACE FUNCTION app.has_platform_role(VARIADIC roles_list text[]) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform_user_roles
    WHERE user_id = app.current_user_id()
      AND role = ANY(roles_list)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, app;

CREATE OR REPLACE FUNCTION app.is_privileged_platform_user() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform_user_roles
    WHERE user_id = app.current_user_id()
      AND role IN ('PLATFORM_SUPER_ADMIN', 'PLATFORM_ADMIN')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, app;

ALTER POLICY tenant_isolation_tenants ON tenants
  USING (id = app.current_tenant_id() OR app.is_privileged_platform_user())
  WITH CHECK (id = app.current_tenant_id() OR app.is_privileged_platform_user());

ALTER POLICY tenant_isolation_memberships ON memberships
  USING (tenant_id = app.current_tenant_id()
    OR user_id = app.current_user_id()
    OR app.is_privileged_platform_user())
  WITH CHECK (tenant_id = app.current_tenant_id() OR app.is_privileged_platform_user());

ALTER POLICY tenant_isolation_roles ON roles
  USING (tenant_id = app.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = app.current_user_id())
    OR app.is_privileged_platform_user())
  WITH CHECK (tenant_id = app.current_tenant_id() OR app.is_privileged_platform_user());

ALTER TABLE platform_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_firm_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_demo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_support_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_user_roles_self ON platform_user_roles
  FOR SELECT USING (user_id = app.current_user_id());

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'platform_plans', 'platform_firm_onboarding', 'platform_leads',
    'platform_demo_requests', 'platform_access_requests',
    'platform_subscriptions', 'platform_invoices', 'platform_support_cases',
    'platform_audit_logs'
  ] LOOP
    EXECUTE format('CREATE POLICY platform_staff_access ON %I FOR ALL USING (app.is_platform_user()) WITH CHECK (app.is_platform_user())', table_name);
  END LOOP;
END $$;
