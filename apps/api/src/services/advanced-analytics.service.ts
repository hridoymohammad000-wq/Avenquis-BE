import {
  db,
  resourceAllocations,
  engagementProfitabilityMetrics,
  memberships,
  engagements,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class AdvancedAnalyticsService {
  // ──────────── WORKLOAD & RESOURCE PLANNING ────────────
  static async allocateResource(
    tenantId: string,
    data: {
      membershipId: string;
      engagementId: string;
      allocatedHours: number;
      startDate: string;
      endDate: string;
      notes?: string;
    },
  ) {
    const [member, engagement] = await Promise.all([
      db.query.memberships.findFirst({
        where: and(
          eq(memberships.id, data.membershipId),
          eq(memberships.tenantId, tenantId),
        ),
      }),
      db.query.engagements.findFirst({
        where: and(
          eq(engagements.id, data.engagementId),
          eq(engagements.tenantId, tenantId),
        ),
      }),
    ]);
    if (!member)
      throw new ApiError(
        400,
        "Member is not part of this tenant",
        "INVALID_MEMBERSHIP",
      );
    if (!engagement)
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    if (new Date(data.endDate) < new Date(data.startDate))
      throw new ApiError(
        400,
        "End date must be after start date",
        "INVALID_DATE_RANGE",
      );

    const [allocation] = await db
      .insert(resourceAllocations)
      .values({
        tenantId,
        membershipId: data.membershipId,
        engagementId: data.engagementId,
        allocatedHours: data.allocatedHours,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        notes: data.notes,
      })
      .returning();

    return allocation;
  }

  static async getStaffWorkload(tenantId: string, membershipId: string) {
    return db
      .select()
      .from(resourceAllocations)
      .where(
        and(
          eq(resourceAllocations.tenantId, tenantId),
          eq(resourceAllocations.membershipId, membershipId),
        ),
      );
  }

  // ──────────── PROFITABILITY ────────────
  static async recordProfitabilitySnapshot(
    tenantId: string,
    data: {
      engagementId: string;
      budgetedHours: number;
      actualHours: number;
      estimatedRevenue: number;
      actualCost: number;
    },
  ) {
    const engagement = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.id, data.engagementId),
        eq(engagements.tenantId, tenantId),
      ),
    });
    if (!engagement)
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");

    // Calculate profit margin: (Revenue - Cost) / Revenue * 100
    let margin = 0;
    if (data.estimatedRevenue > 0) {
      const rawMargin =
        ((data.estimatedRevenue - data.actualCost) / data.estimatedRevenue) *
        100;
      margin = Math.round(rawMargin * 100) / 100;
    }

    const [snapshot] = await db
      .insert(engagementProfitabilityMetrics)
      .values({
        tenantId,
        engagementId: data.engagementId,
        budgetedHours: data.budgetedHours,
        actualHours: data.actualHours,
        estimatedRevenue: data.estimatedRevenue,
        actualCost: data.actualCost,
        profitMarginPercent: margin,
      })
      .returning();

    return snapshot;
  }

  static async getEngagementProfitability(
    tenantId: string,
    engagementId: string,
  ) {
    return db
      .select()
      .from(engagementProfitabilityMetrics)
      .where(
        and(
          eq(engagementProfitabilityMetrics.tenantId, tenantId),
          eq(engagementProfitabilityMetrics.engagementId, engagementId),
        ),
      );
  }
}
