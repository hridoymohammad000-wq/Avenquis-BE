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

// ============================================================================
// CLIENT CRM & KYC/AML COMPLIANCE
// ============================================================================

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    clientCode: varchar("client_code", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    clientType: varchar("client_type", { length: 50 }).notNull(), // corporate, individual, government, non_profit, partnership
    industry: varchar("industry", { length: 100 }),
    taxIdentificationNumber: varchar("tax_identification_number", {
      length: 100,
    }),
    businessRegistrationNumber: varchar("business_registration_number", {
      length: 100,
    }),
    primaryEmail: varchar("primary_email", { length: 255 }),
    primaryPhone: varchar("primary_phone", { length: 50 }),
    address: jsonb("address"),
    riskRating: varchar("risk_rating", { length: 50 })
      .notNull()
      .default("unassessed"), // low, medium, high, unassessed
    kycStatus: varchar("kyc_status", { length: 50 })
      .notNull()
      .default("pending"), // pending, verified, expired, rejected
    status: varchar("status", { length: 50 }).notNull().default("active"), // active, onboarding, inactive, blacklisted
    leadPartnerMembershipId: uuid("lead_partner_membership_id").references(
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
    tenantClientCodeIdx: uniqueIndex("clients_tenant_client_code_idx").on(
      table.tenantId,
      table.clientCode,
    ),
    tenantIdIdx: index("clients_tenant_id_idx").on(table.tenantId),
  }),
);

export const clientContacts = pgTable(
  "client_contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    designation: varchar("designation", { length: 100 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    isPrimary: boolean("is_primary").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("client_contacts_tenant_id_idx").on(table.tenantId),
    clientIdIdx: index("client_contacts_client_id_idx").on(table.clientId),
  }),
);

export const clientKycDocuments = pgTable(
  "client_kyc_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    documentType: varchar("document_type", { length: 100 }).notNull(), // trade_license, tin_certificate, vat_certificate, incorporation_cert, nid_passport, utility_bill
    documentNumber: varchar("document_number", { length: 100 }),
    fileUrl: text("file_url"),
    verificationStatus: varchar("verification_status", { length: 50 })
      .notNull()
      .default("pending"), // pending, verified, rejected
    verifiedByMembershipId: uuid("verified_by_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    expiryDate: timestamp("expiry_date", { withTimezone: true }),
    remarks: text("remarks"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("client_kyc_documents_tenant_id_idx").on(table.tenantId),
    clientIdIdx: index("client_kyc_documents_client_id_idx").on(table.clientId),
  }),
);

// ============================================================================
// ENGAGEMENT MANAGEMENT & AUDITING
// ============================================================================

export const engagements = pgTable(
  "engagements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    engagementCode: varchar("engagement_code", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    engagementType: varchar("engagement_type", { length: 100 }).notNull(), // statutory_audit, tax_advisory, accounting_services, special_audit, vat_consulting, valuation_advisory
    financialYear: varchar("financial_year", { length: 50 }).notNull(), // e.g. FY 2025-26
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    budgetedHours: integer("budgeted_hours").notNull().default(0),
    budgetedFee: integer("budgeted_fee").notNull().default(0),
    currency: varchar("currency", { length: 10 }).notNull().default("BDT"),
    status: varchar("status", { length: 50 }).notNull().default("planning"), // planning, fieldwork, review, partner_signoff, completed, archived
    engagementPartnerMembershipId: uuid(
      "engagement_partner_membership_id",
    ).references(() => memberships.id, { onDelete: "set null" }),
    engagementManagerMembershipId: uuid(
      "engagement_manager_membership_id",
    ).references(() => memberships.id, { onDelete: "set null" }),
    auditQualityReviewerMembershipId: uuid(
      "audit_quality_reviewer_membership_id",
    ).references(() => memberships.id, { onDelete: "set null" }),
    independenceCleared: boolean("independence_cleared")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantEngagementCodeIdx: uniqueIndex(
      "engagements_tenant_engagement_code_idx",
    ).on(table.tenantId, table.engagementCode),
    tenantIdIdx: index("engagements_tenant_id_idx").on(table.tenantId),
    clientIdIdx: index("engagements_client_id_idx").on(table.clientId),
  }),
);

export const engagementTeamMembers = pgTable(
  "engagement_team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 100 }).notNull(), // lead_partner, engagement_manager, senior_auditor, staff_auditor, article_student, eqcr_partner
    allocatedHours: integer("allocated_hours").notNull().default(0),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantEngagementMemberIdx: uniqueIndex(
      "engagement_team_members_tenant_eng_member_idx",
    ).on(table.tenantId, table.engagementId, table.membershipId),
    tenantIdIdx: index("engagement_team_members_tenant_id_idx").on(
      table.tenantId,
    ),
    engagementIdIdx: index("engagement_team_members_engagement_id_idx").on(
      table.engagementId,
    ),
  }),
);

export const engagementIndependenceDeclarations = pgTable(
  "engagement_independence_declarations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    declarationStatus: varchar("declaration_status", { length: 50 })
      .notNull()
      .default("pending"), // pending, cleared, conflict_flagged
    hasFinancialInterest: boolean("has_financial_interest")
      .notNull()
      .default(false),
    hasPersonalRelationship: boolean("has_personal_relationship")
      .notNull()
      .default(false),
    remarks: text("remarks"),
    clearedAt: timestamp("cleared_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("engagement_independence_declarations_tenant_id_idx").on(
      table.tenantId,
    ),
    engagementIdIdx: index(
      "engagement_independence_declarations_engagement_id_idx",
    ).on(table.engagementId),
  }),
);

// ============================================================================
// WORKING PAPERS & DOCUMENT VAULT
// ============================================================================

export const workingPapers = pgTable(
  "working_papers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    wpCode: varchar("wp_code", { length: 50 }).notNull(), // e.g. A-100, B-200, TAX-01
    title: varchar("title", { length: 255 }).notNull(),
    section: varchar("section", { length: 100 }).notNull(), // planning, assets, liabilities, equity, revenue, expenses, taxation, completion, permanent_file
    fileUrl: text("file_url"),
    status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, prepared, reviewed, approved, rejected
    preparedByMembershipId: uuid("prepared_by_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    preparedAt: timestamp("prepared_at", { withTimezone: true }),
    reviewedByMembershipId: uuid("reviewed_by_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    version: integer("version").notNull().default(1),
    remarks: text("remarks"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantEngWpCodeIdx: uniqueIndex("working_papers_tenant_eng_wp_code_idx").on(
      table.tenantId,
      table.engagementId,
      table.wpCode,
    ),
    tenantIdIdx: index("working_papers_tenant_id_idx").on(table.tenantId),
    engagementIdIdx: index("working_papers_engagement_id_idx").on(
      table.engagementId,
    ),
  }),
);

export const reviewNotes = pgTable(
  "review_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    workingPaperId: uuid("working_paper_id")
      .notNull()
      .references(() => workingPapers.id, { onDelete: "cascade" }),
    authorMembershipId: uuid("author_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("open"), // open, addressed, cleared
    addressedByMembershipId: uuid("addressed_by_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    addressedAt: timestamp("addressed_at", { withTimezone: true }),
    clearedByMembershipId: uuid("cleared_by_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    clearedAt: timestamp("cleared_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("review_notes_tenant_id_idx").on(table.tenantId),
    workingPaperIdIdx: index("review_notes_working_paper_id_idx").on(
      table.workingPaperId,
    ),
  }),
);

export const clientDocumentRequests = pgTable(
  "client_document_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    requestTitle: varchar("request_title", { length: 255 }).notNull(),
    description: text("description"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, submitted, approved, rejected
    uploadedFileUrl: text("uploaded_file_url"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("client_document_requests_tenant_id_idx").on(
      table.tenantId,
    ),
    engagementIdIdx: index("client_document_requests_engagement_id_idx").on(
      table.engagementId,
    ),
  }),
);

// ============================================================================
// TASK MANAGEMENT, TIMESHEETS & BILLING
// ============================================================================

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    assigneeMembershipId: uuid("assignee_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    priority: varchar("priority", { length: 50 }).notNull().default("medium"), // low, medium, high, urgent
    status: varchar("status", { length: 50 }).notNull().default("todo"), // todo, in_progress, review, completed, cancelled
    dueDate: timestamp("due_date", { withTimezone: true }),
    estimatedHours: integer("estimated_hours").notNull().default(0),
    actualHours: integer("actual_hours").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("tasks_tenant_id_idx").on(table.tenantId),
    engagementIdIdx: index("tasks_engagement_id_idx").on(table.engagementId),
    assigneeMembershipIdIdx: index("tasks_assignee_membership_id_idx").on(
      table.assigneeMembershipId,
    ),
  }),
);

export const timesheetEntries = pgTable(
  "timesheet_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id").references(() => engagements.id, {
      onDelete: "set null",
    }),
    taskId: uuid("task_id").references(() => tasks.id, {
      onDelete: "set null",
    }),
    workDate: timestamp("work_date", { withTimezone: true }).notNull(),
    hours: integer("hours").notNull(), // e.g. 8 hours
    activityType: varchar("activity_type", { length: 100 }).notNull(), // audit_fieldwork, tax_preparation, client_meeting, report_writing, review, administrative, training
    description: text("description"),
    status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, submitted, approved, rejected
    approvedByMembershipId: uuid("approved_by_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("timesheet_entries_tenant_id_idx").on(table.tenantId),
    membershipIdIdx: index("timesheet_entries_membership_id_idx").on(
      table.membershipId,
    ),
    engagementIdIdx: index("timesheet_entries_engagement_id_idx").on(
      table.engagementId,
    ),
  }),
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id").references(() => engagements.id, {
      onDelete: "set null",
    }),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    amount: integer("amount").notNull(),
    vatAmount: integer("vat_amount").notNull().default(0),
    totalAmount: integer("total_amount").notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("BDT"),
    status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, sent, partially_paid, paid, overdue, cancelled
    issueDate: timestamp("issue_date", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    paidAmount: integer("paid_amount").notNull().default(0),
    remarks: text("remarks"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantInvoiceNumberIdx: uniqueIndex(
      "invoices_tenant_invoice_number_idx",
    ).on(table.tenantId, table.invoiceNumber),
    tenantIdIdx: index("invoices_tenant_id_idx").on(table.tenantId),
    clientIdIdx: index("invoices_client_id_idx").on(table.clientId),
  }),
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    receiptNumber: varchar("receipt_number", { length: 50 }).notNull(),
    amount: integer("amount").notNull(),
    paymentDate: timestamp("payment_date", { withTimezone: true }).notNull(),
    paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // bank_transfer, cheque, cash, online
    referenceNumber: varchar("reference_number", { length: 100 }),
    remarks: text("remarks"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("payments_tenant_id_idx").on(table.tenantId),
    invoiceIdIdx: index("payments_invoice_id_idx").on(table.invoiceId),
  }),
);

// ============================================================================
// SIGN-OFF WORKFLOW & DIGITAL CERTIFICATES
// ============================================================================

export const digitalCertificates = pgTable(
  "digital_certificates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    certificateNumber: varchar("certificate_number", { length: 50 }).notNull(),
    certificateType: varchar("certificate_type", { length: 100 }).notNull(), // independent_auditors_report, tax_clearance_certificate, special_audit_certificate, net_worth_certificate, compliance_certificate
    title: varchar("title", { length: 255 }).notNull(),
    auditOpinion: varchar("audit_opinion", { length: 50 }).notNull(), // unmodified, qualified, adverse, disclaimer
    summaryOpinionText: text("summary_opinion_text").notNull(),
    digitalSealHash: varchar("digital_seal_hash", { length: 255 }).notNull(),
    artifactHash: varchar("artifact_hash", { length: 64 }),
    signature: text("signature"),
    signatureAlgorithm: varchar("signature_algorithm", { length: 50 }),
    signingKeyId: varchar("signing_key_id", { length: 100 }),
    signedByMembershipId: uuid("signed_by_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    signedAt: timestamp("signed_at", { withTimezone: true }).notNull(),
    verificationToken: varchar("verification_token", {
      length: 100,
    }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("issued"), // issued, revoked
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revocationReason: text("revocation_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantCertNumberIdx: uniqueIndex(
      "digital_certificates_tenant_cert_number_idx",
    ).on(table.tenantId, table.certificateNumber),
    verificationTokenIdx: uniqueIndex(
      "digital_certificates_verification_token_idx",
    ).on(table.verificationToken),
    tenantIdIdx: index("digital_certificates_tenant_id_idx").on(table.tenantId),
    engagementIdIdx: index("digital_certificates_engagement_id_idx").on(
      table.engagementId,
    ),
  }),
);

export const signoffAuditLogs = pgTable(
  "signoff_audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    signerMembershipId: uuid("signer_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    signoffRole: varchar("signoff_role", { length: 50 }).notNull(), // audit_senior, engagement_manager, eqcr_partner, lead_partner
    action: varchar("action", { length: 50 }).notNull(), // approved, rejected, signed_and_sealed
    comments: text("comments"),
    signedHash: varchar("signed_hash", { length: 255 }),
    artifactHash: varchar("artifact_hash", { length: 64 }),
    signature: text("signature"),
    signatureAlgorithm: varchar("signature_algorithm", { length: 50 }),
    signingKeyId: varchar("signing_key_id", { length: 100 }),
    previousRecordHash: varchar("previous_record_hash", { length: 64 }),
    recordHash: varchar("record_hash", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("signoff_audit_logs_tenant_id_idx").on(table.tenantId),
    engagementIdIdx: index("signoff_audit_logs_engagement_id_idx").on(
      table.engagementId,
    ),
  }),
);

// ============================================================================
// REAL-TIME COMMUNICATION & NOTIFICATIONS
// ============================================================================

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    recipientMembershipId: uuid("recipient_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: varchar("type", { length: 100 }).notNull(), // task_assignment, review_note, leave_approval, kyc_verification, invoice_payment, independence_flag, system_alert
    link: text("link"),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantRecipientIsReadIdx: index(
      "notifications_tenant_recipient_is_read_idx",
    ).on(table.tenantId, table.recipientMembershipId, table.isRead),
    tenantIdIdx: index("notifications_tenant_id_idx").on(table.tenantId),
    recipientMembershipIdIdx: index(
      "notifications_recipient_membership_id_idx",
    ).on(table.recipientMembershipId),
  }),
);

export const activityFeedEvents = pgTable(
  "activity_feed_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    actorMembershipId: uuid("actor_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 100 }).notNull(), // client, engagement, working_paper, task, invoice, certificate
    entityId: uuid("entity_id").notNull(),
    action: varchar("action", { length: 100 }).notNull(), // created, updated, submitted, approved, rejected, signed_and_sealed, revoked
    description: text("description").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantEntityTypeEntityIdIdx: index(
      "activity_feed_events_tenant_entity_type_entity_id_idx",
    ).on(table.tenantId, table.entityType, table.entityId),
    tenantIdIdx: index("activity_feed_events_tenant_id_idx").on(table.tenantId),
  }),
);

// ============================================================================
// V2 DEEP AUDIT ENGINE: TRIAL BALANCE & ACCOUNT MAPPING
// ============================================================================

export const trialBalances = pgTable(
  "trial_balances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(), // e.g. Unadjusted Trial Balance FY 2025
    asOfDate: timestamp("as_of_date", { withTimezone: true }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("BDT"),
    totalDebit: integer("total_debit").notNull(),
    totalCredit: integer("total_credit").notNull(),
    isBalanced: boolean("is_balanced").notNull().default(true),
    uploadedByMembershipId: uuid("uploaded_by_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("trial_balances_tenant_id_idx").on(table.tenantId),
    engagementIdIdx: index("trial_balances_engagement_id_idx").on(
      table.engagementId,
    ),
  }),
);

export const tbLineItems = pgTable(
  "tb_line_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    trialBalanceId: uuid("trial_balance_id")
      .notNull()
      .references(() => trialBalances.id, { onDelete: "cascade" }),
    accountCode: varchar("account_code", { length: 50 }).notNull(),
    accountName: varchar("account_name", { length: 255 }).notNull(),
    debitAmount: integer("debit_amount").notNull().default(0),
    creditAmount: integer("credit_amount").notNull().default(0),
    netBalance: integer("net_balance").notNull(),
    priorYearBalance: integer("prior_year_balance").default(0),
    mappedFinancialStatementGroup: varchar("mapped_fs_group", { length: 100 }), // asset, liability, equity, revenue, expense
    mappedLeadSchedule: varchar("mapped_lead_schedule", { length: 100 }), // cash_and_bank, trade_receivables, inventory, trade_payables, etc.
    isMapped: boolean("is_mapped").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantTbIdx: index("tb_line_items_tenant_tb_idx").on(
      table.tenantId,
      table.trialBalanceId,
    ),
    tenantLeadScheduleIdx: index("tb_line_items_tenant_lead_schedule_idx").on(
      table.tenantId,
      table.mappedLeadSchedule,
    ),
  }),
);

// ============================================================================
// V2 DEEP AUDIT ENGINE: MATERIALITY & RISK ASSESSMENT
// ============================================================================

export const materialityAssessments = pgTable(
  "materiality_assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    benchmark: varchar("benchmark", { length: 100 }).notNull(), // total_revenue, total_assets, profit_before_tax, total_expenses, equity
    benchmarkAmount: integer("benchmark_amount").notNull(),
    percentageApplied: integer("percentage_applied").notNull(), // stored as basis points (e.g. 500 = 5.00%)
    overallMateriality: integer("overall_materiality").notNull(),
    performanceMaterialityPct: integer("performance_materiality_pct")
      .notNull()
      .default(7500), // basis points, default 75%
    performanceMateriality: integer("performance_materiality").notNull(),
    clearlyTrivialPct: integer("clearly_trivial_pct").notNull().default(500), // basis points, default 5%
    clearlyTrivialThreshold: integer("clearly_trivial_threshold").notNull(),
    rationale: text("rationale"),
    assessedByMembershipId: uuid("assessed_by_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantEngagementIdx: index("materiality_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
  }),
);

export const riskAssessments = pgTable(
  "risk_assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    lineItemId: uuid("line_item_id").references(() => tbLineItems.id, {
      onDelete: "cascade",
    }),
    areaName: varchar("area_name", { length: 255 }).notNull(), // e.g. Revenue Recognition, Inventory Valuation
    assertion: varchar("assertion", { length: 100 }).notNull(), // existence, completeness, valuation, rights_and_obligations, presentation, accuracy, cutoff, occurrence, classification
    inherentRisk: varchar("inherent_risk", { length: 20 })
      .notNull()
      .default("medium"), // low, medium, high
    controlRisk: varchar("control_risk", { length: 20 })
      .notNull()
      .default("medium"), // low, medium, high
    combinedRiskLevel: varchar("combined_risk_level", { length: 20 }).notNull(), // low, moderate, significant, high
    detectionRiskRequired: varchar("detection_risk_required", {
      length: 20,
    }).notNull(), // low, medium, high
    riskDescription: text("risk_description"),
    responseStrategy: text("response_strategy"), // planned audit response
    assessedByMembershipId: uuid("assessed_by_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantEngagementIdx: index("risk_assessments_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
    tenantAssertionIdx: index("risk_assessments_tenant_assertion_idx").on(
      table.tenantId,
      table.assertion,
    ),
  }),
);

// ============================================================================
// V2 DEEP AUDIT ENGINE: AUDIT PROGRAMS & PROCEDURES
// ============================================================================

export const auditPrograms = pgTable(
  "audit_programs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(), // e.g., "Cash and Cash Equivalents", "Revenue"
    description: text("description"),
    status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, in_progress, completed, reviewed
    preparedByMembershipId: uuid("prepared_by_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "set null" }),
    reviewedByMembershipId: uuid("reviewed_by_membership_id").references(
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
    tenantEngagementIdx: index("audit_programs_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
  }),
);

export const auditProcedures = pgTable(
  "audit_procedures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    programId: uuid("program_id")
      .notNull()
      .references(() => auditPrograms.id, { onDelete: "cascade" }),
    riskAssessmentId: uuid("risk_assessment_id").references(
      () => riskAssessments.id,
      { onDelete: "set null" },
    ),
    assertion: varchar("assertion", { length: 100 }), // can map to multiple, or link specifically. we'll keep it simple: one primary assertion per procedure
    procedureText: text("procedure_text").notNull(),
    procedureType: varchar("procedure_type", { length: 50 })
      .notNull()
      .default("substantive"), // test_of_controls, substantive, analytical
    status: varchar("status", { length: 50 }).notNull().default("not_started"), // not_started, in_progress, completed, n_a
    assignedToMembershipId: uuid("assigned_to_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    workPaperReference: varchar("work_paper_reference", { length: 255 }),
    results: text("results"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantProgramIdx: index("audit_procedures_tenant_program_idx").on(
      table.tenantId,
      table.programId,
    ),
    tenantRiskIdx: index("audit_procedures_tenant_risk_idx").on(
      table.tenantId,
      table.riskAssessmentId,
    ),
  }),
);

// ============================================================================
// V2 DEEP AUDIT ENGINE: SAMPLING & EVIDENCE VAULT
// ============================================================================

export const auditSamples = pgTable(
  "audit_samples",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    procedureId: uuid("procedure_id")
      .notNull()
      .references(() => auditProcedures.id, { onDelete: "cascade" }),
    populationSize: integer("population_size").notNull(),
    sampleSize: integer("sample_size").notNull(),
    selectionMethod: varchar("selection_method", { length: 50 }).notNull(), // random, monetary_unit, haphazard, systematic
    confidenceLevelPct: integer("confidence_level_pct").notNull().default(9500), // 95% = 9500 bps
    tolerableErrorPct: integer("tolerable_error_pct").notNull().default(500), // 5% = 500 bps
    status: varchar("status", { length: 50 }).notNull().default("planned"), // planned, selected, evaluated
    createdByMembershipId: uuid("created_by_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantEngagementIdx: index("audit_samples_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
    tenantProcedureIdx: index("audit_samples_tenant_procedure_idx").on(
      table.tenantId,
      table.procedureId,
    ),
  }),
);

export const auditEvidence = pgTable(
  "audit_evidence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    procedureId: uuid("procedure_id").references(() => auditProcedures.id, {
      onDelete: "set null",
    }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: varchar("file_url", { length: 1024 }).notNull(),
    referenceCode: varchar("reference_code", { length: 100 }), // e.g. A.1.1-1
    description: text("description"),
    uploadedByMembershipId: uuid("uploaded_by_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantEngagementIdx: index("audit_evidence_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
    tenantProcedureIdx: index("audit_evidence_tenant_procedure_idx").on(
      table.tenantId,
      table.procedureId,
    ),
  }),
);

// ============================================================================
// V2 DEEP AUDIT ENGINE: EXCEPTIONS, SUD & REVIEW
// ============================================================================

export const auditExceptions = pgTable(
  "audit_exceptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    procedureId: uuid("procedure_id").references(() => auditProcedures.id, {
      onDelete: "set null",
    }),
    exceptionType: varchar("exception_type", { length: 50 }).notNull(), // misstatement, control_failure, scope_limitation, compliance_breach
    description: text("description").notNull(),
    financialImpact: integer("financial_impact").notNull().default(0), // positive or negative adjustment amount
    resolutionStatus: varchar("resolution_status", { length: 50 })
      .notNull()
      .default("open"), // open, adjusted, unadjusted, management_letter, waived
    raisedByMembershipId: uuid("raised_by_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "set null" }),
    resolvedByMembershipId: uuid("resolved_by_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    managementResponse: text("management_response"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantEngagementIdx: index("audit_exceptions_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
    tenantStatusIdx: index("audit_exceptions_tenant_status_idx").on(
      table.tenantId,
      table.resolutionStatus,
    ),
  }),
);

export const auditReviews = pgTable(
  "audit_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    reviewType: varchar("review_type", { length: 50 }).notNull(), // hot_review, cold_review, eqcr (Engagement Quality Control Review)
    status: varchar("status", { length: 50 }).notNull().default("in_progress"), // in_progress, completed, requires_rework
    findings: text("findings"),
    reviewerMembershipId: uuid("reviewer_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "set null" }),
    signedOffAt: timestamp("signed_off_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantEngagementIdx: index("audit_reviews_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
  }),
);

// ============================================================================
// V2 DEEP AUDIT ENGINE: COMPLETION & REPORTING
// ============================================================================

export const auditCompletionChecklists = pgTable(
  "audit_completion_checklists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 100 }).notNull(), // e.g. final_review, going_concern, subsequent_events
    item: text("item").notNull(),
    isCompleted: boolean("is_completed").notNull().default(false),
    completedByMembershipId: uuid("completed_by_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    comments: text("comments"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantEngagementIdx: index(
      "audit_completion_checklists_tenant_engagement_idx",
    ).on(table.tenantId, table.engagementId),
  }),
);

export const auditReports = pgTable(
  "audit_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .unique()
      .references(() => engagements.id, { onDelete: "cascade" }),
    reportType: varchar("report_type", { length: 50 }).notNull(), // unqualified, qualified, adverse, disclaimer
    opinionText: text("opinion_text").notNull(),
    basisForOpinion: text("basis_for_opinion"),
    emphasisOfMatter: text("emphasis_of_matter"),
    keyAuditMatters: text("key_audit_matters"),
    otherInformation: text("other_information"),
    status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, signed
    draftedByMembershipId: uuid("drafted_by_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "set null" }),
    signedByMembershipId: uuid("signed_by_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    issueDate: timestamp("issue_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantEngagementIdx: index("audit_reports_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
  }),
);

// ============================================================================
// V2 DEEP AUDIT ENGINE: PERMANENT & CURRENT FILES (PAF & CAF)
// ============================================================================

export const auditFiles = pgTable(
  "audit_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id").references(() => engagements.id, {
      onDelete: "cascade",
    }), // Null for PAF, Required for CAF
    fileType: varchar("file_type", { length: 20 }).notNull(), // PAF (Permanent Audit File), CAF (Current Audit File)
    category: varchar("category", { length: 100 }).notNull(), // e.g., MoA, AoA, Board_Minutes, Planning, Execution, Conclusion
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: varchar("file_url", { length: 1024 }).notNull(),
    description: text("description"),
    uploadedByMembershipId: uuid("uploaded_by_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantClientIdx: index("audit_files_tenant_client_idx").on(
      table.tenantId,
      table.clientId,
    ),
    tenantEngagementIdx: index("audit_files_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
  }),
);

// ============================================================================
// V2 DEEP AUDIT ENGINE: AUDIT QUALITY CONTROLS (ISQM 1 / ISA 220)
// ============================================================================

export const auditQualityControls = pgTable(
  "audit_quality_controls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 50 }).notNull(), // independence, competence, eqcr, documentation, consultation
    questionText: text("question_text").notNull(),
    isCompliant: boolean("is_compliant").notNull().default(false),
    comments: text("comments"),
    evaluatedByMembershipId: uuid("evaluated_by_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    evaluatedAt: timestamp("evaluated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantEngagementIdx: index("audit_qc_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
  }),
);

// ============================================================================
// V3 BANGLADESH COMPLIANCE LAYER: PHASE 22 - ICAB WORKFLOWS
// ============================================================================

export const icabForms = pgTable(
  "icab_forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    formType: varchar("form_type", { length: 50 }).notNull(), // form_104 (Deed), form_108 (Completion), form_112 (Transfer)
    submissionDate: timestamp("submission_date", { withTimezone: true }),
    status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, pending_principal_signature, submitted_to_icab, approved, rejected
    documentUrl: varchar("document_url", { length: 1024 }),
    signedByPrincipalId: uuid("signed_by_principal_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantStudentIdx: index("icab_forms_tenant_student_idx").on(
      table.tenantId,
      table.studentId,
    ),
  }),
);

export const icabExamRegistrations = pgTable(
  "icab_exam_registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    examSession: varchar("exam_session", { length: 100 }).notNull(), // e.g., "May-June 2026"
    level: varchar("level", { length: 50 }).notNull(), // certificate, professional, advanced
    status: varchar("status", { length: 50 }).notNull().default("applied"), // applied, principal_approved, rejected
    leaveRequestedDays: integer("leave_requested_days").notNull().default(0),
    leaveApproved: boolean("leave_approved").notNull().default(false),
    approvedByMembershipId: uuid("approved_by_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    comments: text("comments"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantStudentIdx: index("icab_exam_regs_tenant_student_idx").on(
      table.tenantId,
      table.studentId,
    ),
  }),
);

// ============================================================================
// V3 BANGLADESH COMPLIANCE LAYER: PHASE 23 - DVS (Document Verification System)
// ============================================================================

export const dvsRecords = pgTable(
  "dvs_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    dvsCode: varchar("dvs_code", { length: 50 }).notNull().unique(), // e.g., 210516-XYZ-1234
    documentType: varchar("document_type", { length: 100 }).notNull(), // Audit Report, Review Report, etc.
    status: varchar("status", { length: 50 }).notNull().default("generated"), // generated, revoked
    generatedByMembershipId: uuid("generated_by_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantEngagementIdx: index("dvs_records_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
  }),
);

// ============================================================================
// V3 BANGLADESH COMPLIANCE LAYER: PHASE 24 - REGULATORY COMPLIANCE
// ============================================================================

export const regulatoryFilings = pgTable(
  "regulatory_filings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    regulator: varchar("regulator", { length: 50 }).notNull(), // FRC, BSEC, NBR, BB
    filingType: varchar("filing_type", { length: 100 }).notNull(), // Annual Return, Audit Report, Special Audit
    status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, submitted, accepted, rejected
    filingDate: timestamp("filing_date", { withTimezone: true }),
    referenceNumber: varchar("reference_number", { length: 100 }), // e.g., acknowledgment receipt number
    documentUrl: varchar("document_url", { length: 1024 }),
    submittedByMembershipId: uuid("submitted_by_membership_id").references(
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
    tenantEngagementIdx: index("reg_filings_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
    tenantRegulatorIdx: index("reg_filings_tenant_regulator_idx").on(
      table.tenantId,
      table.regulator,
    ),
  }),
);

// ============================================================================
// V3 BANGLADESH COMPLIANCE LAYER: PHASE 25 - TAX & VAT WORKFLOWS
// ============================================================================

export const taxVatWorkflows = pgTable(
  "tax_vat_workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    workflowType: varchar("workflow_type", { length: 50 }).notNull(), // corporate_tax, vat_return, withholding_tax
    period: varchar("period", { length: 50 }).notNull(), // e.g., "FY 2024-2025" or "July 2024"
    status: varchar("status", { length: 50 })
      .notNull()
      .default("data_collection"), // data_collection, computation, review, filed, completed
    dueDate: timestamp("due_date", { withTimezone: true }),
    filedDate: timestamp("filed_date", { withTimezone: true }),
    assignedToMembershipId: uuid("assigned_to_membership_id").references(
      () => memberships.id,
      { onDelete: "set null" },
    ),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantClientIdx: index("tax_vat_tenant_client_idx").on(
      table.tenantId,
      table.clientId,
    ),
    tenantStatusIdx: index("tax_vat_tenant_status_idx").on(
      table.tenantId,
      table.status,
    ),
  }),
);

// ============================================================================
// V3 BANGLADESH COMPLIANCE LAYER: PHASE 26 - COMPLIANCE MASTER & CALENDAR
// ============================================================================

export const complianceTemplates = pgTable(
  "compliance_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(), // e.g., RJSC Annual Return Checklist
    category: varchar("category", { length: 100 }).notNull(), // RJSC, NBR, FRC, ICAB
    checklistData: jsonb("checklist_data").notNull(), // Standard JSON array of checklist items
    createdByMembershipId: uuid("created_by_membership_id").references(
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
    tenantCategoryIdx: index("comp_templates_tenant_category_idx").on(
      table.tenantId,
      table.category,
    ),
  }),
);

export const regulatoryCalendarEvents = pgTable(
  "regulatory_calendar_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, {
      onDelete: "cascade",
    }), // Can be null if it's a general firm deadline
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
    eventType: varchar("event_type", { length: 100 }).notNull(), // statutory_filing, tax_return, icab_deadline
    status: varchar("status", { length: 50 }).notNull().default("upcoming"), // upcoming, completed, overdue
    createdByMembershipId: uuid("created_by_membership_id").references(
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
    tenantDateIdx: index("reg_calendar_tenant_date_idx").on(
      table.tenantId,
      table.eventDate,
    ),
    tenantClientIdx: index("reg_calendar_tenant_client_idx").on(
      table.tenantId,
      table.clientId,
    ),
  }),
);

// ============================================================================
// V4 INTELLIGENCE & SCALE: PHASE 27 - AI & DOCUMENT INTELLIGENCE
// ============================================================================

export const aiDocumentAnalyses = pgTable(
  "ai_document_analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id").references(() => engagements.id, {
      onDelete: "cascade",
    }),
    documentUrl: varchar("document_url", { length: 1024 }).notNull(),
    documentType: varchar("document_type", { length: 100 }).notNull(), // invoice, bank_statement, contract
    aiAnalysisResult: jsonb("ai_analysis_result"),
    status: varchar("status", { length: 50 }).notNull().default("processing"), // processing, completed, failed
    requestedByMembershipId: uuid("requested_by_membership_id").references(
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
    tenantEngagementIdx: index("ai_doc_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
  }),
);

export const aiEngagementReviews = pgTable(
  "ai_engagement_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    reviewedByAiModel: varchar("reviewed_by_ai_model", {
      length: 100,
    }).notNull(), // gemini-1.5-pro, gpt-4
    findings: jsonb("findings"), // array of issues/suggestions
    confidenceScore: integer("confidence_score"), // 0-100
    status: varchar("status", { length: 50 }).notNull().default("processing"), // processing, completed, failed
    requestedByMembershipId: uuid("requested_by_membership_id").references(
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
    tenantEngagementIdx: index("ai_review_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
  }),
);

// ============================================================================
// V4 INTELLIGENCE & SCALE: PHASE 28 - ADVANCED ANALYTICS & FORECASTING
// ============================================================================

export const resourceAllocations = pgTable(
  "resource_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    allocatedHours: integer("allocated_hours").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantMembershipIdx: index("res_alloc_tenant_membership_idx").on(
      table.tenantId,
      table.membershipId,
    ),
    tenantEngagementIdx: index("res_alloc_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
    tenantDatesIdx: index("res_alloc_tenant_dates_idx").on(
      table.tenantId,
      table.startDate,
      table.endDate,
    ),
  }),
);

export const engagementProfitabilityMetrics = pgTable(
  "engagement_profitability_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    snapshotDate: timestamp("snapshot_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    budgetedHours: integer("budgeted_hours").notNull(),
    actualHours: integer("actual_hours").notNull(),
    estimatedRevenue: integer("estimated_revenue").notNull(), // using integer for cents/poisha
    actualCost: integer("actual_cost").notNull(),
    profitMarginPercent: integer("profit_margin_percent"), // 0-100
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantEngagementIdx: index("profitability_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
  }),
);

// ============================================================================
// V4 INTELLIGENCE & SCALE: PHASE 29 - ADVANCED HR & FINANCE
// ============================================================================

export const hrPayrollRecords = pgTable(
  "hr_payroll_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    monthYear: varchar("month_year", { length: 20 }).notNull(), // e.g., "Oct-2026"
    basicSalary: integer("basic_salary").notNull(),
    allowances: integer("allowances").notNull().default(0),
    deductions: integer("deductions").notNull().default(0),
    netPay: integer("net_pay").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, approved, paid
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantMembershipIdx: index("payroll_tenant_membership_idx").on(
      table.tenantId,
      table.membershipId,
    ),
    tenantMonthIdx: index("payroll_tenant_month_idx").on(
      table.tenantId,
      table.monthYear,
    ),
  }),
);

export const financeExpenses = pgTable(
  "finance_expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id").references(() => engagements.id, {
      onDelete: "cascade",
    }), // nullable for general firm expenses
    incurredByMembershipId: uuid("incurred_by_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    category: varchar("category", { length: 100 }).notNull(), // travel, software, meals, office_supplies
    description: text("description"),
    receiptUrl: varchar("receipt_url", { length: 1024 }),
    status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, rejected, reimbursed
    approvedByMembershipId: uuid("approved_by_membership_id").references(
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
    tenantEngagementIdx: index("expense_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
  }),
);

// ============================================================================
// V4 INTELLIGENCE & SCALE: PHASE 30 - CLIENT PORTAL & SECURE EXCHANGE
// ============================================================================

export const clientPortalUsers = pgTable(
  "client_portal_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("active"), // active, suspended
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantClientIdx: index("portal_user_tenant_client_idx").on(
      table.tenantId,
      table.clientId,
    ),
    emailUnique: uniqueIndex("portal_user_email_unique").on(table.email),
  }),
);

export const secureDocumentExchanges = pgTable(
  "secure_document_exchanges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    engagementId: uuid("engagement_id").references(() => engagements.id, {
      onDelete: "cascade",
    }),
    documentUrl: varchar("document_url", { length: 1024 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    accessLevel: varchar("access_level", { length: 50 })
      .notNull()
      .default("client_visible"), // internal_only, client_visible
    uploadedByClientUserId: uuid("uploaded_by_client_user_id").references(
      () => clientPortalUsers.id,
      { onDelete: "set null" },
    ),
    uploadedByMembershipId: uuid("uploaded_by_membership_id").references(
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
    tenantClientIdx: index("secure_doc_tenant_client_idx").on(
      table.tenantId,
      table.clientId,
    ),
    tenantEngagementIdx: index("secure_doc_tenant_engagement_idx").on(
      table.tenantId,
      table.engagementId,
    ),
  }),
);

// ============================================================================
// V4 INTELLIGENCE & SCALE: PHASE 31 - AUTOMATION & APIS
// ============================================================================

export const webhookEndpoints = pgTable(
  "webhook_endpoints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    url: varchar("url", { length: 2048 }).notNull(),
    secret: varchar("secret", { length: 255 }), // used to sign payloads
    eventTypes: jsonb("event_types").notNull().default([]), // array of strings e.g. ["engagement.created", "document.uploaded"]
    status: varchar("status", { length: 50 }).notNull().default("active"), // active, disabled
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdx: index("webhook_tenant_idx").on(table.tenantId),
  }),
);

export const workflowAutomationRules = pgTable(
  "workflow_automation_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    triggerEvent: varchar("trigger_event", { length: 100 }).notNull(), // e.g., "task.completed"
    condition: jsonb("condition"), // Optional criteria to match (e.g. { "taskType": "review" })
    actionType: varchar("action_type", { length: 100 }).notNull(), // e.g., "notify_partner", "create_next_task"
    actionPayload: jsonb("action_payload"), // Data needed for the action
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantTriggerIdx: index("workflow_rule_tenant_trigger_idx").on(
      table.tenantId,
      table.triggerEvent,
    ),
  }),
);

// ============================================================================
// V4 INTELLIGENCE & SCALE: PHASE 32 - ENTERPRISE SCALE (MULTI-OFFICE)
// ============================================================================

export const firmBranches = pgTable(
  "firm_branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(), // e.g. "Dhaka Head Office", "Chattogram Branch"
    branchCode: varchar("branch_code", { length: 50 }),
    location: text("location"),
    isHeadOffice: boolean("is_head_office").notNull().default(false),
    status: varchar("status", { length: 50 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdx: index("branch_tenant_idx").on(table.tenantId),
  }),
);

export const staffBranchAllocations = pgTable(
  "staff_branch_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => firmBranches.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").notNull().default(false), // e.g., primarily sitting in Dhaka but could have an allocation to Chattogram
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantMembershipIdx: index("branch_alloc_tenant_membership_idx").on(
      table.tenantId,
      table.membershipId,
    ),
    tenantBranchIdx: index("branch_alloc_tenant_branch_idx").on(
      table.tenantId,
      table.branchId,
    ),
  }),
);

// ============================================================================
// V5 INTERNATIONAL SAAS: PHASE 33 - INTERNATIONALIZATION & MULTI-LANGUAGE
// ============================================================================

export const supportedLocales = pgTable("supported_locales", {
  code: varchar("code", { length: 10 }).primaryKey(), // e.g., 'en', 'bn', 'ar'
  name: varchar("name", { length: 100 }).notNull(), // e.g., 'English', 'Bengali'
  nativeName: varchar("native_name", { length: 100 }), // e.g., 'বাংলা'
  isRtl: boolean("is_rtl").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tenantLocales = pgTable(
  "tenant_locales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    localeCode: varchar("locale_code", { length: 10 })
      .notNull()
      .references(() => supportedLocales.code, { onDelete: "cascade" }),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantLocaleIdx: index("tenant_locale_idx").on(
      table.tenantId,
      table.localeCode,
    ),
  }),
);

// ============================================================================
// V5 INTERNATIONAL SAAS: PHASE 34 - MULTI-COUNTRY & REGIONAL DATA
// ============================================================================

export const globalCountries = pgTable("global_countries", {
  code: varchar("code", { length: 2 }).primaryKey(), // ISO 3166-1 alpha-2 e.g. BD, US, GB
  name: varchar("name", { length: 100 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(), // e.g. BDT, USD
  callingCode: varchar("calling_code", { length: 10 }), // e.g. +880
  isActive: boolean("is_active").notNull().default(true),
});

export const tenantRegionalSettings = pgTable("tenant_regional_settings", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  countryCode: varchar("country_code", { length: 2 })
    .notNull()
    .references(() => globalCountries.code),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  timezone: varchar("timezone", { length: 50 }).notNull().default("UTC"),
  dateFormat: varchar("date_format", { length: 20 })
    .notNull()
    .default("YYYY-MM-DD"),
  financialYearStartMonth: integer("financial_year_start_month")
    .notNull()
    .default(1), // 1 = January, 7 = July
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
