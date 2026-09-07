import { describe, expect, it } from "vitest";
import { PlatformAdminService } from "../services/platform-admin.service.js";
import {
  AiAdminService,
  assertCanExecuteAiAction,
} from "../services/ai-admin.service.js";
import {
  assertSeatAllocation,
  classifyMemberRoleCode,
} from "../services/platform-admin.policy.js";

describe("Partnership Seat Enforcement Service Runtime & Owner Seat Classification", () => {
  const singleStudentPlan = { proprietorSeats: 0, partnerSeats: 0, studentSeats: 1 };
  const proprietorPlan = { proprietorSeats: 1, partnerSeats: 0, studentSeats: 0 };
  const prop5StudentsPlan = { proprietorSeats: 1, partnerSeats: 0, studentSeats: 5 };
  const partnershipPlan = { proprietorSeats: 0, partnerSeats: 4, studentSeats: 10 };

  it("1. classifies owner role dynamically per platform plan", () => {
    expect(classifyMemberRoleCode("owner", singleStudentPlan)).toBe("student");
    expect(classifyMemberRoleCode("owner", proprietorPlan)).toBe("proprietor");
    expect(classifyMemberRoleCode("owner", prop5StudentsPlan)).toBe("proprietor");
    expect(classifyMemberRoleCode("owner", partnershipPlan)).toBe("partner");
  });

  it("2. classifies explicit role codes accurately", () => {
    expect(classifyMemberRoleCode("proprietor", partnershipPlan)).toBe("proprietor");
    expect(classifyMemberRoleCode("partner", partnershipPlan)).toBe("partner");
    expect(classifyMemberRoleCode("lead_partner", partnershipPlan)).toBe("partner");
    expect(classifyMemberRoleCode("student", partnershipPlan)).toBe("student");
    expect(classifyMemberRoleCode("articled_student", partnershipPlan)).toBe("student");
  });

  it("3. validates Partnership Firm seats: owner counts as partner #1, accepts partners 2..4, rejects partner #5", () => {
    expect(() => assertSeatAllocation(partnershipPlan, { partnerSeats: 4 })).not.toThrow();
    expect(() => assertSeatAllocation(partnershipPlan, { partnerSeats: 5 })).toThrow("Plan seat limit exceeded");
  });

  it("4. validates Partnership Firm student seats: accepts students 1..10, rejects student #11", () => {
    expect(() => assertSeatAllocation(partnershipPlan, { partnerSeats: 4, studentSeats: 10 })).not.toThrow();
    expect(() => assertSeatAllocation(partnershipPlan, { partnerSeats: 4, studentSeats: 11 })).toThrow("Plan seat limit exceeded");
  });

  it("5. validates Partnership Firm rejects proprietor allocation", () => {
    expect(() => assertSeatAllocation(partnershipPlan, { proprietorSeats: 1, partnerSeats: 1 })).toThrow("Plan seat limit exceeded");
  });
});

describe("AI Approval DB-Backed Execution Runtime Contracts", () => {
  const validAgentId = "11111111-1111-1111-1111-111111111111";
  const wrongAgentId = "99999999-9999-9999-9999-999999999999";
  const validRunId = "22222222-2222-2222-2222-222222222222";
  const wrongRunId = "88888888-8888-8888-8888-888888888888";
  const validTool = "getLeadPipeline";
  const wrongTool = "getFinancialSummary";

  const targetL3Low = {
    agentId: validAgentId,
    runId: validRunId,
    toolName: validTool,
    autonomyLevel: "L3",
    riskLevel: "low",
  };

  const validApproval = {
    agentId: validAgentId,
    runId: validRunId,
    requestedAction: validTool,
    status: "APPROVED",
  };

  it("1. allows execution on exact APPROVED match", () => {
    expect(() => assertCanExecuteAiAction(targetL3Low, validApproval)).not.toThrow();
  });

  it("2. blocks execution on wrong agent mismatch", () => {
    const wrongAgentApproval = { ...validApproval, agentId: wrongAgentId };
    expect(() => assertCanExecuteAiAction(targetL3Low, wrongAgentApproval)).toThrow("require explicit human approval");
  });

  it("3. blocks execution on wrong run mismatch", () => {
    const wrongRunApproval = { ...validApproval, runId: wrongRunId };
    expect(() => assertCanExecuteAiAction(targetL3Low, wrongRunApproval)).toThrow("require explicit human approval");
  });

  it("4. blocks execution on wrong tool mismatch", () => {
    const wrongToolApproval = { ...validApproval, requestedAction: wrongTool };
    expect(() => assertCanExecuteAiAction(targetL3Low, wrongToolApproval)).toThrow("require explicit human approval");
  });

  it("5. blocks execution on PENDING status", () => {
    const pendingApproval = { ...validApproval, status: "PENDING" };
    expect(() => assertCanExecuteAiAction(targetL3Low, pendingApproval)).toThrow("require explicit human approval");
  });

  it("6. blocks execution on REJECTED status", () => {
    const rejectedApproval = { ...validApproval, status: "REJECTED" };
    expect(() => assertCanExecuteAiAction(targetL3Low, rejectedApproval)).toThrow("require explicit human approval");
  });

  it("7. blocks execution when approval is missing on L3/high-risk action", () => {
    expect(() => assertCanExecuteAiAction(targetL3Low, null)).toThrow("require explicit human approval");
  });

  it("8. blocks execution when tool is not allowlisted", () => {
    const invalidToolTarget = { ...targetL3Low, toolName: "rawSql" };
    expect(() => assertCanExecuteAiAction(invalidToolTarget, validApproval)).toThrow("AI tool is not allowlisted");
  });
});
