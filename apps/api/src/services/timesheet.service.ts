import {
  db,
  timesheetEntries,
  engagements,
  tasks,
  memberships,
  userProfiles,
} from "@avenquis/database";
import { eq, and, desc } from "drizzle-orm";
import { ApiError } from "../errors/api-error.js";

export class TimesheetService {
  static async listTimesheets(
    tenantId: string,
    options?: {
      membershipId?: string;
      engagementId?: string;
      status?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const conditions = [eq(timesheetEntries.tenantId, tenantId)];

    if (options?.membershipId) {
      conditions.push(eq(timesheetEntries.membershipId, options.membershipId));
    }
    if (options?.engagementId) {
      conditions.push(eq(timesheetEntries.engagementId, options.engagementId));
    }
    if (options?.status) {
      conditions.push(eq(timesheetEntries.status, options.status));
    }

    const rows = await db
      .select({
        id: timesheetEntries.id,
        tenantId: timesheetEntries.tenantId,
        membershipId: timesheetEntries.membershipId,
        staffName: userProfiles.fullName,
        engagementId: timesheetEntries.engagementId,
        engagementTitle: engagements.title,
        taskId: timesheetEntries.taskId,
        workDate: timesheetEntries.workDate,
        hours: timesheetEntries.hours,
        activityType: timesheetEntries.activityType,
        description: timesheetEntries.description,
        status: timesheetEntries.status,
        createdAt: timesheetEntries.createdAt,
      })
      .from(timesheetEntries)
      .innerJoin(memberships, eq(timesheetEntries.membershipId, memberships.id))
      .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
      .leftJoin(engagements, eq(timesheetEntries.engagementId, engagements.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(timesheetEntries.workDate));

    return rows;
  }

  static async logTimesheet(
    tenantId: string,
    membershipId: string,
    data: {
      engagementId?: string;
      taskId?: string;
      workDate: Date;
      hours: number;
      activityType: string;
      description?: string;
    },
  ) {
    const [entry] = await db
      .insert(timesheetEntries)
      .values({
        tenantId,
        membershipId,
        engagementId: data.engagementId,
        taskId: data.taskId,
        workDate: data.workDate,
        hours: data.hours,
        activityType: data.activityType,
        description: data.description,
        status: "submitted",
      })
      .returning();

    // Increment task actualHours if taskId provided
    if (data.taskId) {
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, data.taskId),
      });
      if (task) {
        await db
          .update(tasks)
          .set({ actualHours: task.actualHours + data.hours })
          .where(eq(tasks.id, data.taskId));
      }
    }

    return entry;
  }

  static async approveTimesheet(
    tenantId: string,
    timesheetId: string,
    approverMembershipId: string,
    status: "approved" | "rejected",
  ) {
    const entry = await db.query.timesheetEntries.findFirst({
      where: and(
        eq(timesheetEntries.tenantId, tenantId),
        eq(timesheetEntries.id, timesheetId),
      ),
    });

    if (!entry) {
      throw new ApiError(
        404,
        "Timesheet entry not found",
        "TIMESHEET_NOT_FOUND",
      );
    }

    const [updated] = await db
      .update(timesheetEntries)
      .set({
        status,
        approvedByMembershipId: approverMembershipId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(timesheetEntries.tenantId, tenantId),
          eq(timesheetEntries.id, timesheetId),
        ),
      )
      .returning();

    return updated;
  }
}
