import { describe, expect, it } from "vitest";
import { deriveEngagementSignoffRole } from "../services/certificate.service.js";
import { validateWorkingPaperSignoff } from "../services/working-paper.service.js";

describe("audit sign-off remediation", () => {
  it("rejects a fake lead partner or EQCR claim without assignment", () => {
    expect(
      deriveEngagementSignoffRole("lead_partner", "senior_auditor", null, "m"),
    ).toBeNull();
    expect(
      deriveEngagementSignoffRole("eqcr_partner", undefined, "other", "m"),
    ).toBeNull();
  });

  it("accepts only an actually assigned sign-off role", () => {
    expect(
      deriveEngagementSignoffRole("lead_partner", "lead_partner", null, "m"),
    ).toBe("lead_partner");
    expect(
      deriveEngagementSignoffRole("eqcr_partner", undefined, "m", "m"),
    ).toBe("eqcr_partner");
  });

  it("blocks self approval, unresolved notes, and invalid transitions", () => {
    expect(() =>
      validateWorkingPaperSignoff("prepared", "approve", "m", "m", 0),
    ).toThrow(/preparer cannot approve/);
    expect(() =>
      validateWorkingPaperSignoff("prepared", "approve", "other", "m", 1),
    ).toThrow(/unresolved review notes/);
    expect(() =>
      validateWorkingPaperSignoff("draft", "approve", "other", "m", 0),
    ).toThrow(/Invalid working-paper status/);
    expect(() =>
      validateWorkingPaperSignoff("prepared", "approve", "other", "m", 0),
    ).not.toThrow();
  });
});
