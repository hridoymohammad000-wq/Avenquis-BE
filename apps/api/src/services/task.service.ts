import {
  db,
  tasks,
  engagements,
  memberships,
  eq,
  and,
  desc,
  ilike,
  or,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class TaskService {
  static async listTasks(
    tenantId: string,
    options?: {
      engagementId?: string;
      assigneeMembershipId?: string;
      status?: string;
      priority?: string;
      search?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const conditions = [eq(tasks.tenantId, tenantId)];

    if (options?.engagementId) {
      conditions.push(eq(tasks.engagementId, options.engagementId));
    }
    if (options?.assigneeMembershipId) {
      conditions.push(
        eq(tasks.assigneeMembershipId, options.assigneeMembershipId),
      );
    }
    if (options?.status) {
      conditions.push(eq(tasks.status, options.status));
    }
    if (options?.priority) {
      conditions.push(eq(tasks.priority, options.priority));
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      const condOr = or(
        ilike(tasks.title, searchPattern),
        ilike(tasks.description, searchPattern),
      );
      if (condOr) conditions.push(condOr);
    }

    const rows = await db
      .select({
        id: tasks.id,
        tenantId: tasks.tenantId,
        engagementId: tasks.engagementId,
        engagementTitle: engagements.title,
        assigneeMembershipId: tasks.assigneeMembershipId,
        title: tasks.title,
        description: tasks.description,
        priority: tasks.priority,
        status: tasks.status,
        dueDate: tasks.dueDate,
        estimatedHours: tasks.estimatedHours,
        actualHours: tasks.actualHours,
        createdAt: tasks.createdAt,
      })
      .from(tasks)
      .innerJoin(engagements, eq(tasks.engagementId, engagements.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(tasks.createdAt));

    return rows;
  }

  static async createTask(
    tenantId: string,
    data: {
      engagementId: string;
      assigneeMembershipId?: string;
      title: string;
      description?: string;
      priority?: "low" | "medium" | "high" | "urgent";
      dueDate?: Date;
      estimatedHours?: number;
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

    if (data.assigneeMembershipId) {
      const assignee = await db.query.memberships.findFirst({
        where: and(
          eq(memberships.id, data.assigneeMembershipId),
          eq(memberships.tenantId, tenantId),
        ),
      });
      if (!assignee) {
        throw new ApiError(
          400,
          "Assignee does not belong to this tenant",
          "MEMBERSHIP_TENANT_MISMATCH",
        );
      }
    }

    const [task] = await db
      .insert(tasks)
      .values({
        tenantId,
        engagementId: data.engagementId,
        assigneeMembershipId: data.assigneeMembershipId,
        title: data.title,
        description: data.description,
        priority: data.priority ?? "medium",
        status: "todo",
        dueDate: data.dueDate,
        estimatedHours: data.estimatedHours ?? 0,
        actualHours: 0,
      })
      .returning();

    return task;
  }

  static async updateTaskStatus(
    tenantId: string,
    taskId: string,
    status: "todo" | "in_progress" | "review" | "completed" | "cancelled",
    actualHours?: number,
  ) {
    const task = await db.query.tasks.findFirst({
      where: and(eq(tasks.tenantId, tenantId), eq(tasks.id, taskId)),
    });

    if (!task) {
      throw new ApiError(404, "Task not found", "TASK_NOT_FOUND");
    }

    const [updated] = await db
      .update(tasks)
      .set({
        status,
        actualHours: actualHours ?? task.actualHours,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.tenantId, tenantId), eq(tasks.id, taskId)))
      .returning();

    return updated;
  }
}
