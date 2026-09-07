CREATE TABLE IF NOT EXISTS ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(80) NOT NULL UNIQUE,
  name varchar(160) NOT NULL, purpose text NOT NULL, allowed_tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  autonomy_level varchar(2) NOT NULL DEFAULT 'L0', risk_level varchar(20) NOT NULL DEFAULT 'low',
  provider varchar(50), model varchar(100), enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ai_agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), agent_id uuid NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  status varchar(30) NOT NULL DEFAULT 'CREATED', requested_by_user_id uuid NOT NULL REFERENCES user_profiles(id),
  request_summary text NOT NULL, rationale text, error_code varchar(80), started_at timestamptz, completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ai_agent_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), run_id uuid NOT NULL REFERENCES ai_agent_runs(id) ON DELETE CASCADE,
  step_index integer NOT NULL, action varchar(120) NOT NULL, status varchar(30) NOT NULL, rationale text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ai_agent_tool_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), run_id uuid NOT NULL REFERENCES ai_agent_runs(id) ON DELETE CASCADE,
  tool_name varchar(120) NOT NULL, status varchar(30) NOT NULL, input_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ai_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), run_id uuid NOT NULL REFERENCES ai_agent_runs(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE, requested_action text NOT NULL,
  risk_level varchar(20) NOT NULL, requested_by_user_id uuid NOT NULL REFERENCES user_profiles(id), rationale text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'PENDING', reviewed_by_user_id uuid REFERENCES user_profiles(id), reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ai_usage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), run_id uuid NOT NULL REFERENCES ai_agent_runs(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE, provider varchar(50) NOT NULL, model varchar(100) NOT NULL,
  input_tokens integer, output_tokens integer, estimated_cost numeric(18,6), latency_ms integer, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ai_admin_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), policy_key varchar(100) NOT NULL UNIQUE, value jsonb NOT NULL,
  updated_by_user_id uuid REFERENCES user_profiles(id), updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO ai_agents (code, name, purpose, allowed_tools, autonomy_level, risk_level) VALUES
('SALES','Sales','Lead and funnel intelligence','["getLeadPipeline","createCommunicationDraft"]','L1','low'),
('MARKETING','Marketing','Growth and campaign intelligence','["getGrowthMetrics","createCommunicationDraft"]','L1','low'),
('COLLECTION','Collections','Collections prioritization','["getOutstandingInvoices","createTaskDraft"]','L3','high'),
('CUSTOMER_SUCCESS','Customer Success','Firm health insights','["getFirmSummary","createTaskDraft"]','L1','medium'),
('OPERATIONS','Operations','Platform operations assistance','["getFirmSummary","createTaskDraft"]','L3','high'),
('SUPPORT','Support','Support case triage','["getSupportCases","createTaskDraft"]','L3','high'),
('RESEARCH','Research','Platform research suggestions','["getGrowthMetrics"]','L0','low')
ON CONFLICT (code) DO NOTHING;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_admin_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_agents_platform_only ON ai_agents USING (app.is_platform_user());
CREATE POLICY ai_runs_platform_only ON ai_agent_runs USING (app.is_platform_user());
CREATE POLICY ai_steps_platform_only ON ai_agent_steps USING (app.is_platform_user());
CREATE POLICY ai_tools_platform_only ON ai_agent_tool_calls USING (app.is_platform_user());
CREATE POLICY ai_approvals_platform_only ON ai_approvals USING (app.is_platform_user());
CREATE POLICY ai_usage_platform_only ON ai_usage_records USING (app.is_platform_user());
CREATE POLICY ai_policies_platform_only ON ai_admin_policies USING (app.is_platform_user());
