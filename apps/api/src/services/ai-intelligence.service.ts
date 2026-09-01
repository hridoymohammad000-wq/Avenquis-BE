import {
  db,
  aiDocumentAnalyses,
  aiEngagementReviews,
  eq,
  and,
  engagements,
  memberships,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class AiIntelligenceService {
  // ──────────── DOCUMENT ANALYSIS ────────────
  static async requestDocumentAnalysis(
    tenantId: string,
    requestedByMembershipId: string,
    data: {
      engagementId?: string;
      documentUrl: string;
      documentType: string;
    },
  ) {
    const requester = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.id, requestedByMembershipId),
        eq(memberships.tenantId, tenantId),
      ),
    });
    if (!requester)
      throw new ApiError(
        403,
        "Invalid requester membership",
        "INVALID_MEMBERSHIP",
      );
    if (data.engagementId) {
      const engagement = await db.query.engagements.findFirst({
        where: and(
          eq(engagements.id, data.engagementId),
          eq(engagements.tenantId, tenantId),
        ),
      });
      if (!engagement)
        throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }

    const [analysis] = await db
      .insert(aiDocumentAnalyses)
      .values({
        tenantId,
        engagementId: data.engagementId,
        documentUrl: data.documentUrl,
        documentType: data.documentType,
        requestedByMembershipId,
        status: "processing", // In a real system, this would trigger an async job
      })
      .returning();

    // Mocking an instant completion for demonstration purposes
    const mockResult = {
      extractedEntities: {
        vendorName: "Mock Vendor Inc.",
        totalAmount: 12500.0,
        date: "2025-10-10",
      },
      confidence: 0.95,
      flags: ["high_value_transaction"],
    };

    const [updated] = await db
      .update(aiDocumentAnalyses)
      .set({
        status: "completed",
        aiAnalysisResult: mockResult,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiDocumentAnalyses.tenantId, tenantId),
          eq(aiDocumentAnalyses.id, analysis.id),
        ),
      )
      .returning();

    return {
      ...updated,
      isMock: true,
      provider: "OFFLINE_AI_STUB",
      note: "Offline heuristic stub response. Production LLM API keys required for live inference.",
    };
  }

  static async getDocumentAnalysis(tenantId: string, analysisId: string) {
    const [analysis] = await db
      .select()
      .from(aiDocumentAnalyses)
      .where(
        and(
          eq(aiDocumentAnalyses.tenantId, tenantId),
          eq(aiDocumentAnalyses.id, analysisId),
        ),
      );
    return analysis
      ? {
          ...analysis,
          isMock: true,
          provider: "OFFLINE_AI_STUB",
        }
      : undefined;
  }

  // ──────────── ENGAGEMENT REVIEW ────────────
  static async requestEngagementReview(
    tenantId: string,
    requestedByMembershipId: string,
    data: {
      engagementId: string;
      aiModel: string;
    },
  ) {
    const requester = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.id, requestedByMembershipId),
        eq(memberships.tenantId, tenantId),
      ),
    });
    if (!requester)
      throw new ApiError(
        403,
        "Invalid requester membership",
        "INVALID_MEMBERSHIP",
      );
    const engagement = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.id, data.engagementId),
        eq(engagements.tenantId, tenantId),
      ),
    });
    if (!engagement)
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");

    const [review] = await db
      .insert(aiEngagementReviews)
      .values({
        tenantId,
        engagementId: data.engagementId,
        reviewedByAiModel: data.aiModel,
        requestedByMembershipId,
        status: "processing",
      })
      .returning();

    // Mocking an instant completion for demonstration purposes
    const mockFindings = [
      {
        type: "risk",
        severity: "medium",
        description:
          "Missing signed independence declaration for team member X.",
      },
      {
        type: "anomaly",
        severity: "low",
        description:
          "Revenue sample sizes might be statistically insufficient based on recorded materiality.",
      },
    ];

    const [updated] = await db
      .update(aiEngagementReviews)
      .set({
        status: "completed",
        findings: mockFindings,
        confidenceScore: 88,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiEngagementReviews.tenantId, tenantId),
          eq(aiEngagementReviews.id, review.id),
        ),
      )
      .returning();

    return {
      ...updated,
      isMock: true,
      provider: "OFFLINE_AI_STUB",
      note: "Offline heuristic stub response. Production LLM API keys required for live inference.",
    };
  }
}
