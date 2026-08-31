import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================================================
// TENANT FOUNDATION
// ============================================================================

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tenantSettings = pgTable(
  "tenant_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 100 }).notNull(),
    value: jsonb("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantKeyIdx: uniqueIndex("tenant_settings_tenant_key_idx").on(
      table.tenantId,
      table.key,
    ),
  }),
);

export const tenantDeploymentProfiles = pgTable("tenant_deployment_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  region: varchar("region", { length: 50 }).notNull().default("ap-southeast-1"),
  environment: varchar("environment", { length: 50 })
    .notNull()
    .default("production"),
  deploymentType: varchar("deployment_type", { length: 50 })
    .notNull()
    .default("multi_tenant"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// USERS & MEMBERSHIPS
// ============================================================================

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  passwordHash: text("password_hash"),
  mfaSecret: text("mfa_secret"),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  mfaBackupCodes: jsonb("mfa_backup_codes"),
  avatarUrl: text("avatar_url"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 50 }).notNull().default("active"), // active, disabled, expired
    startAt: timestamp("start_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantUserIdx: uniqueIndex("memberships_tenant_user_idx").on(
      table.tenantId,
      table.userId,
    ),
    tenantIdIdx: index("memberships_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("memberships_user_id_idx").on(table.userId),
  }),
);

export const membershipSessions = pgTable("membership_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  membershipId: uuid("membership_id")
    .notNull()
    .references(() => memberships.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// PERMISSIONS & ROLES (RBAC)
// ============================================================================

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, {
    onDelete: "cascade",
  }), // null = global/system role
  code: varchar("code", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  }),
);

export const membershipRoles = pgTable(
  "membership_roles",
  {
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.membershipId, table.roleId] }),
  }),
);

export const resourceAccessGrants = pgTable("resource_access_grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  membershipId: uuid("membership_id")
    .notNull()
    .references(() => memberships.id, { onDelete: "cascade" }),
  resourceType: varchar("resource_type", { length: 100 }).notNull(),
  resourceId: uuid("resource_id").notNull(),
  accessLevel: varchar("access_level", { length: 50 }).notNull(), // read, write, admin
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// AUDIT & SECURITY EVENTS
// ============================================================================

export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id").references(() => memberships.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 100 }).notNull(),
    resourceType: varchar("resource_type", { length: 100 }).notNull(),
    resourceId: varchar("resource_id", { length: 255 }),
    metadata: jsonb("metadata"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("activity_events_tenant_id_idx").on(table.tenantId),
    createdAtIdx: index("activity_events_created_at_idx").on(table.createdAt),
  }),
);

export const securityEvents = pgTable(
  "security_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, {
      onDelete: "cascade",
    }),
    membershipId: uuid("membership_id").references(() => memberships.id, {
      onDelete: "set null",
    }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    severity: varchar("severity", { length: 20 }).notNull().default("info"), // info, warning, critical
    details: jsonb("details").notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("security_events_tenant_id_idx").on(table.tenantId),
    severityIdx: index("security_events_severity_idx").on(table.severity),
  }),
);

export const eventHashCheckpoints = pgTable("event_hash_checkpoints", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  lastEventId: uuid("last_event_id").notNull(),
  hash: varchar("hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// SYSTEM SETTINGS & FEATURE FLAGS
// ============================================================================

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const featureFlags = pgTable("feature_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  tenantId: uuid("tenant_id").references(() => tenants.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// PHASE 4: PEOPLE & STAFF MANAGEMENT
// ============================================================================

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    description: text("description"),
    headMembershipId: uuid("head_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantCodeIdx: uniqueIndex("departments_tenant_code_idx").on(
      table.tenantId,
      table.code,
    ),
    tenantIdIdx: index("departments_tenant_id_idx").on(table.tenantId),
  }),
);

export const designations = pgTable(
  "designations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    level: integer("level").notNull().default(1),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantCodeIdx: uniqueIndex("designations_tenant_code_idx").on(
      table.tenantId,
      table.code,
    ),
    tenantIdIdx: index("designations_tenant_id_idx").on(table.tenantId),
  }),
);

export const staffProfiles = pgTable(
  "staff_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    employeeCode: varchar("employee_code", { length: 50 }).notNull(),
    departmentId: uuid("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    designationId: uuid("designation_id").references(() => designations.id, {
      onDelete: "set null",
    }),
    employmentType: varchar("employment_type", { length: 50 })
      .notNull()
      .default("full_time"), // full_time, part_time, contract, intern
    status: varchar("status", { length: 50 }).notNull().default("active"), // active, probation, notice_period, exited, suspended
    joiningDate: timestamp("joining_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    exitDate: timestamp("exit_date", { withTimezone: true }),
    phone: varchar("phone", { length: 50 }),
    emergencyContact: jsonb("emergency_contact"),
    bio: text("bio"),
    address: jsonb("address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantEmpCodeIdx: uniqueIndex("staff_profiles_tenant_emp_code_idx").on(
      table.tenantId,
      table.employeeCode,
    ),
    tenantMembershipIdx: uniqueIndex("staff_profiles_tenant_membership_idx").on(
      table.tenantId,
      table.membershipId,
    ),
    tenantIdIdx: index("staff_profiles_tenant_id_idx").on(table.tenantId),
    deptIdIdx: index("staff_profiles_dept_id_idx").on(table.departmentId),
  }),
);

export const staffLifecycleEvents = pgTable(
  "staff_lifecycle_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 50 }).notNull(), // joined, probation_cleared, promoted, transferred, resigned, terminated
    effectiveDate: timestamp("effective_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    remarks: text("remarks"),
    metadata: jsonb("metadata"),
    performedByMembershipId: uuid("performed_by_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("staff_lifecycle_events_tenant_id_idx").on(
      table.tenantId,
    ),
    staffIdIdx: index("staff_lifecycle_events_staff_id_idx").on(table.staffId),
    createdAtIdx: index("staff_lifecycle_events_created_at_idx").on(
      table.createdAt,
    ),
  }),
);

// ============================================================================
// PHASE 5: CA STUDENT / ARTICLESHIP MANAGEMENT
// ============================================================================

export const studentProfiles = pgTable(
  "student_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    registrationNumber: varchar("registration_number", {
      length: 100,
    }).notNull(),
    principalMembershipId: uuid("principal_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    courseLevel: varchar("course_level", { length: 50 })
      .notNull()
      .default("knowledge"), // knowledge, application, advanced
    articleshipStartDate: timestamp("articleship_start_date", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    articleshipEndDate: timestamp("articleship_end_date", {
      withTimezone: true,
    }),
    status: varchar("status", { length: 50 }).notNull().default("active"), // active, completed, transferred, suspended
    emergencyContact: jsonb("emergency_contact"),
    address: jsonb("address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantRegNumIdx: uniqueIndex("student_profiles_tenant_reg_num_idx").on(
      table.tenantId,
      table.registrationNumber,
    ),
    tenantMembershipIdx: uniqueIndex(
      "student_profiles_tenant_membership_idx",
    ).on(table.tenantId, table.membershipId),
    tenantIdIdx: index("student_profiles_tenant_id_idx").on(table.tenantId),
  }),
);

export const studentTrainingRecords = pgTable(
  "student_training_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    topic: varchar("topic", { length: 255 }).notNull(),
    hoursCompleted: integer("hours_completed").notNull().default(0),
    supervisorMembershipId: uuid("supervisor_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    remarks: text("remarks"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("student_training_records_tenant_id_idx").on(
      table.tenantId,
    ),
    studentIdIdx: index("student_training_records_student_id_idx").on(
      table.studentId,
    ),
  }),
);

export const studentLeaveRecords = pgTable(
  "student_leave_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    leaveType: varchar("leave_type", { length: 50 }).notNull(), // study, exam, sick, casual
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    totalDays: integer("total_days").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, rejected
    approvedByMembershipId: uuid("approved_by_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    remarks: text("remarks"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("student_leave_records_tenant_id_idx").on(
      table.tenantId,
    ),
    studentIdIdx: index("student_leave_records_student_id_idx").on(
      table.studentId,
    ),
  }),
);

export const studentExamRecords = pgTable(
  "student_exam_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    session: varchar("session", { length: 100 }).notNull(),
    level: varchar("level", { length: 50 }).notNull(), // knowledge, application, advanced
    subject: varchar("subject", { length: 255 }).notNull(),
    resultStatus: varchar("result_status", { length: 50 }).notNull(), // passed, failed, appeared
    marks: integer("marks"),
    examDate: timestamp("exam_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("student_exam_records_tenant_id_idx").on(table.tenantId),
    studentIdIdx: index("student_exam_records_student_id_idx").on(
      table.studentId,
    ),
  }),
);

export const studentAssignmentHistory = pgTable(
  "student_assignment_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    clientName: varchar("client_name", { length: 255 }).notNull(),
    role: varchar("role", { length: 100 }).notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    hoursLogged: integer("hours_logged").notNull().default(0),
    remarks: text("remarks"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("student_assignment_history_tenant_id_idx").on(
      table.tenantId,
    ),
    studentIdIdx: index("student_assignment_history_student_id_idx").on(
      table.studentId,
    ),
  }),
);
