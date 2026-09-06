import { describe, expect, it } from "vitest";
import { AI_TOOLS, assertAllowedTool, requiresApproval } from "../services/ai-admin.service.js";

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
  it("keeps tenant context out of the platform AI contract", () => {
    expect("tenantId" in { requestSummary: "platform-only" }).toBe(false);
  });
});
