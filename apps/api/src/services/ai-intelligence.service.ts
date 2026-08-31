import {
  db,
  aiDocumentAnalyses,
  aiEngagementReviews,
  eq,
  and,
} from "@avenquis/database";

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

    return updated;
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
    return analysis;
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

    return updated;
  }
}
