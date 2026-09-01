import {
  db,
  auditQualityControls,
  engagements,
  memberships,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class QualityControlService {
  static async addQcItem(
    tenantId: string,
    data: {
      engagementId: string;
      category: string;
      questionText: string;
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

    const [qcItem] = await db
      .insert(auditQualityControls)
      .values({
        tenantId,
        engagementId: data.engagementId,
        category: data.category,
        questionText: data.questionText,
        isCompliant: false,
      })
      .returning();

    return qcItem;
  }

  static async evaluateQcItem(
    tenantId: string,
    evaluatedByMembershipId: string,
    id: string,
    data: {
      isCompliant: boolean;
      comments?: string;
    },
  ) {
    const evaluator = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.id, evaluatedByMembershipId),
        eq(memberships.tenantId, tenantId),
      ),
    });
    if (!evaluator) {
      throw new ApiError(
        403,
        "Invalid evaluator membership",
        "INVALID_MEMBERSHIP",
      );
    }

    const [updated] = await db
      .update(auditQualityControls)
      .set({
        isCompliant: data.isCompliant,
        ...(data.comments !== undefined && { comments: data.comments }),
        evaluatedByMembershipId,
        evaluatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(auditQualityControls.tenantId, tenantId),
          eq(auditQualityControls.id, id),
        ),
      )
      .returning();

    if (!updated) {
      throw new ApiError(404, "QC item not found", "QC_ITEM_NOT_FOUND");
    }

    return updated;
  }

  static async getQcItems(tenantId: string, engagementId: string) {
    return db
      .select()
      .from(auditQualityControls)
      .where(
        and(
          eq(auditQualityControls.tenantId, tenantId),
          eq(auditQualityControls.engagementId, engagementId),
        ),
      );
  }
}
