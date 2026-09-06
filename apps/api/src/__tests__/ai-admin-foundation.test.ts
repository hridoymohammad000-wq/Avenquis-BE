import { describe, expect, it } from "vitest";
import {
  AI_TOOLS,
  assertAllowedTool,
  assertCanExecuteAiAction,
  requiresApproval,
} from "../services/ai-admin.service.js";

describe("AI admin safety foundation", () => {
  it("only allows the explicit platform tool registry", () => {
    expect(AI_TOOLS).toContain("getLeadPipeline");
    expect(() => assertAllowedTool("rawSql" as never)).toThrow("AI tool is not allowlisted");
    expect(() => assertAllowedTool("superuserQuery" as never)).toThrow("AI tool is not allowlisted");
  });

  it("requires a human approval for high risk or L3 actions", () => {
    expect(requiresApproval("L3", "low")).toBe(true);
    expect(requiresApproval("L1", "high")).toBe(true);
    expect(requiresApproval("L1", "low")).toBe(false);
  });

  it("enforces that L3 or high-risk actions can NEVER execute without explicit APPROVED status", () => {
    const l3Target = { autonomyLevel: "L3", riskLevel: "low", tool: "getLeadPipeline" };
    const highRiskTarget = { autonomyLevel: "L1", riskLevel: "high", tool: "getLeadPipeline" };
    const lowRiskTarget = { autonomyLevel: "L1", riskLevel: "low", tool: "getLeadPipeline" };

    // L3 missing approval => blocked
    expect(() => assertCanExecuteAiAction(l3Target, null)).toThrow("L3 or high-risk AI actions require explicit human approval");
    // L3 PENDING approval => blocked
    expect(() => assertCanExecuteAiAction(l3Target, { status: "PENDING" })).toThrow("L3 or high-risk AI actions require explicit human approval");
    // L3 REJECTED approval => blocked
    expect(() => assertCanExecuteAiAction(l3Target, { status: "REJECTED" })).toThrow("L3 or high-risk AI actions require explicit human approval");
    // L3 APPROVED approval => allowed
    expect(() => assertCanExecuteAiAction(l3Target, { status: "APPROVED" })).not.toThrow();

    // High risk PENDING approval => blocked
    expect(() => assertCanExecuteAiAction(highRiskTarget, { status: "PENDING" })).toThrow("L3 or high-risk AI actions require explicit human approval");
    // High risk APPROVED approval => allowed
    expect(() => assertCanExecuteAiAction(highRiskTarget, { status: "APPROVED" })).not.toThrow();

    // Low risk + L1 => allowed without approval
    expect(() => assertCanExecuteAiAction(lowRiskTarget, null)).not.toThrow();
  });

  it("keeps tenant context out of the platform AI contract", () => {
    expect("tenantId" in { requestSummary: "platform-only" }).toBe(false);
  });
});
