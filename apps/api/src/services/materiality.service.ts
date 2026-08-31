import {
  db,
  materialityAssessments,
  riskAssessments,
  engagements,
  tbLineItems,
  eq,
  and,
  desc,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

// ISA-compliant risk matrix: Inherent Risk × Control Risk → Combined Risk Level
const RISK_MATRIX: Record<string, Record<string, string>> = {
  high: { high: "high", medium: "significant", low: "moderate" },
  medium: { high: "significant", medium: "moderate", low: "low" },
  low: { high: "moderate", medium: "low", low: "low" },
};

// Combined Risk → Required Detection Risk (inverse relationship per ISA 315/330)
const DETECTION_RISK_MAP: Record<string, string> = {
  high: "low",
  significant: "low",
  moderate: "medium",
  low: "high",
};

export class MaterialityService {
  // ──────────── MATERIALITY ────────────

  static async calculateMateriality(
    tenantId: string,
    assessedByMembershipId: string,
    data: {
      engagementId: string;
      benchmark: string;
      benchmarkAmount: number;
      percentageApplied: number; // basis points (e.g. 500 = 5%)
      performanceMaterialityPct?: number; // basis points, default 7500 = 75%
      clearlyTrivialPct?: number; // basis points, default 500 = 5%
      rationale?: string;
    },
  ) {
    const engagement = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.tenantId, tenantId),
        eq(engagements.id, data.engagementId),
      ),
    });

    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }

    const overallMateriality = Math.round(
      (data.benchmarkAmount * data.percentageApplied) / 10000,
    );

    const pmPct = data.performanceMaterialityPct ?? 7500;
    const performanceMateriality = Math.round(
      (overallMateriality * pmPct) / 10000,
    );

    const ctPct = data.clearlyTrivialPct ?? 500;
    const clearlyTrivialThreshold = Math.round(
      (overallMateriality * ctPct) / 10000,
    );

    const [assessment] = await db
      .insert(materialityAssessments)
      .values({
        tenantId,
        engagementId: data.engagementId,
        benchmark: data.benchmark,
        benchmarkAmount: data.benchmarkAmount,
        percentageApplied: data.percentageApplied,
        overallMateriality,
        performanceMaterialityPct: pmPct,
        performanceMateriality,
        clearlyTrivialPct: ctPct,
        clearlyTrivialThreshold,
        rationale: data.rationale,
        assessedByMembershipId,
      })
      .returning();

    return assessment;
  }

  static async getMaterialityForEngagement(
    tenantId: string,
    engagementId: string,
  ) {
    const assessment = await db.query.materialityAssessments.findFirst({
      where: and(
        eq(materialityAssessments.tenantId, tenantId),
        eq(materialityAssessments.engagementId, engagementId),
      ),
      orderBy: [desc(materialityAssessments.createdAt)],
    });

    if (!assessment) {
      throw new ApiError(
        404,
        "Materiality assessment not found for this engagement",
        "MATERIALITY_NOT_FOUND",
      );
    }

    return assessment;
  }

  // ──────────── RISK ASSESSMENT ────────────

  static async createRiskAssessment(
    tenantId: string,
    assessedByMembershipId: string,
    data: {
      engagementId: string;
      lineItemId?: string;
      areaName: string;
      assertion: string;
      inherentRisk: string;
      controlRisk: string;
      riskDescription?: string;
      responseStrategy?: string;
    },
  ) {
    const engagement = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.tenantId, tenantId),
        eq(engagements.id, data.engagementId),
      ),
    });

    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }

    // Calculate combined risk using ISA risk matrix
    const combinedRiskLevel =
      RISK_MATRIX[data.inherentRisk]?.[data.controlRisk] ?? "moderate";
    const detectionRiskRequired =
      DETECTION_RISK_MAP[combinedRiskLevel] ?? "medium";

    const [risk] = await db
      .insert(riskAssessments)
      .values({
        tenantId,
        engagementId: data.engagementId,
        lineItemId: data.lineItemId ?? null,
        areaName: data.areaName,
        assertion: data.assertion,
        inherentRisk: data.inherentRisk,
        controlRisk: data.controlRisk,
        combinedRiskLevel,
        detectionRiskRequired,
        riskDescription: data.riskDescription,
        responseStrategy: data.responseStrategy,
        assessedByMembershipId,
      })
      .returning();

    return risk;
  }

  static async listRiskAssessments(
    tenantId: string,
    engagementId: string,
    options?: { assertion?: string },
  ) {
    const conditions = [
      eq(riskAssessments.tenantId, tenantId),
      eq(riskAssessments.engagementId, engagementId),
    ];

    if (options?.assertion) {
      conditions.push(eq(riskAssessments.assertion, options.assertion));
    }

    const list = await db
      .select()
      .from(riskAssessments)
      .where(and(...conditions))
      .orderBy(desc(riskAssessments.createdAt));

    return list;
  }

  static async getRiskMatrix(tenantId: string, engagementId: string) {
    const risks = await db
      .select()
      .from(riskAssessments)
      .where(
        and(
          eq(riskAssessments.tenantId, tenantId),
          eq(riskAssessments.engagementId, engagementId),
        ),
      );

    const summary = {
      totalRisks: risks.length,
      highRisks: risks.filter((r) => r.combinedRiskLevel === "high").length,
      significantRisks: risks.filter(
        (r) => r.combinedRiskLevel === "significant",
      ).length,
      moderateRisks: risks.filter((r) => r.combinedRiskLevel === "moderate")
        .length,
      lowRisks: risks.filter((r) => r.combinedRiskLevel === "low").length,
      byAssertion: {} as Record<string, number>,
    };

    for (const risk of risks) {
      summary.byAssertion[risk.assertion] =
        (summary.byAssertion[risk.assertion] ?? 0) + 1;
    }

    return { summary, risks };
  }
}
