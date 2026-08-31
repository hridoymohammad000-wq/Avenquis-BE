import {
  db,
  regulatoryFilings,
  engagements,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class RegulatoryFilingService {
  static async createFiling(
    tenantId: string,
    data: {
      engagementId: string;
      regulator: string;
      filingType: string;
      documentUrl?: string;
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

    const [filing] = await db
      .insert(regulatoryFilings)
      .values({
        tenantId,
        engagementId: data.engagementId,
        regulator: data.regulator,
        filingType: data.filingType,
        documentUrl: data.documentUrl,
        status: "pending",
      })
      .returning();

    return filing;
  }

  static async updateFilingStatus(
    tenantId: string,
    filingId: string,
    submittedByMembershipId: string,
    data: {
      status: string;
      referenceNumber?: string;
    },
  ) {
    const [updated] = await db
      .update(regulatoryFilings)
      .set({
        status: data.status,
        referenceNumber: data.referenceNumber,
        submittedByMembershipId:
          data.status === "submitted" ? submittedByMembershipId : undefined,
        filingDate: data.status === "submitted" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(regulatoryFilings.tenantId, tenantId),
          eq(regulatoryFilings.id, filingId),
        ),
      )
      .returning();

    if (!updated) {
      throw new ApiError(404, "Filing not found", "FILING_NOT_FOUND");
    }

    return updated;
  }

  static async getEngagementFilings(tenantId: string, engagementId: string) {
    return db
      .select()
      .from(regulatoryFilings)
      .where(
        and(
          eq(regulatoryFilings.tenantId, tenantId),
          eq(regulatoryFilings.engagementId, engagementId),
        ),
      );
  }
}
