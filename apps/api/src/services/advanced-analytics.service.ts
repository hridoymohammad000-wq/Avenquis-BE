import {
  db,
  resourceAllocations,
  engagementProfitabilityMetrics,
  eq,
  and,
} from "@avenquis/database";

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
