import { describe, it, expect } from "vitest";
import { NbrAdapter } from "../nbr.adapter.js";
import { FrcAdapter } from "../frc.adapter.js";
import { BsecAdapter } from "../bsec.adapter.js";
import { FilingStateMachine } from "../filing-state-machine.js";

describe("Phase 24 - Regulatory Adapters & State Machine Unit Tests", () => {
  describe("FilingStateMachine", () => {
    it("should allow valid state transitions", () => {
      expect(() => FilingStateMachine.validateTransition("DRAFT", "READY_FOR_SUBMISSION")).not.toThrow();
      expect(() => FilingStateMachine.validateTransition("READY_FOR_SUBMISSION", "SUBMISSION_PENDING")).not.toThrow();
      expect(() => FilingStateMachine.validateTransition("SUBMISSION_PENDING", "SUBMITTED")).not.toThrow();
      expect(() => FilingStateMachine.validateTransition("SUBMITTED", "ACCEPTED")).not.toThrow();
      expect(() => FilingStateMachine.validateTransition("REJECTED", "DRAFT")).not.toThrow();
    });

    it("should reject invalid state transitions", () => {
      expect(() => FilingStateMachine.validateTransition("DRAFT", "ACCEPTED")).toThrow(
        "Invalid filing state transition",
      );
      expect(() => FilingStateMachine.validateTransition("ACCEPTED", "SUBMITTED")).toThrow(
        "Invalid filing state transition",
      );
    });
  });

  describe("NbrAdapter", () => {
    it("should default to MANUAL_SUBMISSION when API is unconfigured", async () => {
      const adapter = new NbrAdapter({ apiUrl: undefined, apiKey: undefined });
      expect(await adapter.getProviderState()).toBe("MANUAL_SUBMISSION");

      const result = await adapter.submitFiling({
        tenantId: "t-1",
        filingId: "f-1",
        regulator: "NBR",
        filingType: "Tax Return",
      });

      expect(result.status).toBe("MANUAL_ACTION_REQUIRED");
      expect(result.submissionChannel).toBe("MANUAL_SUBMISSION");
    });

    it("should handle SUCCESS mock mode", async () => {
      const adapter = new NbrAdapter({ mockMode: "SUCCESS" });
      const result = await adapter.submitFiling({
        tenantId: "t-1",
        filingId: "f-1",
        regulator: "NBR",
        filingType: "Tax Return",
      });

      expect(result.status).toBe("ACCEPTED");
      expect(result.submissionChannel).toBe("API_INTEGRATED");
    });
  });

  describe("FrcAdapter", () => {
    it("should default to MANUAL_SUBMISSION when unconfigured", async () => {
      const adapter = new FrcAdapter();
      expect(await adapter.getProviderState()).toBe("MANUAL_SUBMISSION");

      const result = await adapter.submitFiling({
        tenantId: "t-1",
        filingId: "f-1",
        regulator: "FRC",
        filingType: "Audit Report",
      });

      expect(result.status).toBe("MANUAL_ACTION_REQUIRED");
    });
  });

  describe("BsecAdapter", () => {
    it("should default to MANUAL_SUBMISSION when unconfigured", async () => {
      const adapter = new BsecAdapter();
      expect(await adapter.getProviderState()).toBe("MANUAL_SUBMISSION");

      const result = await adapter.submitFiling({
        tenantId: "t-1",
        filingId: "f-1",
        regulator: "BSEC",
        filingType: "Governance Report",
      });

      expect(result.status).toBe("MANUAL_ACTION_REQUIRED");
    });
  });
});
