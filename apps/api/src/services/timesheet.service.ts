import {
  db,
  timesheetEntries,
  engagements,
  tasks,
  memberships,
  userProfiles,
  eq,
  and,
  desc,
} from "@avenquis/database";
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
    return db.transaction(async (tx) => {
      const membership = await tx.query.memberships.findFirst({
        where: and(
          eq(memberships.id, membershipId),
          eq(memberships.tenantId, tenantId),
        ),
      });
      if (!membership) {
        throw new ApiError(
          400,
          "Membership does not belong to this tenant",
          "MEMBERSHIP_TENANT_MISMATCH",
        );
      }

      if (data.engagementId) {
        const engagement = await tx.query.engagements.findFirst({
          where: and(
            eq(engagements.id, data.engagementId),
            eq(engagements.tenantId, tenantId),
          ),
        });
        if (!engagement) {
          throw new ApiError(
            400,
            "Engagement does not belong to this tenant",
            "ENGAGEMENT_TENANT_MISMATCH",
          );
        }
      }

      let task;
      if (data.taskId) {
        task = await tx.query.tasks.findFirst({
          where: and(eq(tasks.id, data.taskId), eq(tasks.tenantId, tenantId)),
        });
        if (!task) {
          throw new ApiError(
            400,
            "Task does not belong to this tenant",
            "TASK_TENANT_MISMATCH",
          );
        }
        if (data.engagementId && task.engagementId !== data.engagementId) {
          throw new ApiError(
            400,
            "Task does not belong to the selected engagement",
            "TASK_ENGAGEMENT_MISMATCH",
          );
        }
      }

      const [entry] = await tx
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

      if (task) {
        await tx
          .update(tasks)
          .set({ actualHours: task.actualHours + data.hours })
          .where(and(eq(tasks.id, data.taskId!), eq(tasks.tenantId, tenantId)));
      }

      return entry;
    });
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
