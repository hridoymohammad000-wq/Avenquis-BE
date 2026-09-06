import {
  and,
  count,
  db,
  desc,
  eq,
  inArray,
  memberships,
  membershipRoles,
  platformAccessRequests,
  platformAuditLogs,
  platformDemoRequests,
  platformFirmOnboarding,
  platformInvoices,
  platformLeads,
  platformPlans,
  platformSubscriptions,
  platformSupportCases,
  roles,
  settings,
  tenants,
  userProfiles,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";
import { AuditService } from "./audit.service.js";
import { assertSeatAllocation } from "./platform-admin.policy.js";

export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "admin",
  "api",
  "app",
  "support",
  "status",
  "docs",
  "mail",
  "demo",
]);

export function normalizeWorkspaceSubdomain(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (
    normalized.length < 1 ||
    normalized.length > 63 ||
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(normalized) ||
    RESERVED_SUBDOMAINS.has(normalized)
  ) {
    throw new ApiError(400, "Invalid or reserved workspace subdomain", "INVALID_SUBDOMAIN");
  }
  return normalized;
}

function single<T>(rows: T[], message: string): T {
  const row = rows[0];
  if (!row) throw new ApiError(404, message, "NOT_FOUND");
  return row;
}

export class PlatformAdminService {
  static async getOverview() {
    const [firms, onboarding, provisioned, leads, demos, access, conversions, subscriptions, overdue, cancelled] =
      await Promise.all([
        db.select({ count: count() }).from(tenants).where(eq(tenants.status, "active")),
        db.select({ count: count() }).from(platformFirmOnboarding),
        db.select({ count: count() }).from(platformFirmOnboarding).where(eq(platformFirmOnboarding.provisioningState, "provisioned")),
        db.select({ count: count() }).from(platformLeads),
        db.select({ count: count() }).from(platformDemoRequests),
        db.select({ count: count() }).from(platformAccessRequests),
        db.select({ count: count() }).from(platformAccessRequests).where(eq(platformAccessRequests.status, "approved")),
        db.select({ count: count() }).from(platformSubscriptions),
        db
          .select({ count: count() })
          .from(platformInvoices)
          .where(inArray(platformInvoices.collectionState, ["overdue", "follow_up"])),
        db.select({ count: count() }).from(platformSubscriptions).where(eq(platformSubscriptions.status, "cancelled")),
      ]);

    return {
      activeFirms: firms[0]?.count ?? 0,
      onboardingFirms: onboarding[0]?.count ?? 0,
      provisionedFirms: provisioned[0]?.count ?? 0,
      leads: leads[0]?.count ?? 0,
      demoRequests: demos[0]?.count ?? 0,
      accessRequests: access[0]?.count ?? 0,
      conversions: conversions[0]?.count ?? 0,
      subscriptions: subscriptions[0]?.count ?? 0,
      overdueInvoices: overdue[0]?.count ?? 0,
      collections: overdue[0]?.count ?? 0,
      mrr: null,
      arr: null,
      churnIndicators: { cancelledSubscriptions: cancelled[0]?.count ?? 0 },
    };
  }

  static async listFirms() {
    return db
      .select({
        id: platformFirmOnboarding.id,
        tenantId: platformFirmOnboarding.tenantId,
        legalName: platformFirmOnboarding.legalName,
        displayName: platformFirmOnboarding.displayName,
        workspaceSubdomain: platformFirmOnboarding.workspaceSubdomain,
        ownerUserId: platformFirmOnboarding.ownerUserId,
        planCode: platformPlans.code,
        planName: platformPlans.displayName,
        seatLimit: platformFirmOnboarding.seatLimit,
        onboardingState: platformFirmOnboarding.onboardingState,
        provisioningState: platformFirmOnboarding.provisioningState,
        activationState: platformFirmOnboarding.activationState,
        billingState: platformFirmOnboarding.billingState,
        tenantStatus: tenants.status,
        createdAt: platformFirmOnboarding.createdAt,
      })
      .from(platformFirmOnboarding)
      .innerJoin(tenants, eq(platformFirmOnboarding.tenantId, tenants.id))
      .leftJoin(platformPlans, eq(platformFirmOnboarding.planId, platformPlans.id))
      .orderBy(desc(platformFirmOnboarding.createdAt));
  }

  static async getFirm(id: string) {
    return single(
      await db
        .select()
        .from(platformFirmOnboarding)
        .where(eq(platformFirmOnboarding.id, id)),
      "Firm onboarding record not found",
    );
  }

  static async createFirm(input: {
    legalName: string;
    displayName: string;
    workspaceSubdomain: string;
    ownerUserId?: string;
    planCode: string;
    actorUserId: string;
    actorRole: string;
    requestId: string;
  }) {
    const subdomain = normalizeWorkspaceSubdomain(input.workspaceSubdomain);
    return db.transaction(async (tx) => {
      const plan = single(
        await tx.select().from(platformPlans).where(eq(platformPlans.code, input.planCode)),
        "Plan not found",
      );
      const existing = await tx
        .select({ id: platformFirmOnboarding.id })
        .from(platformFirmOnboarding)
        .where(eq(platformFirmOnboarding.workspaceSubdomain, subdomain));
      if (existing.length > 0) {
        throw new ApiError(409, "Workspace subdomain already exists", "SUBDOMAIN_EXISTS");
      }
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: input.displayName, slug: subdomain, status: "pending" })
        .returning();
      const [firm] = await tx
        .insert(platformFirmOnboarding)
        .values({
          tenantId: tenant.id,
          legalName: input.legalName,
          displayName: input.displayName,
          workspaceSubdomain: subdomain,
          ownerUserId: input.ownerUserId ?? null,
          planId: plan.id,
          seatLimit: plan.proprietorSeats + plan.studentSeats,
        })
        .returning();
      await AuditService.logPlatformAction({
        actorUserId: input.actorUserId,
        platformRole: input.actorRole,
        action: "FIRM_ONBOARDING_CREATED",
        targetType: "platform_firm_onboarding",
        targetId: firm.id,
        afterMetadata: { planCode: plan.code, workspaceSubdomain: subdomain },
        requestId: input.requestId,
      });
      return firm;
    });
  }

  static async updateFirm(
    id: string,
    input: { onboardingState?: "pending_approval" | "approved" | "rejected"; billingState?: string },
    audit: { actorUserId: string; actorRole: string; requestId: string },
  ) {
    const existing = await this.getFirm(id);
    const [updated] = await db
      .update(platformFirmOnboarding)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(platformFirmOnboarding.id, id))
      .returning();
    await AuditService.logPlatformAction({
      actorUserId: audit.actorUserId,
      platformRole: audit.actorRole,
      requestId: audit.requestId,
      action: "FIRM_ONBOARDING_UPDATED",
      targetType: "platform_firm_onboarding",
      targetId: id,
      beforeMetadata: { onboardingState: existing.onboardingState, billingState: existing.billingState },
      afterMetadata: { onboardingState: updated.onboardingState, billingState: updated.billingState },
    });
    return updated;
  }

  static async provisionFirm(
    id: string,
    audit: { actorUserId: string; actorRole: string; requestId: string },
  ) {
    return db.transaction(async (tx) => {
      const firm = single(
        await tx.select().from(platformFirmOnboarding).where(eq(platformFirmOnboarding.id, id)),
        "Firm onboarding record not found",
      );
      if (firm.onboardingState !== "approved") {
        throw new ApiError(409, "Firm requires approval before provisioning", "FIRM_NOT_APPROVED");
      }
      if (firm.provisioningState === "provisioned") return firm;
      const plan = firm.planId
        ? single(await tx.select().from(platformPlans).where(eq(platformPlans.id, firm.planId)), "Plan not found")
        : null;
      if (!plan || !firm.ownerUserId) {
        throw new ApiError(409, "Owner and plan are required before provisioning", "PROVISIONING_INPUT_REQUIRED");
      }
      assertSeatAllocation(
        plan,
        { proprietorSeats: plan.proprietorSeats > 0 ? 1 : 0, studentSeats: 0 },
      );
      const owner = single(
        await tx.select({ id: userProfiles.id }).from(userProfiles).where(eq(userProfiles.id, firm.ownerUserId)),
        "Firm owner not found",
      );
      const existingMembership = await tx
        .select({ id: memberships.id })
        .from(memberships)
        .where(and(eq(memberships.tenantId, firm.tenantId), eq(memberships.userId, owner.id)));
      let ownerMembershipId = existingMembership[0]?.id;
      if (existingMembership.length === 0) {
        const [membership] = await tx.insert(memberships).values({ tenantId: firm.tenantId, userId: owner.id, status: "active" }).returning({ id: memberships.id });
        ownerMembershipId = membership.id;
      }
      let ownerRole = (await tx.select({ id: roles.id }).from(roles).where(and(eq(roles.tenantId, firm.tenantId), eq(roles.code, "owner"))))[0];
      if (!ownerRole) {
        [ownerRole] = await tx.insert(roles).values({ tenantId: firm.tenantId, code: "owner", name: "Firm Owner", description: "Firm owner role", isSystem: true }).returning({ id: roles.id });
      }
      await tx.insert(membershipRoles).values({ membershipId: ownerMembershipId, roleId: ownerRole.id }).onConflictDoNothing();
      const [updated] = await tx
        .update(platformFirmOnboarding)
        .set({ provisioningState: "provisioned", activationState: "pending_activation", updatedAt: new Date() })
        .where(eq(platformFirmOnboarding.id, id))
        .returning();
      await AuditService.logPlatformAction({
        actorUserId: audit.actorUserId,
        platformRole: audit.actorRole,
        requestId: audit.requestId,
        action: "FIRM_PROVISIONED",
        targetType: "platform_firm_onboarding",
        targetId: id,
        afterMetadata: { planCode: plan.code, seatLimit: plan.proprietorSeats + plan.studentSeats },
      });
      return updated;
    });
  }

  static async createLead(input: {
    email: string; contactName: string; companyName?: string; phone?: string;
    source?: string; notes?: string; actorUserId: string; actorRole: string; requestId: string;
  }) {
    const [lead] = await db.insert(platformLeads).values({
      email: input.email, contactName: input.contactName, companyName: input.companyName ?? null,
      phone: input.phone ?? null, source: input.source ?? null, notes: input.notes ?? null,
    }).returning();
    await AuditService.logPlatformAction({ actorUserId: input.actorUserId, platformRole: input.actorRole, action: "LEAD_CREATED", targetType: "platform_lead", targetId: lead.id, requestId: input.requestId });
    return lead;
  }

  static async createDemoRequest(input: {
    email: string; contactName: string; source?: string; notes?: string;
    actorUserId: string; actorRole: string; requestId: string;
  }) {
    const [request] = await db.insert(platformDemoRequests).values({
      email: input.email, contactName: input.contactName, source: input.source ?? null, notes: input.notes ?? null,
    }).returning();
    await AuditService.logPlatformAction({ actorUserId: input.actorUserId, platformRole: input.actorRole, action: "DEMO_REQUEST_CREATED", targetType: "platform_demo_request", targetId: request.id, requestId: input.requestId });
    return request;
  }

  static async createAccessRequest(input: {
    email: string; requestedFirmName: string; requestedPlanCode?: string; source?: string; notes?: string;
    actorUserId: string; actorRole: string; requestId: string;
  }) {
    const [request] = await db.insert(platformAccessRequests).values({
      email: input.email, requestedFirmName: input.requestedFirmName, requestedPlanCode: input.requestedPlanCode ?? null,
      source: input.source ?? null, notes: input.notes ?? null,
    }).returning();
    await AuditService.logPlatformAction({ actorUserId: input.actorUserId, platformRole: input.actorRole, action: "ACCESS_REQUEST_CREATED", targetType: "platform_access_request", targetId: request.id, requestId: input.requestId });
    return request;
  }

  static async listLeads() { return db.select().from(platformLeads).orderBy(desc(platformLeads.createdAt)); }
  static async listDemoRequests() { return db.select().from(platformDemoRequests).orderBy(desc(platformDemoRequests.createdAt)); }
  static async listAccessRequests() { return db.select().from(platformAccessRequests).orderBy(desc(platformAccessRequests.createdAt)); }
  static async listPlans() { return db.select().from(platformPlans).where(eq(platformPlans.isActive, true)); }
  static async listSubscriptions() { return db.select().from(platformSubscriptions).orderBy(desc(platformSubscriptions.createdAt)); }
  static async listInvoices() { return db.select().from(platformInvoices).orderBy(desc(platformInvoices.dueDate)); }
  static async listCollections() {
    return db.select().from(platformInvoices).where(inArray(platformInvoices.collectionState, ["overdue", "follow_up"])).orderBy(desc(platformInvoices.dueDate));
  }
  static async getGrowth() {
    const overview = await this.getOverview();
    return { leads: overview.leads, demoRequests: overview.demoRequests, accessRequests: overview.accessRequests, conversions: overview.conversions, mrr: overview.mrr, arr: overview.arr, churnIndicators: overview.churnIndicators };
  }
  static async listSupportCases() { return db.select().from(platformSupportCases).orderBy(desc(platformSupportCases.createdAt)); }
  static async getSupportCase(id: string) { return single(await db.select().from(platformSupportCases).where(eq(platformSupportCases.id, id)), "Support case not found"); }
  static async listSettings() {
    const rows = await db.select().from(settings);
    return rows.map((setting) => ({ ...setting, value: /(secret|token|password|private|key)/i.test(setting.key) ? { redacted: true } : setting.value }));
  }
  static async listAuditLogs() { return db.select().from(platformAuditLogs).orderBy(desc(platformAuditLogs.createdAt)); }
}
