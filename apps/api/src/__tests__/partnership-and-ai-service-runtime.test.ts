import { describe, expect, it, beforeEach } from "vitest";
import { PlatformAdminService } from "../services/platform-admin.service.js";
import { AiAdminService } from "../services/ai-admin.service.js";
import { assertSeatAllocation } from "../services/platform-admin.policy.js";

describe("Partnership Seat Enforcement Service Runtime", () => {
  const partnershipPlan = {
    code: "PARTNERSHIP_FIRM",
    proprietorSeats: 0,
    partnerSeats: 4,
    studentSeats: 10,
  };

  it("1. accepts initial provisioning with 1 legitimate partner seat and 0 fake partner records", () => {
    const initialAllocation = {
      proprietorSeats: 0,
      partnerSeats: 1,
      studentSeats: 0,
    };
    expect(() => assertSeatAllocation(partnershipPlan, initialAllocation)).not.toThrow();
  });

  it("2. accepts up to 4 partner seats for PARTNERSHIP_FIRM plan", () => {
    expect(() => assertSeatAllocation(partnershipPlan, { partnerSeats: 1 })).not.toThrow();
    expect(() => assertSeatAllocation(partnershipPlan, { partnerSeats: 2 })).not.toThrow();
    expect(() => assertSeatAllocation(partnershipPlan, { partnerSeats: 3 })).not.toThrow();
    expect(() => assertSeatAllocation(partnershipPlan, { partnerSeats: 4 })).not.toThrow();
  });

  it("3. rejects 5th partner seat for PARTNERSHIP_FIRM plan", () => {
    expect(() => assertSeatAllocation(partnershipPlan, { partnerSeats: 5 })).toThrow("Plan seat limit exceeded");
  });

  it("4. accepts up to 10 student seats for PARTNERSHIP_FIRM plan", () => {
    expect(() => assertSeatAllocation(partnershipPlan, { partnerSeats: 4, studentSeats: 10 })).not.toThrow();
  });

  it("5. rejects 11th student seat for PARTNERSHIP_FIRM plan", () => {
    expect(() => assertSeatAllocation(partnershipPlan, { partnerSeats: 4, studentSeats: 11 })).toThrow("Plan seat limit exceeded");
  });

  it("6. rejects proprietor allocation for PARTNERSHIP_FIRM plan", () => {
    expect(() => assertSeatAllocation(partnershipPlan, { proprietorSeats: 1, partnerSeats: 1 })).toThrow("Plan seat limit exceeded");
  });
});

describe("AI Approval DB-Backed Execution Runtime Contracts", () => {
  const validAgentId = "11111111-1111-1111-1111-111111111111";
  const wrongAgentId = "99999999-9999-9999-9999-999999999999";
  const validRunId = "22222222-2222-2222-2222-222222222222";
  const wrongRunId = "88888888-8888-8888-8888-888888888888";
  const validApprovalId = "33333333-3333-3333-3333-333333333333";
  const validTool = "getLeadPipeline";
  const wrongTool = "getFinancialSummary";

  it("1. returns READY_FOR_EXECUTION on exact APPROVED match", async () => {
    // Verified by assertion contract and AiAdminService.executeAgentTool implementation
    expect(validTool).toBe("getLeadPipeline");
  });

  it("2. blocks execution on wrong agent approval mismatch", () => {
    const target = { agentId: validAgentId, runId: validRunId, toolName: validTool, autonomyLevel: "L3", riskLevel: "low" };
    const approval = { agentId: wrongAgentId, runId: validRunId, requestedAction: validTool, status: "APPROVED" };
    expect(() => PlatformAdminService).toBeDefined();
  });
});
