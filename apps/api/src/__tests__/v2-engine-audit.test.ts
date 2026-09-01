import { describe, it, expect } from "vitest";
import { SamplingEvidenceService } from "../services/sampling-evidence.service.js";

describe("V2 Audit Engine Formulas & Business Logic Unit Verification", () => {
  describe("1. Materiality Calculations (ISA 320)", () => {
    it("should calculate overall materiality, performance materiality, and CTT accurately with decimal precision", () => {
      const benchmarkAmount = 1250450.8; // $1,250,450.80
      const percentageApplied = 500; // 5.00% (500 bps)

      const rawOverall = (benchmarkAmount * percentageApplied) / 10000;
      const overallMateriality = Math.round(rawOverall * 100) / 100;
      expect(overallMateriality).toBe(62522.54);

      const pmPct = 7500; // 75.00%
      const performanceMateriality =
        Math.round(((overallMateriality * pmPct) / 10000) * 100) / 100;
      expect(performanceMateriality).toBe(46891.91);

      const ctPct = 500; // 5.00%
      const clearlyTrivialThreshold =
        Math.round(((overallMateriality * ctPct) / 10000) * 100) / 100;
      expect(clearlyTrivialThreshold).toBe(3126.13);
    });
  });

  describe("2. Risk Assessment & ISA Risk Matrix", () => {
    it("should resolve combined risk level and detection risk case-insensitively", () => {
      const RISK_MATRIX: Record<string, Record<string, string>> = {
        high: { high: "high", medium: "significant", low: "moderate" },
        medium: { high: "significant", medium: "moderate", low: "low" },
        low: { high: "moderate", medium: "low", low: "low" },
      };

      const inherentKey = "HIGH".toLowerCase();
      const controlKey = "MEDIUM".toLowerCase();

      const combined = RISK_MATRIX[inherentKey]?.[controlKey];
      expect(combined).toBe("significant");
    });
  });

  describe("3. Audit Sampling Formulas (ISA 530)", () => {
    it("should correctly handle population bounds (0 and 1)", () => {
      expect(SamplingEvidenceService.calculateSampleSize(0, 9500, 500)).toBe(0);
      expect(SamplingEvidenceService.calculateSampleSize(1, 9500, 500)).toBe(1);
    });

    it("should calculate sample size with finite population correction", () => {
      // Population = 500, Confidence = 95% (R=3.0), Tolerable Error = 5% (0.05)
      // rawSampleSize = 3.0 / 0.05 = 60
      // correctedSize = (60 * 500) / (60 + 500 - 1) = 30000 / 559 ≈ 53.66 -> ceil -> 54
      const sampleSize = SamplingEvidenceService.calculateSampleSize(500, 9500, 500);
      expect(sampleSize).toBe(54);
      expect(sampleSize).toBeLessThanOrEqual(500);
    });

    it("should cap sample size at population size for small populations", () => {
      const sampleSize = SamplingEvidenceService.calculateSampleSize(10, 9900, 100);
      expect(sampleSize).toBe(10);
    });
  });

  describe("4. Summary of Unadjusted Differences (SUD)", () => {
    it("should sum unadjusted and open impacts with 2-decimal floating point precision", () => {
      const exceptions = [
        { resolutionStatus: "unadjusted", financialImpact: 1234.56 },
        { resolutionStatus: "unadjusted", financialImpact: 2345.67 },
        { resolutionStatus: "open", financialImpact: 500.1 },
        { resolutionStatus: "adjusted", financialImpact: 10000.0 },
      ];

      const rawUnadjusted = exceptions
        .filter((e) => e.resolutionStatus === "unadjusted")
        .reduce((sum, e) => sum + (e.financialImpact ?? 0), 0);

      const rawOpen = exceptions
        .filter((e) => e.resolutionStatus === "open")
        .reduce((sum, e) => sum + (e.financialImpact ?? 0), 0);

      const totalUnadjustedImpact = Math.round(rawUnadjusted * 100) / 100;
      const totalOpenImpact = Math.round(rawOpen * 100) / 100;

      expect(totalUnadjustedImpact).toBe(3580.23);
      expect(totalOpenImpact).toBe(500.1);
    });
  });

  describe("5. Trial Balance Balancing Calculation", () => {
    it("should accurately determine balance status despite floating point precision quirks", () => {
      const items = [
        { debitAmount: 100.1, creditAmount: 0 },
        { debitAmount: 200.2, creditAmount: 0 },
        { debitAmount: 0, creditAmount: 300.3 },
      ];

      let totalDebitRaw = 0;
      let totalCreditRaw = 0;

      for (const item of items) {
        totalDebitRaw += item.debitAmount;
        totalCreditRaw += item.creditAmount;
      }

      const totalDebit = Math.round(totalDebitRaw * 100) / 100;
      const totalCredit = Math.round(totalCreditRaw * 100) / 100;
      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

      expect(totalDebit).toBe(300.3);
      expect(totalCredit).toBe(300.3);
      expect(isBalanced).toBe(true);
    });
  });
});
