import {
  db,
  hrPayrollRecords,
  financeExpenses,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class HrFinanceService {
  // ──────────── HR PAYROLL ────────────
  static async createPayrollRecord(
    tenantId: string,
    data: {
      membershipId: string;
      monthYear: string;
      basicSalary: number;
      allowances?: number;
      deductions?: number;
    },
  ) {
    const allowances = data.allowances || 0;
    const deductions = data.deductions || 0;
    const netPay = data.basicSalary + allowances - deductions;

    const [record] = await db
      .insert(hrPayrollRecords)
      .values({
        tenantId,
        membershipId: data.membershipId,
        monthYear: data.monthYear,
        basicSalary: data.basicSalary,
        allowances,
        deductions,
        netPay,
        status: "draft",
      })
      .returning();

    return record;
  }

  static async getPayrollRecords(tenantId: string, membershipId?: string) {
    const filters = [eq(hrPayrollRecords.tenantId, tenantId)];
    if (membershipId) {
      filters.push(eq(hrPayrollRecords.membershipId, membershipId));
    }

    return db
      .select()
      .from(hrPayrollRecords)
      .where(and(...filters))
      .orderBy(hrPayrollRecords.createdAt);
  }

  // ──────────── FINANCE EXPENSES ────────────
  static async logExpense(
    tenantId: string,
    incurredByMembershipId: string,
    data: {
      engagementId?: string;
      amount: number;
      category: string;
      description?: string;
      receiptUrl?: string;
    },
  ) {
    const [expense] = await db
      .insert(financeExpenses)
      .values({
        tenantId,
        incurredByMembershipId,
        engagementId: data.engagementId,
        amount: data.amount,
        category: data.category,
        description: data.description,
        receiptUrl: data.receiptUrl,
        status: "pending",
      })
      .returning();

    return expense;
  }

  static async getExpenses(tenantId: string, engagementId?: string) {
    const filters = [eq(financeExpenses.tenantId, tenantId)];
    if (engagementId) {
      filters.push(eq(financeExpenses.engagementId, engagementId));
    }

    return db
      .select()
      .from(financeExpenses)
      .where(and(...filters))
      .orderBy(financeExpenses.createdAt);
  }
}
