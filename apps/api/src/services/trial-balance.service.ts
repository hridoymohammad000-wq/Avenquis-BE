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

const money = (value: number) => value.toFixed(2);
const asNumber = (value: string | number | null | undefined) =>
  Number(value ?? 0);
const dbMoney = (value: number) => money(value) as unknown as number;

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

    const uploaderMembership = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.id, uploaderMembershipId),
        eq(memberships.tenantId, tenantId),
      ),
    });

    if (!uploaderMembership) {
      throw new ApiError(
        403,
        "Uploader is not a member of this tenant",
        "INVALID_UPLOADER_MEMBERSHIP",
      );
    }

    const accountCodes = new Set<string>();
    for (const item of data.lineItems) {
      if (accountCodes.has(item.accountCode)) {
        throw new ApiError(
          400,
          `Duplicate account code: ${item.accountCode}`,
          "DUPLICATE_ACCOUNT_CODE",
        );
      }
      accountCodes.add(item.accountCode);
    }

    let totalDebitRaw = 0;
    let totalCreditRaw = 0;

    const formattedItems = data.lineItems.map((item) => {
      const debit = Number(item.debitAmount ?? 0);
      const credit = Number(item.creditAmount ?? 0);
      const priorYearBalance = Number(item.priorYearBalance ?? 0);
      if (![debit, credit, priorYearBalance].every(Number.isFinite)) {
        throw new ApiError(
          400,
          "Trial balance amounts must be finite numbers",
          "INVALID_AMOUNT",
        );
      }
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
        debitAmount: dbMoney(debit),
        creditAmount: dbMoney(credit),
        netBalance: dbMoney(netBalance),
        priorYearBalance: dbMoney(priorYearBalance),
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
          totalDebit: dbMoney(totalDebit),
          totalCredit: dbMoney(totalCredit),
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
        lineItems: insertedLineItems.map((item) => ({
          ...item,
          debitAmount: asNumber(item.debitAmount),
          creditAmount: asNumber(item.creditAmount),
          netBalance: asNumber(item.netBalance),
          priorYearBalance: asNumber(item.priorYearBalance),
        })),
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

    return list.map((item) => ({
      ...item,
      totalDebit: asNumber(item.totalDebit),
      totalCredit: asNumber(item.totalCredit),
    }));
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
      totalDebit: asNumber(tb.totalDebit),
      totalCredit: asNumber(tb.totalCredit),
      totalItems: lineItems.length,
      mappedCount,
      unmappedCount,
      lineItems: lineItems.map((item) => ({
        ...item,
        debitAmount: asNumber(item.debitAmount),
        creditAmount: asNumber(item.creditAmount),
        netBalance: asNumber(item.netBalance),
        priorYearBalance: asNumber(item.priorYearBalance),
      })),
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
      const requestedIds = new Set<string>();
      for (const item of mappings) {
        if (requestedIds.has(item.lineItemId)) {
          throw new ApiError(
            400,
            `Duplicate line item mapping: ${item.lineItemId}`,
            "DUPLICATE_LINE_ITEM_MAPPING",
          );
        }
        requestedIds.add(item.lineItemId);

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

      if (updatedItems.length !== mappings.length) {
        throw new ApiError(
          404,
          "One or more trial balance line items were not found",
          "LINE_ITEM_NOT_FOUND",
        );
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
      leadSchedules[key].totalDebit += asNumber(item.debitAmount);
      leadSchedules[key].totalCredit += asNumber(item.creditAmount);
      leadSchedules[key].totalNetBalance += asNumber(item.netBalance);
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
