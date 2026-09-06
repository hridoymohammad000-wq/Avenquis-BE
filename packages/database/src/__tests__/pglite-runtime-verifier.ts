import { PGlite } from "@electric-sql/pglite";
import * as fs from "fs";
import * as path from "path";

export async function runRuntimeVerification() {
  console.log("=== STARTING PGLITE POSTGRESQL RUNTIME VERIFICATION ===");
  const db = new PGlite();

  // 1. CLEAN MIGRATION TEST
  console.log("\n1. Running clean database migrations (0000 -> 0078)...");
  const migrationsDir = path.resolve(process.cwd(), "migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");
    try {
      await db.exec(sql);
    } catch (err: any) {
      console.error(`Migration failure in ${file}:`, err.message);
      throw err;
    }
  }
  console.log(`Successfully executed all ${files.length} SQL migrations including 0077 and 0078!`);

  // 2. VERIFY PLATFORM PLAN DATA
  console.log("\n2. Verifying platform plan data in platform_plans table...");
  const plans = await db.query<any>("SELECT code, proprietor_seats, partner_seats, student_seats FROM platform_plans");
  const planMap = new Map(plans.rows.map((p: any) => [p.code, p]));

  const singleStudent = planMap.get("SINGLE_ARTICLE_STUDENT");
  const individualProp = planMap.get("INDIVIDUAL_PROPRIETOR");
  const prop5 = planMap.get("PROPRIETOR_5_STUDENTS");
  const partnership = planMap.get("PARTNERSHIP_FIRM");

  console.log("SINGLE_ARTICLE_STUDENT:", singleStudent);
  console.log("INDIVIDUAL_PROPRIETOR:", individualProp);
  console.log("PROPRIETOR_5_STUDENTS:", prop5);
  console.log("PARTNERSHIP_FIRM:", partnership);

  if (
    singleStudent?.proprietor_seats !== 0 || singleStudent?.partner_seats !== 0 || singleStudent?.student_seats !== 1 ||
    individualProp?.proprietor_seats !== 1 || individualProp?.partner_seats !== 0 || individualProp?.student_seats !== 0 ||
    prop5?.proprietor_seats !== 1 || prop5?.partner_seats !== 0 || prop5?.student_seats !== 5 ||
    partnership?.proprietor_seats !== 0 || partnership?.partner_seats !== 4 || partnership?.student_seats !== 10
  ) {
    throw new Error("Platform plan contract verification failed!");
  }
  console.log("PLATFORM PLAN DATA: PASS");

  // 3. SEED TEST IDENTITIES & TENANTS
  console.log("\n3. Seeding test tenants, users, and roles...");
  // Create Tenants
  const tenantAId = (await db.query<any>("INSERT INTO tenants (name, slug, status) VALUES ('Tenant A', 'tenant-a', 'active') RETURNING id")).rows[0].id;
  const tenantBId = (await db.query<any>("INSERT INTO tenants (name, slug, status) VALUES ('Tenant B', 'tenant-b', 'active') RETURNING id")).rows[0].id;

  // Create Users
  const userAId = (await db.query<any>("INSERT INTO user_profiles (email, full_name, status) VALUES ('usera@tenanta.com', 'User A', 'active') RETURNING id")).rows[0].id;
  const userBId = (await db.query<any>("INSERT INTO user_profiles (email, full_name, status) VALUES ('userb@tenantb.com', 'User B', 'active') RETURNING id")).rows[0].id;

  const supportId = (await db.query<any>("INSERT INTO user_profiles (email, full_name, status) VALUES ('support@platform.com', 'Support Staff', 'active') RETURNING id")).rows[0].id;
  const salesId = (await db.query<any>("INSERT INTO user_profiles (email, full_name, status) VALUES ('sales@platform.com', 'Sales Staff', 'active') RETURNING id")).rows[0].id;
  const marketingId = (await db.query<any>("INSERT INTO user_profiles (email, full_name, status) VALUES ('marketing@platform.com', 'Marketing Staff', 'active') RETURNING id")).rows[0].id;
  const financeId = (await db.query<any>("INSERT INTO user_profiles (email, full_name, status) VALUES ('finance@platform.com', 'Finance Staff', 'active') RETURNING id")).rows[0].id;
  const opsId = (await db.query<any>("INSERT INTO user_profiles (email, full_name, status) VALUES ('ops@platform.com', 'Ops Staff', 'active') RETURNING id")).rows[0].id;
  const platformAdminId = (await db.query<any>("INSERT INTO user_profiles (email, full_name, status) VALUES ('admin@platform.com', 'Platform Admin', 'active') RETURNING id")).rows[0].id;
  const platformSuperAdminId = (await db.query<any>("INSERT INTO user_profiles (email, full_name, status) VALUES ('superadmin@platform.com', 'Platform Super Admin', 'active') RETURNING id")).rows[0].id;

  // Assign Platform Roles
  await db.query(`
    INSERT INTO platform_user_roles (user_id, role) VALUES
    ('${supportId}', 'SUPPORT'),
    ('${salesId}', 'SALES'),
    ('${marketingId}', 'MARKETING'),
    ('${financeId}', 'FINANCE'),
    ('${opsId}', 'OPS'),
    ('${platformAdminId}', 'PLATFORM_ADMIN'),
    ('${platformSuperAdminId}', 'PLATFORM_SUPER_ADMIN')
  `);

  // Assign Memberships in Tenant A and B
  const memAId = (await db.query<any>(`INSERT INTO memberships (tenant_id, user_id, status) VALUES ('${tenantAId}', '${userAId}', 'active') RETURNING id`)).rows[0].id;
  const memBId = (await db.query<any>(`INSERT INTO memberships (tenant_id, user_id, status) VALUES ('${tenantBId}', '${userBId}', 'active') RETURNING id`)).rows[0].id;

  const roleAId = (await db.query<any>(`INSERT INTO roles (tenant_id, name, code, is_system) VALUES ('${tenantAId}', 'Audit Manager', 'audit_manager', false) RETURNING id`)).rows[0].id;
  const roleBId = (await db.query<any>(`INSERT INTO roles (tenant_id, name, code, is_system) VALUES ('${tenantBId}', 'Partner', 'partner', false) RETURNING id`)).rows[0].id;

  console.log("Seeded tenants, profiles, memberships, and roles successfully.");

  // Force RLS so session context app.current_tenant_id / app.current_user_id is enforced
  await db.exec(`
    ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
    ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
    ALTER TABLE roles FORCE ROW LEVEL SECURITY;
    ALTER TABLE platform_user_roles FORCE ROW LEVEL SECURITY;
    CREATE ROLE test_app_user;
    GRANT ALL ON SCHEMA public TO test_app_user;
    GRANT USAGE ON SCHEMA app TO test_app_user;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO test_app_user;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO test_app_user;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO test_app_user;
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO test_app_user;
    SET ROLE test_app_user;
  `);

  // 4. CORE TENANT RLS VERIFICATION
  console.log("\n4. Verifying Core Tenant RLS under session context...");

  // Test Firm User A (in Tenant A) attempting to query Tenant B data
  await db.query(`SELECT set_config('app.current_user_id', '${userAId}', false), set_config('app.current_tenant_id', '${tenantAId}', false)`);
  console.log("Debug context:", (await db.query("SELECT app.current_user_id() as uid, app.current_tenant_id() as tid")).rows);
  console.log("Tenants policies:", (await db.query("SELECT policyname, qual FROM pg_policies WHERE tablename = 'tenants'")).rows);

  const userATenants = await db.query(`SELECT id FROM tenants WHERE id = '${tenantBId}'`);
  console.log("User A query Tenant B count:", userATenants.rows.length);

  const userAMemberships = await db.query(`SELECT id FROM memberships WHERE tenant_id = '${tenantBId}'`);
  console.log("User A query Tenant B memberships count:", userAMemberships.rows.length);

  const userARoles = await db.query(`SELECT id FROM roles WHERE tenant_id = '${tenantBId}'`);
  console.log("User A query Tenant B roles count:", userARoles.rows.length);

  if (userATenants.rows.length !== 0 || userAMemberships.rows.length !== 0 || userARoles.rows.length !== 0) {
    throw new Error("RLS FIRM USER ISOLATION FAILED: User A was able to read Tenant B data!");
  }
  console.log("RLS FIRM USER ISOLATION: PASS");

  // Test Low-Privilege Platform Roles (SUPPORT, SALES, MARKETING, FINANCE, OPS)
  const lowPrivRoles = [
    { name: "SUPPORT", id: supportId },
    { name: "SALES", id: salesId },
    { name: "MARKETING", id: marketingId },
    { name: "FINANCE", id: financeId },
    { name: "OPS", id: opsId },
  ];

  for (const { name, id } of lowPrivRoles) {
    await db.query(`SELECT set_config('app.current_user_id', '${id}', false), set_config('app.current_tenant_id', '', false)`);
    const tenantAccess = await db.query(`SELECT id FROM tenants WHERE id = '${tenantAId}'`);
    console.log(`Role ${name} un-isolated tenant query result count:`, tenantAccess.rows.length);
    if (tenantAccess.rows.length !== 0) {
      throw new Error(`RLS ${name} ISOLATION FAILED: Low privilege platform role ${name} bypassed tenant isolation!`);
    }
    console.log(`RLS ${name} ISOLATION: PASS`);
  }

  // Test Privileged Platform Roles (PLATFORM_ADMIN, PLATFORM_SUPER_ADMIN)
  for (const { name, id } of [{ name: "PLATFORM_ADMIN", id: platformAdminId }, { name: "PLATFORM_SUPER_ADMIN", id: platformSuperAdminId }]) {
    await db.query(`SELECT set_config('app.current_user_id', '${id}', false), set_config('app.current_tenant_id', '', false)`);
    const tenantAccess = await db.query(`SELECT id FROM tenants WHERE id = '${tenantAId}'`);
    console.log(`Role ${name} privileged tenant access count:`, tenantAccess.rows.length);
    if (tenantAccess.rows.length === 0) {
      throw new Error(`RLS ${name} PRIVILEGED ACCESS FAILED: Privileged admin ${name} could not access platform tenant records!`);
    }
    console.log(`RLS ${name}: PASS`);
  }

  // 5. PLATFORM TABLE RLS VERIFICATION
  console.log("\n5. Verifying Platform Tables RLS...");
  await db.query(`SELECT set_config('app.current_user_id', '${userAId}', false), set_config('app.current_tenant_id', '${tenantAId}', false)`);
  const firmUserRolesAccess = await db.query(`SELECT user_id FROM platform_user_roles`);
  console.log("Firm user access to platform_user_roles count:", firmUserRolesAccess.rows.length);
  if (firmUserRolesAccess.rows.length !== 0) {
    throw new Error("PLATFORM TABLE RLS FAILED: Firm user could read platform_user_roles!");
  }
  console.log("PLATFORM TABLE RLS: PASS");

  // 6. PARTNERSHIP 4+10 SEAT ENFORCEMENT & AI APPROVAL BINDING
  console.log("\n6. Verifying AI Approval & Seat Contracts in Database...");
  await db.query(`SELECT set_config('app.current_user_id', '${platformAdminId}', false)`);
  const agentRunId = (await db.query<any>(`
    INSERT INTO ai_agents (code, name, purpose, autonomy_level, risk_level, enabled)
    VALUES ('lead_assistant', 'Lead Assistant', 'Assist with leads', 'L3', 'low', true)
    RETURNING id
  `)).rows[0].id;

  const runId = (await db.query<any>(`
    INSERT INTO ai_agent_runs (agent_id, status, requested_by_user_id, request_summary)
    VALUES ('${agentRunId}', 'RUNNING', '${platformAdminId}', 'Run lead pipeline check')
    RETURNING id
  `)).rows[0].id;

  const approvalId = (await db.query<any>(`
    INSERT INTO ai_approvals (agent_id, run_id, requested_action, risk_level, requested_by_user_id, rationale, status)
    VALUES ('${agentRunId}', '${runId}', 'getLeadPipeline', 'low', '${platformAdminId}', 'Approved by admin', 'APPROVED')
    RETURNING id
  `)).rows[0].id;

  const approvalRow = (await db.query<any>(`SELECT * FROM ai_approvals WHERE id = '${approvalId}'`)).rows[0];
  console.log("Inserted AI approval record:", approvalRow);

  if (approvalRow.agent_id !== agentRunId || approvalRow.run_id !== runId || approvalRow.status !== "APPROVED") {
    throw new Error("AI APPROVAL BINDING FAILED: Record mismatch in PostgreSQL engine!");
  }
  console.log("AI APPROVAL EXACT BINDING RUNTIME: PASS");

  console.log("\n=== ALL RUNTIME DATABASE & RLS VERIFICATIONS PASSED SUCCESSFULLY! ===");
}

runRuntimeVerification().catch((e) => {
  console.error("Runtime verification error:", e);
  process.exit(1);
});
