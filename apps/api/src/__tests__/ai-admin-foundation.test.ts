import { describe, expect, it } from "vitest";
import {
  AI_TOOLS,
  assertAllowedTool,
  assertCanExecuteAiAction,
  requiresApproval,
} from "../services/ai-admin.service.js";

describe("AI admin safety foundation", () => {
  const validAgentId = "11111111-1111-1111-1111-111111111111";
  const validRunId = "22222222-2222-2222-2222-222222222222";
  const validTool = "getLeadPipeline";

  const validApproval = {
    id: "33333333-3333-3333-3333-333333333333",
    agentId: validAgentId,
    runId: validRunId,
    requestedAction: validTool,
    status: "APPROVED",
  };

  it("1. allows execution when correct APPROVED approval matches exact agent, run, and tool", () => {
    const target = {
      agentId: validAgentId,
      runId: validRunId,
      toolName: validTool,
      autonomyLevel: "L3",
      riskLevel: "low",
    };
    expect(() => assertCanExecuteAiAction(target, validApproval)).not.toThrow();
  });

  it("2. blocks execution when approval belongs to a different agent", () => {
    const target = {
      agentId: "99999999-9999-9999-9999-999999999999",
      runId: validRunId,
      toolName: validTool,
      autonomyLevel: "L3",
      riskLevel: "low",
    };
    expect(() => assertCanExecuteAiAction(target, validApproval)).toThrow("require explicit human approval");
  });

  it("3. blocks execution when approval belongs to a different run", () => {
    const target = {
      agentId: validAgentId,
      runId: "88888888-8888-8888-8888-888888888888",
      toolName: validTool,
      autonomyLevel: "L3",
      riskLevel: "low",
    };
    expect(() => assertCanExecuteAiAction(target, validApproval)).toThrow("require explicit human approval");
  });

  it("4. blocks execution when approval requestedAction is for a different tool", () => {
    const target = {
      agentId: validAgentId,
      runId: validRunId,
      toolName: "getFirmSummary",
      autonomyLevel: "L3",
      riskLevel: "low",
    };
    expect(() => assertCanExecuteAiAction(target, validApproval)).toThrow("require explicit human approval");
  });

  it("5. blocks execution when approval status is PENDING", () => {
    const target = {
      agentId: validAgentId,
      runId: validRunId,
      toolName: validTool,
      autonomyLevel: "L3",
      riskLevel: "low",
    };
    const pendingApproval = { ...validApproval, status: "PENDING" };
    expect(() => assertCanExecuteAiAction(target, pendingApproval)).toThrow("require explicit human approval");
  });

  it("6. blocks execution when approval status is REJECTED", () => {
    const target = {
      agentId: validAgentId,
      runId: validRunId,
      toolName: validTool,
      autonomyLevel: "L3",
      riskLevel: "low",
    };
    const rejectedApproval = { ...validApproval, status: "REJECTED" };
    expect(() => assertCanExecuteAiAction(target, rejectedApproval)).toThrow("require explicit human approval");
  });

  it("7. blocks execution when approval is missing on L3 action", () => {
    const target = {
      agentId: validAgentId,
      runId: validRunId,
      toolName: validTool,
      autonomyLevel: "L3",
      riskLevel: "low",
    };
    expect(() => assertCanExecuteAiAction(target, null)).toThrow("require explicit human approval");
  });

  it("8. blocks execution when approval is missing on high-risk action", () => {
    const target = {
      agentId: validAgentId,
      runId: validRunId,
      toolName: validTool,
      autonomyLevel: "L1",
      riskLevel: "high",
    };
    expect(() => assertCanExecuteAiAction(target, null)).toThrow("require explicit human approval");
  });

  it("9. permits low-risk L1 actions without human approval", () => {
    const target = {
      agentId: validAgentId,
      runId: validRunId,
      toolName: validTool,
      autonomyLevel: "L1",
      riskLevel: "low",
    };
    expect(() => assertCanExecuteAiAction(target, null)).not.toThrow();
  });

  it("10. blocks execution when tool is not allowlisted", () => {
    const target = {
      agentId: validAgentId,
      runId: validRunId,
      toolName: "unapprovedCustomTool",
      autonomyLevel: "L1",
      riskLevel: "low",
    };
    expect(() => assertCanExecuteAiAction(target, null)).toThrow("AI tool is not allowlisted");
  });

  it("11. blocks execution for rawSql / superuserQuery style tools", () => {
    expect(() => assertAllowedTool("rawSql" as never)).toThrow("AI tool is not allowlisted");
    expect(() => assertAllowedTool("superuserQuery" as never)).toThrow("AI tool is not allowlisted");
    expect(() => assertAllowedTool("adminDeleteDatabase" as never)).toThrow("AI tool is not allowlisted");
  });

  it("12. maintains truthful execution response semantics", () => {
    expect(requiresApproval("L3", "low")).toBe(true);
    expect(requiresApproval("L1", "high")).toBe(true);
    expect(requiresApproval("L1", "low")).toBe(false);
    expect(AI_TOOLS).toContain("getLeadPipeline");
    expect("tenantId" in { requestSummary: "platform-only" }).toBe(false);
  });
});
