import {
  db,
  engagements,
  engagementTeamMembers,
  engagementIndependenceDeclarations,
  clients,
  memberships,
  userProfiles,
} from "@avenquis/database";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import { ApiError } from "../errors/api-error.js";

export class EngagementService {
  static async listEngagements(
    tenantId: string,
    options?: {
      clientId?: string;
      status?: string;
      engagementType?: string;
      search?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const conditions = [eq(engagements.tenantId, tenantId)];

    if (options?.clientId) {
      conditions.push(eq(engagements.clientId, options.clientId));
    }
    if (options?.status) {
      conditions.push(eq(engagements.status, options.status));
    }
    if (options?.engagementType) {
      conditions.push(eq(engagements.engagementType, options.engagementType));
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      const condOr = or(
        ilike(engagements.title, searchPattern),
        ilike(engagements.engagementCode, searchPattern),
        ilike(engagements.financialYear, searchPattern),
      );
      if (condOr) conditions.push(condOr);
    }

    const rows = await db
      .select({
        id: engagements.id,
        tenantId: engagements.tenantId,
        clientId: engagements.clientId,
        clientName: clients.name,
        clientCode: clients.clientCode,
        engagementCode: engagements.engagementCode,
        title: engagements.title,
        engagementType: engagements.engagementType,
        financialYear: engagements.financialYear,
        startDate: engagements.startDate,
        endDate: engagements.endDate,
        budgetedHours: engagements.budgetedHours,
        budgetedFee: engagements.budgetedFee,
        currency: engagements.currency,
        status: engagements.status,
        independenceCleared: engagements.independenceCleared,
        createdAt: engagements.createdAt,
      })
      .from(engagements)
      .innerJoin(clients, eq(engagements.clientId, clients.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(engagements.createdAt));

    return rows;
  }

  static async createEngagement(
    tenantId: string,
    data: {
      clientId: string;
      engagementCode: string;
      title: string;
      engagementType: string;
      financialYear: string;
      startDate: Date;
      endDate?: Date;
      budgetedHours?: number;
      budgetedFee?: number;
      currency?: string;
      engagementPartnerMembershipId?: string;
      engagementManagerMembershipId?: string;
      auditQualityReviewerMembershipId?: string;
    },
  ) {
    // 1. Verify client exists in tenant
    const client = await db.query.clients.findFirst({
      where: and(eq(clients.tenantId, tenantId), eq(clients.id, data.clientId)),
    });

    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }

    // 2. Verify unique engagementCode per tenant
    const existing = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.tenantId, tenantId),
        eq(engagements.engagementCode, data.engagementCode),
      ),
    });

    if (existing) {
      throw new ApiError(
        409,
        `Engagement code '${data.engagementCode}' already exists in this tenant`,
        "ENGAGEMENT_CODE_EXISTS",
      );
    }

    // 3. Create engagement
    const [engagement] = await db
      .insert(engagements)
      .values({
        tenantId,
        clientId: data.clientId,
        engagementCode: data.engagementCode,
        title: data.title,
        engagementType: data.engagementType,
        financialYear: data.financialYear,
        startDate: data.startDate,
        endDate: data.endDate,
        budgetedHours: data.budgetedHours ?? 0,
        budgetedFee: data.budgetedFee ?? 0,
        currency: data.currency ?? "BDT",
        status: "planning",
        engagementPartnerMembershipId: data.engagementPartnerMembershipId,
        engagementManagerMembershipId: data.engagementManagerMembershipId,
        auditQualityReviewerMembershipId: data.auditQualityReviewerMembershipId,
        independenceCleared: false,
      })
      .returning();

    return engagement;
  }

  static async getEngagementById(tenantId: string, engagementId: string) {
    const engagement = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.tenantId, tenantId),
        eq(engagements.id, engagementId),
      ),
    });

    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }

    // Fetch client summary
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, engagement.clientId),
    });

    // Fetch team members with user details
    const teamMembers = await db
      .select({
        id: engagementTeamMembers.id,
        membershipId: engagementTeamMembers.membershipId,
        role: engagementTeamMembers.role,
        allocatedHours: engagementTeamMembers.allocatedHours,
        startDate: engagementTeamMembers.startDate,
        endDate: engagementTeamMembers.endDate,
        fullName: userProfiles.fullName,
        email: userProfiles.email,
      })
      .from(engagementTeamMembers)
      .innerJoin(
        memberships,
        eq(engagementTeamMembers.membershipId, memberships.id),
      )
      .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
      .where(
        and(
          eq(engagementTeamMembers.tenantId, tenantId),
          eq(engagementTeamMembers.engagementId, engagementId),
        ),
      );

    // Fetch independence declarations
    const independenceDeclarations = await db
      .select({
        id: engagementIndependenceDeclarations.id,
        membershipId: engagementIndependenceDeclarations.membershipId,
        declarationStatus: engagementIndependenceDeclarations.declarationStatus,
        hasFinancialInterest:
          engagementIndependenceDeclarations.hasFinancialInterest,
        hasPersonalRelationship:
          engagementIndependenceDeclarations.hasPersonalRelationship,
        remarks: engagementIndependenceDeclarations.remarks,
        clearedAt: engagementIndependenceDeclarations.clearedAt,
        fullName: userProfiles.fullName,
      })
      .from(engagementIndependenceDeclarations)
      .innerJoin(
        memberships,
        eq(engagementIndependenceDeclarations.membershipId, memberships.id),
      )
      .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
      .where(
        and(
          eq(engagementIndependenceDeclarations.tenantId, tenantId),
          eq(engagementIndependenceDeclarations.engagementId, engagementId),
        ),
      );

    return {
      ...engagement,
      client,
      teamMembers,
      independenceDeclarations,
    };
  }

  static async updateEngagementStatus(
    tenantId: string,
    engagementId: string,
    status:
      | "planning"
      | "fieldwork"
      | "review"
      | "partner_signoff"
      | "completed"
      | "archived",
  ) {
    const engagement = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.tenantId, tenantId),
        eq(engagements.id, engagementId),
      ),
    });

    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }

    const [updated] = await db
      .update(engagements)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(engagements.tenantId, tenantId),
          eq(engagements.id, engagementId),
        ),
      )
      .returning();

    return updated;
  }

  static async assignTeamMember(
    tenantId: string,
    engagementId: string,
    data: {
      membershipId: string;
      role: string;
      allocatedHours?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const engagement = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.tenantId, tenantId),
        eq(engagements.id, engagementId),
      ),
    });

    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }

    // Upsert team member
    const existing = await db.query.engagementTeamMembers.findFirst({
      where: and(
        eq(engagementTeamMembers.tenantId, tenantId),
        eq(engagementTeamMembers.engagementId, engagementId),
        eq(engagementTeamMembers.membershipId, data.membershipId),
      ),
    });

    let member;
    if (existing) {
      [member] = await db
        .update(engagementTeamMembers)
        .set({
          role: data.role,
          allocatedHours: data.allocatedHours ?? existing.allocatedHours,
          startDate: data.startDate ?? existing.startDate,
          endDate: data.endDate ?? existing.endDate,
          updatedAt: new Date(),
        })
        .where(eq(engagementTeamMembers.id, existing.id))
        .returning();
    } else {
      [member] = await db
        .insert(engagementTeamMembers)
        .values({
          tenantId,
          engagementId,
          membershipId: data.membershipId,
          role: data.role,
          allocatedHours: data.allocatedHours ?? 0,
          startDate: data.startDate,
          endDate: data.endDate,
        })
        .returning();
    }

    return member;
  }

  static async removeTeamMember(
    tenantId: string,
    engagementId: string,
    membershipId: string,
  ) {
    const existing = await db.query.engagementTeamMembers.findFirst({
      where: and(
        eq(engagementTeamMembers.tenantId, tenantId),
        eq(engagementTeamMembers.engagementId, engagementId),
        eq(engagementTeamMembers.membershipId, membershipId),
      ),
    });

    if (!existing) {
      throw new ApiError(
        404,
        "Team member assignment not found",
        "TEAM_MEMBER_NOT_FOUND",
      );
    }

    await db
      .delete(engagementTeamMembers)
      .where(eq(engagementTeamMembers.id, existing.id));

    return { success: true };
  }

  static async submitIndependenceDeclaration(
    tenantId: string,
    engagementId: string,
    membershipId: string,
    data: {
      hasFinancialInterest: boolean;
      hasPersonalRelationship: boolean;
      remarks?: string;
    },
  ) {
    const engagement = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.tenantId, tenantId),
        eq(engagements.id, engagementId),
      ),
    });

    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }

    const hasConflict =
      data.hasFinancialInterest || data.hasPersonalRelationship;
    const declarationStatus = hasConflict ? "conflict_flagged" : "cleared";

    const existing =
      await db.query.engagementIndependenceDeclarations.findFirst({
        where: and(
          eq(engagementIndependenceDeclarations.tenantId, tenantId),
          eq(engagementIndependenceDeclarations.engagementId, engagementId),
          eq(engagementIndependenceDeclarations.membershipId, membershipId),
        ),
      });

    let declaration;
    if (existing) {
      [declaration] = await db
        .update(engagementIndependenceDeclarations)
        .set({
          declarationStatus,
          hasFinancialInterest: data.hasFinancialInterest,
          hasPersonalRelationship: data.hasPersonalRelationship,
          remarks: data.remarks,
          clearedAt: hasConflict ? null : new Date(),
          updatedAt: new Date(),
        })
        .where(eq(engagementIndependenceDeclarations.id, existing.id))
        .returning();
    } else {
      [declaration] = await db
        .insert(engagementIndependenceDeclarations)
        .values({
          tenantId,
          engagementId,
          membershipId,
          declarationStatus,
          hasFinancialInterest: data.hasFinancialInterest,
          hasPersonalRelationship: data.hasPersonalRelationship,
          remarks: data.remarks,
          clearedAt: hasConflict ? null : new Date(),
        })
        .returning();
    }

    // Check overall engagement independence status
    const allDeclarations = await db
      .select()
      .from(engagementIndependenceDeclarations)
      .where(
        and(
          eq(engagementIndependenceDeclarations.tenantId, tenantId),
          eq(engagementIndependenceDeclarations.engagementId, engagementId),
        ),
      );

    // Cleared if at least 1 declaration exists, all declarations are "cleared", and no conflicts exist
    const hasDeclarations = allDeclarations.length > 0;
    const allCleared =
      hasDeclarations &&
      allDeclarations.every((d) => d.declarationStatus === "cleared");

    await db
      .update(engagements)
      .set({
        independenceCleared: allCleared,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(engagements.tenantId, tenantId),
          eq(engagements.id, engagementId),
        ),
      );

    return declaration;
  }
}
