import {
  db,
  aiDocumentAnalyses,
  aiEngagementReviews,
  engagements,
  auditFiles,
  auditExceptions,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";
import { IAiProviderAdapter, HumanReviewStatus } from "./ai/ai-provider.interface.js";
import { GeminiAiAdapter } from "./ai/gemini-ai.adapter.js";
import { OpenAiAdapter } from "./ai/openai-ai.adapter.js";
import { env } from "../config/env.js";

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
      documentId: string;
      documentType: string;
      aiModel?: string;
      provider?: string;
      idempotencyKey?: string;
    },
    adapterOverride?: IAiProviderAdapter,
  ) {
    // 1. Authorization + tenant ownership check
    const doc = await db.query.auditFiles.findFirst({
      where: and(
        eq(auditFiles.tenantId, tenantId),
        eq(auditFiles.id, data.documentId),
      ),
    });

    if (!doc) {
      throw new ApiError(404, "Document not found or access denied", "DOCUMENT_NOT_FOUND");
    }

    if (data.engagementId && doc.engagementId !== data.engagementId) {
      throw new ApiError(403, "Document does not belong to specified engagement", "FORBIDDEN");
    }

    // 2. Validate supported file type
    const fileName = doc.fileName.toLowerCase();
    if (!fileName.endsWith(".pdf") && !fileName.endsWith(".txt") && !fileName.endsWith(".csv")) {
      throw new ApiError(400, "Unsupported file type for analysis", "UNSUPPORTED_FILE_TYPE");
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

    const [analysis] = await db
      .insert(aiDocumentAnalyses)
      .values({
        tenantId,
        engagementId: data.engagementId,
        documentUrl: doc.fileUrl,
        documentType: data.documentType,
        provider: adapter.providerName,
        model: data.aiModel || "default",
        idempotencyKey: data.idempotencyKey,
        requestedByMembershipId,
        status: "QUEUED",
        reviewStatus: "UNREVIEWED",
        auditTrail: [
          { event: "ANALYSIS_QUEUED", actor: requestedByMembershipId, timestamp: new Date().toISOString() },
        ],
      })
      .returning();

    // 3. Extraction / Preparation Boundary
    let extractedText: string;
    if (fileName.endsWith(".pdf")) {
      // Stub for actual extraction infrastructure
      const extractionError = "Document extraction infrastructure not available for PDF";
      await db
        .update(aiDocumentAnalyses)
        .set({
          status: "FAILED",
          failureReason: extractionError,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(aiDocumentAnalyses.tenantId, tenantId),
            eq(aiDocumentAnalyses.id, analysis.id),
          ),
        );
      throw new ApiError(501, extractionError, "EXTRACTION_UNAVAILABLE");
    } else {
      let fileUrlObj: URL;
      try {
        fileUrlObj = new URL(doc.fileUrl);
      } catch {
        throw new ApiError(400, "Invalid document URL", "INVALID_URL");
      }
      
      const allowedHosts = env.ARTIFACT_ALLOWED_HOSTS.split(",").map((h) => h.trim());
      if (!allowedHosts.includes(fileUrlObj.hostname)) {
        throw new ApiError(403, "Document URL points to an untrusted host (SSRF blocked)", "SSRF_BLOCKED");
      }
      
      try {
        const response = await fetch(doc.fileUrl);
        if (!response.ok) {
          throw new Error(`Storage returned HTTP ${response.status}`);
        }
        extractedText = await response.text();
      } catch (err: unknown) {
        const extractionError = "Failed to retrieve document from storage: " + ((err as Error)?.message || String(err));
        await db
          .update(aiDocumentAnalyses)
          .set({
            status: "FAILED",
            failureReason: extractionError,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(aiDocumentAnalyses.tenantId, tenantId),
              eq(aiDocumentAnalyses.id, analysis.id),
            ),
          );
        throw new ApiError(502, extractionError, "STORAGE_ERROR");
      }
    }

    let result;
    try {
      result = await adapter.analyzeDocument({
        tenantId,
        engagementId: data.engagementId,
        documentId: data.documentId,
        documentType: data.documentType,
        extractedText,
        model: data.aiModel,
        idempotencyKey: data.idempotencyKey,
      });
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || String(err);
      const isTimeout = errMsg.includes("timed out");
      // Do not log sensitive document content in the DB failure reason
      const safeErrMsg = isTimeout ? "AI request timed out" : "AI Provider error occurred";
      await db
        .update(aiDocumentAnalyses)
        .set({
          status: "FAILED",
          failureReason: safeErrMsg,
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
      throw new ApiError(400, "AI Analysis failed", "AI_ERROR");
    }

    const [updated] = await db
      .update(aiDocumentAnalyses)
      .set({
        status: result.status,
        provider: result.provider,
        model: result.model,
        aiAnalysisResult: result.extractedEntities || result.classification || { result: "No entities extracted" },
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

    // 2. Gather engagement evidence
    const engagementFiles = await db.query.auditFiles.findMany({
      where: and(
        eq(auditFiles.tenantId, tenantId),
        eq(auditFiles.engagementId, data.engagementId)
      )
    });
    
    const exceptions = await db.query.auditExceptions.findMany({
      where: and(
        eq(auditExceptions.tenantId, tenantId),
        eq(auditExceptions.engagementId, data.engagementId)
      )
    });

    const evidencePackage = {
      title: engagement.title,
      engagementType: engagement.engagementType,
      financialYear: engagement.financialYear,
      auditFilesCount: engagementFiles.length,
      auditFindingsCount: exceptions.length
    };

    let result;
    try {
      result = await adapter.reviewEngagement({
        tenantId,
        engagementId: data.engagementId,
        evidencePackage,
        model: data.aiModel,
        idempotencyKey: data.idempotencyKey,
      });
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || String(err);
      const isTimeout = errMsg.includes("timed out");
      // Do not log sensitive engagement data
      const safeErrMsg = isTimeout ? "AI request timed out" : "AI Provider error occurred";
      await db
        .update(aiEngagementReviews)
        .set({
          status: "FAILED",
          failureReason: safeErrMsg,
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
      throw new ApiError(400, "AI Review failed", "AI_ERROR");
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
