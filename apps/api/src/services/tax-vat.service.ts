import {
  db,
  taxVatWorkflows,
  clients,
  memberships,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class TaxVatService {
  static async createWorkflow(
    tenantId: string,
    data: {
      clientId: string;
      workflowType: string;
      period: string;
      dueDate?: string;
      assignedToMembershipId?: string;
    },
  ) {
    const client = await db.query.clients.findFirst({
      where: and(eq(clients.tenantId, tenantId), eq(clients.id, data.clientId)),
    });

    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }

    if (data.assignedToMembershipId) {
      const assignee = await db.query.memberships.findFirst({
        where: and(
          eq(memberships.id, data.assignedToMembershipId),
          eq(memberships.tenantId, tenantId),
        ),
      });
      if (!assignee)
        throw new ApiError(
          400,
          "Assigned member is not part of this tenant",
          "INVALID_ASSIGNEE",
        );
    }

    const [workflow] = await db
      .insert(taxVatWorkflows)
      .values({
        tenantId,
        clientId: data.clientId,
        workflowType: data.workflowType,
        period: data.period,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        assignedToMembershipId: data.assignedToMembershipId,
        status: "data_collection",
      })
      .returning();

    return workflow;
  }

  static async updateWorkflowStatus(
    tenantId: string,
    workflowId: string,
    data: {
      status: string;
      notes?: string;
    },
  ) {
    const workflow = await db.query.taxVatWorkflows.findFirst({
      where: and(
        eq(taxVatWorkflows.id, workflowId),
        eq(taxVatWorkflows.tenantId, tenantId),
      ),
    });
    if (!workflow)
      throw new ApiError(
        404,
        "Tax/VAT workflow not found",
        "WORKFLOW_NOT_FOUND",
      );
    const order = [
      "data_collection",
      "computation",
      "review",
      "filed",
      "completed",
    ];
    if (order.indexOf(data.status) < order.indexOf(workflow.status)) {
      throw new ApiError(
        400,
        "Tax/VAT workflow cannot move backwards",
        "INVALID_STATUS_TRANSITION",
      );
    }

    const [updated] = await db
      .update(taxVatWorkflows)
      .set({
        status: data.status,
        notes: data.notes,
        filedDate:
          data.status === "filed" || data.status === "completed"
            ? new Date()
            : undefined,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(taxVatWorkflows.tenantId, tenantId),
          eq(taxVatWorkflows.id, workflowId),
        ),
      )
      .returning();

    if (!updated) {
      throw new ApiError(
        404,
        "Tax/VAT workflow not found",
        "WORKFLOW_NOT_FOUND",
      );
    }

    return updated;
  }

  static async getClientWorkflows(tenantId: string, clientId: string) {
    return db
      .select()
      .from(taxVatWorkflows)
      .where(
        and(
          eq(taxVatWorkflows.tenantId, tenantId),
          eq(taxVatWorkflows.clientId, clientId),
        ),
      );
  }
}
