import {
  db,
  aiDocumentAnalyses,
  aiEngagementReviews,
  engagements,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";
import { IAiProviderAdapter, HumanReviewStatus } from "./ai/ai-provider.interface.js";
import { GeminiAiAdapter } from "./ai/gemini-ai.adapter.js";
import { OpenAiAdapter } from "./ai/openai-ai.adapter.js";

export class AiIntelligenceService {
  private static adapters: Map<string, IAiProviderAdapter> = new Map<string, IAiProviderAdapter>([
    ["GEMINI", new GeminiAiAdapter()],
    ["OPENAI", new OpenAiAdapter()],
  ]);

  static registerAdapter(providerName: string, adapter: IAiProviderAdapter) {
    this.adapters.set(providerName.toUpperCase(), adapter);
  }

  static getAdapter(providerName?: string): IAiProviderAdapter {
    const name = (providerName || "GEMINI").toUpperCase();
    const adapter = this.adapters.get(name);
    if (!adapter) {
      return new GeminiAiAdapter();
    }
    return adapter;
  }

  // ──────────── DOCUMENT ANALYSIS ────────────
  static async requestDocumentAnalysis(
    tenantId: string,
    requestedByMembershipId: string,
    data: {
      engagementId?: string;
      documentUrl: string;
      documentType: string;
      model?: string;
      provider?: string;
      idempotencyKey?: string;
    },
    adapterOverride?: IAiProviderAdapter,
  ) {
    if (data.engagementId) {
      const engagement = await db.query.engagements.findFirst({
        where: and(
          eq(engagements.tenantId, tenantId),
          eq(engagements.id, data.engagementId),
        ),
      });

      if (!engagement) {
        throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
      }
    }

    // Check Idempotency
    if (data.idempotencyKey) {
      const existing = await db.query.aiDocumentAnalyses.findFirst({
        where: and(
          eq(aiDocumentAnalyses.tenantId, tenantId),
          eq(aiDocumentAnalyses.idempotencyKey, data.idempotencyKey),
        ),
      });

      if (existing) {
        return {
          ...existing,
          isDuplicate: true,
        };
      }
    }

    const adapter = adapterOverride || this.getAdapter(data.provider);

    // Initial QUEUED state record
    const [analysis] = await db
      .insert(aiDocumentAnalyses)
      .values({
        tenantId,
        engagementId: data.engagementId,
        documentUrl: data.documentUrl,
        documentType: data.documentType,
        provider: adapter.providerName,
        model: data.model || "gemini-1.5-pro",
        idempotencyKey: data.idempotencyKey,
        requestedByMembershipId,
        status: "QUEUED",
        reviewStatus: "UNREVIEWED",
        auditTrail: [
          { event: "JOB_QUEUED", actor: requestedByMembershipId, timestamp: new Date().toISOString() },
        ],
      })
      .returning();

    // Async execution of provider analysis
    let result;
    try {
      result = await adapter.analyzeDocument({
        tenantId,
        engagementId: data.engagementId,
        documentUrl: data.documentUrl,
        documentType: data.documentType,
        model: data.model,
        idempotencyKey: data.idempotencyKey,
      });
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || String(err);
      const isTimeout = errMsg.includes("timed out");
      await db
        .update(aiDocumentAnalyses)
        .set({
          status: "FAILED",
          failureReason: isTimeout ? "AI request timed out" : `AI Analysis Error: ${errMsg}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(aiDocumentAnalyses.tenantId, tenantId),
            eq(aiDocumentAnalyses.id, analysis.id),
          ),
        );

      if (isTimeout) {
        throw new ApiError(504, "AI Provider request timed out", "AI_TIMEOUT");
      }
      throw new ApiError(400, `AI Analysis failed: ${errMsg}`, "AI_ERROR");
    }

    const [updated] = await db
      .update(aiDocumentAnalyses)
      .set({
        status: result.status,
        provider: result.provider,
        model: result.model,
        aiAnalysisResult: result.extractedEntities || { result: "No entities extracted" },
        confidenceScore: result.confidenceScore ? result.confidenceScore.toString() : undefined,
        failureReason: result.failureReason,
        usageMetadata: result.usageMetadata ? (result.usageMetadata as Record<string, unknown>) : undefined,
        auditTrail: [
          ...(Array.isArray(analysis.auditTrail) ? analysis.auditTrail : []),
          { event: "PROCESSING_COMPLETED", status: result.status, timestamp: new Date().toISOString() },
        ],
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
      providerStatus: result.providerStatus,
      isTestProvider: result.isTestProvider ?? false,
    };
  }

  static async getDocumentAnalysis(tenantId: string, analysisId: string) {
    const analysis = await db.query.aiDocumentAnalyses.findFirst({
      where: and(
        eq(aiDocumentAnalyses.tenantId, tenantId),
        eq(aiDocumentAnalyses.id, analysisId),
      ),
    });

    if (!analysis) {
      throw new ApiError(404, "Analysis not found", "NOT_FOUND");
    }

    return analysis;
  }

  static async reviewDocumentAnalysis(
    tenantId: string,
    analysisId: string,
    reviewerMembershipId: string,
    data: {
      decision: HumanReviewStatus;
      humanCorrections?: Record<string, unknown>;
      reviewNotes?: string;
    },
  ) {
    const analysis = await this.getDocumentAnalysis(tenantId, analysisId);

    const targetJobStatus =
      data.decision === "APPROVED" || data.decision === "OVERRIDDEN" ? "COMPLETED" : "FAILED";

    const [updated] = await db
      .update(aiDocumentAnalyses)
      .set({
        reviewStatus: data.decision,
        status: targetJobStatus,
        reviewedByMembershipId: reviewerMembershipId,
        reviewedAt: new Date(),
        humanCorrections: data.humanCorrections || (data.reviewNotes ? { notes: data.reviewNotes } : undefined),
        auditTrail: [
          ...(Array.isArray(analysis.auditTrail) ? analysis.auditTrail : []),
          {
            event: "HUMAN_REVIEWED",
            decision: data.decision,
            reviewer: reviewerMembershipId,
            timestamp: new Date().toISOString(),
          },
        ],
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiDocumentAnalyses.tenantId, tenantId),
          eq(aiDocumentAnalyses.id, analysisId),
        ),
      )
      .returning();

    return updated;
  }

  // ──────────── ENGAGEMENT REVIEW ────────────
  static async requestEngagementReview(
    tenantId: string,
    requestedByMembershipId: string,
    data: {
      engagementId: string;
      aiModel: string;
      provider?: string;
      idempotencyKey?: string;
    },
    adapterOverride?: IAiProviderAdapter,
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

    // Check Idempotency
    if (data.idempotencyKey) {
      const existing = await db.query.aiEngagementReviews.findFirst({
        where: and(
          eq(aiEngagementReviews.tenantId, tenantId),
          eq(aiEngagementReviews.idempotencyKey, data.idempotencyKey),
        ),
      });

      if (existing) {
        return {
          ...existing,
          isDuplicate: true,
        };
      }
    }

    const adapter = adapterOverride || this.getAdapter(data.provider);

    const [review] = await db
      .insert(aiEngagementReviews)
      .values({
        tenantId,
        engagementId: data.engagementId,
        reviewedByAiModel: data.aiModel,
        provider: adapter.providerName,
        idempotencyKey: data.idempotencyKey,
        requestedByMembershipId,
        status: "QUEUED",
        reviewStatus: "UNREVIEWED",
        auditTrail: [
          { event: "REVIEW_QUEUED", actor: requestedByMembershipId, timestamp: new Date().toISOString() },
        ],
      })
      .returning();

    let result;
    try {
      result = await adapter.reviewEngagement({
        tenantId,
        engagementId: data.engagementId,
        model: data.aiModel,
        idempotencyKey: data.idempotencyKey,
      });
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || String(err);
      const isTimeout = errMsg.includes("timed out");
      await db
        .update(aiEngagementReviews)
        .set({
          status: "FAILED",
          failureReason: isTimeout ? "AI request timed out" : `AI Review Error: ${errMsg}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(aiEngagementReviews.tenantId, tenantId),
            eq(aiEngagementReviews.id, review.id),
          ),
        );

      if (isTimeout) {
        throw new ApiError(504, "AI Provider request timed out", "AI_TIMEOUT");
      }
      throw new ApiError(400, `AI Review failed: ${errMsg}`, "AI_ERROR");
    }

    const [updated] = await db
      .update(aiEngagementReviews)
      .set({
        status: result.status,
        provider: result.provider,
        findings: result.findings || [],
        confidenceScore: result.confidenceScore,
        failureReason: result.failureReason,
        usageMetadata: result.usageMetadata ? (result.usageMetadata as Record<string, unknown>) : undefined,
        auditTrail: [
          ...(Array.isArray(review.auditTrail) ? review.auditTrail : []),
          { event: "REVIEW_COMPLETED", status: result.status, timestamp: new Date().toISOString() },
        ],
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
      providerStatus: result.providerStatus,
      isTestProvider: result.isTestProvider ?? false,
    };
  }

  static async getEngagementReview(tenantId: string, reviewId: string) {
    const review = await db.query.aiEngagementReviews.findFirst({
      where: and(
        eq(aiEngagementReviews.tenantId, tenantId),
        eq(aiEngagementReviews.id, reviewId),
      ),
    });

    if (!review) {
      throw new ApiError(404, "Review not found", "NOT_FOUND");
    }

    return review;
  }

  static async reviewEngagementReview(
    tenantId: string,
    reviewId: string,
    reviewerMembershipId: string,
    data: {
      decision: HumanReviewStatus;
      humanCorrections?: Record<string, unknown>;
      reviewNotes?: string;
    },
  ) {
    const review = await this.getEngagementReview(tenantId, reviewId);

    const targetJobStatus =
      data.decision === "APPROVED" || data.decision === "OVERRIDDEN" ? "COMPLETED" : "FAILED";

    const [updated] = await db
      .update(aiEngagementReviews)
      .set({
        reviewStatus: data.decision,
        status: targetJobStatus,
        reviewedByMembershipId: reviewerMembershipId,
        reviewedAt: new Date(),
        humanCorrections: data.humanCorrections || (data.reviewNotes ? { notes: data.reviewNotes } : undefined),
        auditTrail: [
          ...(Array.isArray(review.auditTrail) ? review.auditTrail : []),
          {
            event: "HUMAN_REVIEWED",
            decision: data.decision,
            reviewer: reviewerMembershipId,
            timestamp: new Date().toISOString(),
          },
        ],
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiEngagementReviews.tenantId, tenantId),
          eq(aiEngagementReviews.id, reviewId),
        ),
      )
      .returning();

    return updated;
  }
}
