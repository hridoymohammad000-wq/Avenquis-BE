import {
  db,
  trialBalances,
  tbLineItems,
  engagements,
  memberships,
  userProfiles,
  eq,
  and,
  desc,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class TrialBalanceService {
  static async importTrialBalance(
    tenantId: string,
    uploaderMembershipId: string,
    data: {
      engagementId: string;
      name: string;
      asOfDate: Date;
      currency?: string;
      lineItems: Array<{
        accountCode: string;
        accountName: string;
        debitAmount?: number;
        creditAmount?: number;
        priorYearBalance?: number;
        mappedFinancialStatementGroup?: string;
        mappedLeadSchedule?: string;
      }>;
    },
  ) {
    const engagement = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.tenantId, tenantId),
        eq(engagements.id, data.engagementId),
      ),
    });

    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }

    if (!data.lineItems || data.lineItems.length === 0) {
      throw new ApiError(
        400,
        "Trial balance must contain at least 1 line item",
        "EMPTY_LINE_ITEMS",
      );
    }

    let totalDebitRaw = 0;
    let totalCreditRaw = 0;

    const formattedItems = data.lineItems.map((item) => {
      const debit = Number(item.debitAmount ?? 0);
      const credit = Number(item.creditAmount ?? 0);
      totalDebitRaw += debit;
      totalCreditRaw += credit;
      const netBalance = Math.round((debit - credit) * 100) / 100;
      const isMapped = Boolean(
        item.mappedFinancialStatementGroup && item.mappedLeadSchedule,
      );

      return {
        tenantId,
        accountCode: item.accountCode,
        accountName: item.accountName,
        debitAmount: debit,
        creditAmount: credit,
        netBalance,
        priorYearBalance: item.priorYearBalance ?? 0,
        mappedFinancialStatementGroup: item.mappedFinancialStatementGroup,
        mappedLeadSchedule: item.mappedLeadSchedule,
        isMapped,
      };
    });

    const totalDebit = Math.round(totalDebitRaw * 100) / 100;
    const totalCredit = Math.round(totalCreditRaw * 100) / 100;
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

    return await db.transaction(async (tx) => {
      const [tb] = await tx
        .insert(trialBalances)
        .values({
          tenantId,
          engagementId: data.engagementId,
          name: data.name,
          asOfDate: data.asOfDate,
          currency: data.currency ?? "BDT",
          totalDebit,
          totalCredit,
          isBalanced,
          uploadedByMembershipId: uploaderMembershipId,
        })
        .returning();

      const itemsToInsert = formattedItems.map((item) => ({
        ...item,
        trialBalanceId: tb.id,
      }));

      const insertedLineItems = await tx
        .insert(tbLineItems)
        .values(itemsToInsert)
        .returning();

      return {
        ...tb,
        lineItemsCount: insertedLineItems.length,
        lineItems: insertedLineItems,
      };
    });
  }

  static async listTrialBalances(tenantId: string, engagementId: string) {
    const list = await db
      .select({
        id: trialBalances.id,
        tenantId: trialBalances.tenantId,
        engagementId: trialBalances.engagementId,
        name: trialBalances.name,
        asOfDate: trialBalances.asOfDate,
        currency: trialBalances.currency,
        totalDebit: trialBalances.totalDebit,
        totalCredit: trialBalances.totalCredit,
        isBalanced: trialBalances.isBalanced,
        uploadedByMembershipId: trialBalances.uploadedByMembershipId,
        uploaderName: userProfiles.fullName,
        createdAt: trialBalances.createdAt,
      })
      .from(trialBalances)
      .innerJoin(
        memberships,
        eq(trialBalances.uploadedByMembershipId, memberships.id),
      )
      .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
      .where(
        and(
          eq(trialBalances.tenantId, tenantId),
          eq(trialBalances.engagementId, engagementId),
        ),
      )
      .orderBy(desc(trialBalances.createdAt));

    return list;
  }

  static async getTrialBalanceDetails(
    tenantId: string,
    trialBalanceId: string,
  ) {
    const tb = await db.query.trialBalances.findFirst({
      where: and(
        eq(trialBalances.tenantId, tenantId),
        eq(trialBalances.id, trialBalanceId),
      ),
    });

    if (!tb) {
      throw new ApiError(
        404,
        "Trial balance not found",
        "TRIAL_BALANCE_NOT_FOUND",
      );
    }

    const lineItems = await db
      .select()
      .from(tbLineItems)
      .where(
        and(
          eq(tbLineItems.tenantId, tenantId),
          eq(tbLineItems.trialBalanceId, trialBalanceId),
        ),
      )
      .orderBy(tbLineItems.accountCode);

    const mappedCount = lineItems.filter((i) => i.isMapped).length;
    const unmappedCount = lineItems.length - mappedCount;

    return {
      ...tb,
      totalItems: lineItems.length,
      mappedCount,
      unmappedCount,
      lineItems,
    };
  }

  static async mapTbLineItems(
    tenantId: string,
    trialBalanceId: string,
    mappings: Array<{
      lineItemId: string;
      mappedFinancialStatementGroup: string;
      mappedLeadSchedule: string;
    }>,
  ) {
    const tb = await db.query.trialBalances.findFirst({
      where: and(
        eq(trialBalances.tenantId, tenantId),
        eq(trialBalances.id, trialBalanceId),
      ),
    });

    if (!tb) {
      throw new ApiError(
        404,
        "Trial balance not found",
        "TRIAL_BALANCE_NOT_FOUND",
      );
    }

    return await db.transaction(async (tx) => {
      const updatedItems = [];
      for (const item of mappings) {
        const [updated] = await tx
          .update(tbLineItems)
          .set({
            mappedFinancialStatementGroup: item.mappedFinancialStatementGroup,
            mappedLeadSchedule: item.mappedLeadSchedule,
            isMapped: true,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(tbLineItems.tenantId, tenantId),
              eq(tbLineItems.trialBalanceId, trialBalanceId),
              eq(tbLineItems.id, item.lineItemId),
            ),
          )
          .returning();

        if (updated) {
          updatedItems.push(updated);
        }
      }
      return updatedItems;
    });
  }

  static async getLeadScheduleSummary(
    tenantId: string,
    trialBalanceId: string,
  ) {
    const tb = await db.query.trialBalances.findFirst({
      where: and(
        eq(trialBalances.tenantId, tenantId),
        eq(trialBalances.id, trialBalanceId),
      ),
    });

    if (!tb) {
      throw new ApiError(
        404,
        "Trial balance not found",
        "TRIAL_BALANCE_NOT_FOUND",
      );
    }

    const lineItems = await db
      .select()
      .from(tbLineItems)
      .where(
        and(
          eq(tbLineItems.tenantId, tenantId),
          eq(tbLineItems.trialBalanceId, trialBalanceId),
        ),
      );

    const leadSchedules: Record<
      string,
      {
        leadSchedule: string;
        fsGroup: string;
        itemCount: number;
        totalDebit: number;
        totalCredit: number;
        totalNetBalance: number;
      }
    > = {};

    for (const item of lineItems) {
      const key = item.mappedLeadSchedule ?? "unmapped";
      if (!leadSchedules[key]) {
        leadSchedules[key] = {
          leadSchedule: key,
          fsGroup: item.mappedFinancialStatementGroup ?? "unmapped",
          itemCount: 0,
          totalDebit: 0,
          totalCredit: 0,
          totalNetBalance: 0,
        };
      }
      leadSchedules[key].itemCount += 1;
      leadSchedules[key].totalDebit += item.debitAmount;
      leadSchedules[key].totalCredit += item.creditAmount;
      leadSchedules[key].totalNetBalance += item.netBalance;
    }

    return {
      trialBalanceId: tb.id,
      trialBalanceName: tb.name,
      asOfDate: tb.asOfDate,
      isBalanced: tb.isBalanced,
      schedules: Object.values(leadSchedules),
    };
  }
}
