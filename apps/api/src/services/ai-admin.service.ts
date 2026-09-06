import { and, aiAdminPolicies, aiAgentRuns, aiAgents, aiApprovals, aiUsageRecords, db, desc, eq } from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";
import { AuditService } from "./audit.service.js";

export const AI_AUTONOMY_LEVELS = ["L0", "L1", "L2", "L3"] as const;
export const AI_RUN_STATES = ["CREATED", "PLANNING", "RUNNING", "WAITING_FOR_APPROVAL", "APPROVED", "EXECUTING", "COMPLETED", "FAILED", "CANCELLED", "REJECTED"] as const;
export const AI_TOOLS = ["getLeadPipeline", "getFirmSummary", "getOutstandingInvoices", "getSupportCases", "getGrowthMetrics", "createTaskDraft", "createCommunicationDraft"] as const;

export function assertAllowedTool(tool: string): asserts tool is (typeof AI_TOOLS)[number] {
  if (!AI_TOOLS.includes(tool as (typeof AI_TOOLS)[number]) || /sql|query|admin|superuser/i.test(tool)) {
    throw new ApiError(400, "AI tool is not allowlisted", "AI_TOOL_FORBIDDEN");
  }
}

export function requiresApproval(autonomyLevel: string, riskLevel: string) {
  return autonomyLevel === "L3" || riskLevel === "high";
}

export interface AiExecutionTarget {
  agentId: string;
  runId: string;
  toolName: string;
  autonomyLevel: string;
  riskLevel: string;
}

export interface AiApprovalRecord {
  id?: string;
  agentId: string;
  runId: string;
  requestedAction: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
}

export function assertCanExecuteAiAction(
  target: AiExecutionTarget,
  approval?: AiApprovalRecord | null,
): void {
  assertAllowedTool(target.toolName);

  const needsApproval = requiresApproval(target.autonomyLevel, target.riskLevel);
  if (needsApproval) {
    if (
      !approval ||
      approval.status !== "APPROVED" ||
      approval.agentId !== target.agentId ||
      approval.runId !== target.runId ||
      approval.requestedAction !== target.toolName
    ) {
      throw new ApiError(
        403,
        "L3 or high-risk AI actions require explicit human approval matching agent, run, action, and APPROVED status",
        "AI_APPROVAL_REQUIRED",
      );
    }
  }
}

export class AiAdminService {
  static async summary() {
    const [agents, runs, approvals, usage] = await Promise.all([
      db.select({ id: aiAgents.id, code: aiAgents.code, enabled: aiAgents.enabled, autonomyLevel: aiAgents.autonomyLevel, provider: aiAgents.provider, model: aiAgents.model }).from(aiAgents).orderBy(aiAgents.code),
      db.select({ count: aiAgentRuns.id }).from(aiAgentRuns),
      db.select({ count: aiApprovals.id }).from(aiApprovals).where(eq(aiApprovals.status, "PENDING")),
      db.select({ count: aiUsageRecords.id }).from(aiUsageRecords),
    ]);
    return { agents, runCount: runs[0]?.count ?? 0, pendingApprovalCount: approvals[0]?.count ?? 0, usageRecordCount: usage[0]?.count ?? 0, providerConfigured: agents.some((agent) => Boolean(agent.provider && agent.model)) };
  }

  static listAgents() { return db.select().from(aiAgents).orderBy(aiAgents.code); }
  static listRuns() { return db.select().from(aiAgentRuns).orderBy(desc(aiAgentRuns.createdAt)); }
  static listApprovals() { return db.select().from(aiApprovals).orderBy(desc(aiApprovals.createdAt)); }
  static listPolicies() { return db.select().from(aiAdminPolicies).orderBy(aiAdminPolicies.policyKey); }
  static listUsage() { return db.select().from(aiUsageRecords).orderBy(desc(aiUsageRecords.createdAt)); }

  static async updateAgent(id: string, input: { enabled?: boolean; autonomyLevel?: string }, actor: { userId: string; role: string }) {
    if (input.autonomyLevel && !AI_AUTONOMY_LEVELS.includes(input.autonomyLevel as (typeof AI_AUTONOMY_LEVELS)[number])) throw new ApiError(400, "Invalid autonomy level", "INVALID_AUTONOMY");
    const [agent] = await db.update(aiAgents).set({ ...input, updatedAt: new Date() }).where(eq(aiAgents.id, id)).returning();
    if (!agent) throw new ApiError(404, "AI agent not found", "NOT_FOUND");
    await AuditService.logPlatformAction({ actorUserId: actor.userId, platformRole: actor.role, action: "AI_AGENT_UPDATED", targetType: "ai_agent", targetId: id, afterMetadata: { enabled: agent.enabled, autonomyLevel: agent.autonomyLevel } });
    return agent;
  }

  static async reviewApproval(id: string, decision: "APPROVED" | "REJECTED", actor: { userId: string; role: string }) {
    const [approval] = await db.update(aiApprovals).set({ status: decision, reviewedByUserId: actor.userId, reviewedAt: new Date() }).where(and(eq(aiApprovals.id, id), eq(aiApprovals.status, "PENDING"))).returning();
    if (!approval) throw new ApiError(404, "Pending AI approval not found", "NOT_FOUND");
    await AuditService.logPlatformAction({ actorUserId: actor.userId, platformRole: actor.role, action: `AI_APPROVAL_${decision}`, targetType: "ai_approval", targetId: id });
    return approval;
  }

  static async executeAgentTool(input: {
    agentId: string;
    runId: string;
    toolName: string;
    approvalId?: string;
  }) {
    assertAllowedTool(input.toolName);
    const [agent] = await db.select().from(aiAgents).where(eq(aiAgents.id, input.agentId));
    if (!agent) throw new ApiError(404, "AI agent not found", "NOT_FOUND");
    if (!agent.enabled) throw new ApiError(400, "AI agent is disabled", "AGENT_DISABLED");

    const [run] = await db.select().from(aiAgentRuns).where(eq(aiAgentRuns.id, input.runId));
    if (!run || run.agentId !== input.agentId) {
      throw new ApiError(400, "AI agent run not found or does not belong to agent", "INVALID_RUN");
    }

    let approval: AiApprovalRecord | null = null;
    if (input.approvalId) {
      const [found] = await db.select().from(aiApprovals).where(eq(aiApprovals.id, input.approvalId));
      if (found) {
        approval = {
          id: found.id,
          agentId: found.agentId,
          runId: found.runId,
          requestedAction: found.requestedAction,
          status: found.status,
        };
      }
    }

    assertCanExecuteAiAction(
      {
        agentId: input.agentId,
        runId: input.runId,
        toolName: input.toolName,
        autonomyLevel: agent.autonomyLevel,
        riskLevel: agent.riskLevel,
      },
      approval,
    );

    return {
      authorized: true,
      status: "READY_FOR_EXECUTION",
      agentId: input.agentId,
      runId: input.runId,
      toolName: input.toolName,
    };
  }
}
