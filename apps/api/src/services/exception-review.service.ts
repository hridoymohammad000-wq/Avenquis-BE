import {
  db,
  auditExceptions,
  auditReviews,
  engagements,
  eq,
  and,
  desc,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class ExceptionReviewService {
  // ──────────── EXCEPTIONS (SUD) ────────────

  static async raiseException(
    tenantId: string,
    raisedByMembershipId: string,
    data: {
      engagementId: string;
      procedureId?: string;
      exceptionType: string;
      description: string;
      financialImpact?: number;
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

    const [exception] = await db
      .insert(auditExceptions)
      .values({
        tenantId,
        engagementId: data.engagementId,
        procedureId: data.procedureId ?? null,
        exceptionType: data.exceptionType,
        description: data.description,
        financialImpact: data.financialImpact ?? 0,
        resolutionStatus: "open",
        raisedByMembershipId,
      })
      .returning();

    return exception;
  }

  static async updateExceptionStatus(
    tenantId: string,
    resolvedByMembershipId: string,
    exceptionId: string,
    data: {
      resolutionStatus: string;
      managementResponse?: string;
      financialImpact?: number;
    },
  ) {
    const [updated] = await db
      .update(auditExceptions)
      .set({
        resolutionStatus: data.resolutionStatus,
        ...(data.managementResponse !== undefined && {
          managementResponse: data.managementResponse,
        }),
        ...(data.financialImpact !== undefined && {
          financialImpact: data.financialImpact,
        }),
        resolvedByMembershipId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(auditExceptions.tenantId, tenantId),
          eq(auditExceptions.id, exceptionId),
        ),
      )
      .returning();

    if (!updated) {
      throw new ApiError(404, "Exception not found", "EXCEPTION_NOT_FOUND");
    }

    return updated;
  }

  static async getSudSummary(tenantId: string, engagementId: string) {
    // Generate Summary of Unadjusted Differences (SUD)
    const exceptions = await db
      .select()
      .from(auditExceptions)
      .where(
        and(
          eq(auditExceptions.tenantId, tenantId),
          eq(auditExceptions.engagementId, engagementId),
          // typically unadjusted or open are considered for SUD
        ),
      );

    const rawUnadjusted = exceptions
      .filter((e) => e.resolutionStatus === "unadjusted")
      .reduce((sum, e) => sum + (e.financialImpact ?? 0), 0);

    const rawOpen = exceptions
      .filter((e) => e.resolutionStatus === "open")
      .reduce((sum, e) => sum + (e.financialImpact ?? 0), 0);

    const totalUnadjustedImpact = Math.round(rawUnadjusted * 100) / 100;
    const totalOpenImpact = Math.round(rawOpen * 100) / 100;

    return {
      totalUnadjustedImpact,
      totalOpenImpact,
      exceptions,
    };
  }

  // ──────────── REVIEWS ────────────

  static async createReview(
    tenantId: string,
    reviewerMembershipId: string,
    data: {
      engagementId: string;
      reviewType: string;
      findings?: string;
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

    const [review] = await db
      .insert(auditReviews)
      .values({
        tenantId,
        engagementId: data.engagementId,
        reviewType: data.reviewType,
        findings: data.findings,
        status: "in_progress",
        reviewerMembershipId,
      })
      .returning();

    return review;
  }

  static async signOffReview(
    tenantId: string,
    reviewerMembershipId: string,
    reviewId: string,
    data: {
      status: string; // completed, requires_rework
      findings?: string;
    },
  ) {
    const [updated] = await db
      .update(auditReviews)
      .set({
        status: data.status,
        ...(data.findings !== undefined && { findings: data.findings }),
        ...(data.status === "completed" && { signedOffAt: new Date() }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(auditReviews.tenantId, tenantId),
          eq(auditReviews.id, reviewId),
          eq(auditReviews.reviewerMembershipId, reviewerMembershipId), // only the reviewer can sign off
        ),
      )
      .returning();

    if (!updated) {
      throw new ApiError(
        404,
        "Review not found or you are not authorized to sign off this review",
        "REVIEW_NOT_FOUND",
      );
    }

    return updated;
  }

  static async listReviews(tenantId: string, engagementId: string) {
    return db
      .select()
      .from(auditReviews)
      .where(
        and(
          eq(auditReviews.tenantId, tenantId),
          eq(auditReviews.engagementId, engagementId),
        ),
      )
      .orderBy(desc(auditReviews.createdAt));
  }
}
