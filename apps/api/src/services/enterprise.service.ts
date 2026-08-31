import {
  db,
  firmBranches,
  staffBranchAllocations,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class EnterpriseService {
  // ──────────── FIRM BRANCHES ────────────
  static async createBranch(
    tenantId: string,
    data: {
      name: string;
      branchCode?: string;
      location?: string;
      isHeadOffice?: boolean;
    },
  ) {
    const [branch] = await db
      .insert(firmBranches)
      .values({
        tenantId,
        name: data.name,
        branchCode: data.branchCode,
        location: data.location,
        isHeadOffice: data.isHeadOffice || false,
        status: "active",
      })
      .returning();

    return branch;
  }

  static async getBranches(tenantId: string) {
    return db
      .select()
      .from(firmBranches)
      .where(eq(firmBranches.tenantId, tenantId))
      .orderBy(firmBranches.name);
  }

  // ──────────── STAFF BRANCH ALLOCATIONS ────────────
  static async allocateStaffToBranch(
    tenantId: string,
    data: {
      membershipId: string;
      branchId: string;
      isPrimary?: boolean;
    },
  ) {
    const [allocation] = await db
      .insert(staffBranchAllocations)
      .values({
        tenantId,
        membershipId: data.membershipId,
        branchId: data.branchId,
        isPrimary: data.isPrimary || false,
      })
      .returning();

    return allocation;
  }

  static async getStaffBranches(tenantId: string, membershipId: string) {
    return db
      .select()
      .from(staffBranchAllocations)
      .where(
        and(
          eq(staffBranchAllocations.tenantId, tenantId),
          eq(staffBranchAllocations.membershipId, membershipId),
        ),
      );
  }
}
