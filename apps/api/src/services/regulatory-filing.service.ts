import {
  db,
  regulatoryFilings,
  engagements,
  memberships,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class RegulatoryFilingService {
  static async createFiling(
    tenantId: string,
    createdByMembershipId: string,
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

    const creator = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.id, createdByMembershipId),
        eq(memberships.tenantId, tenantId),
      ),
    });
    if (!creator)
      throw new ApiError(
        403,
        "Invalid creator membership",
        "INVALID_MEMBERSHIP",
      );

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

    return {
      ...filing,
      isExternalIntegration: false,
      submissionChannel: "INTERNAL_FIRM_TRACKER",
      note: "Internal compliance ledger entry. Direct portal API connection not configured.",
    };
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
    const submitter = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.id, submittedByMembershipId),
        eq(memberships.tenantId, tenantId),
      ),
    });
    if (!submitter)
      throw new ApiError(
        403,
        "Invalid submitter membership",
        "INVALID_MEMBERSHIP",
      );
    const filing = await db.query.regulatoryFilings.findFirst({
      where: and(
        eq(regulatoryFilings.id, filingId),
        eq(regulatoryFilings.tenantId, tenantId),
      ),
    });
    if (!filing)
      throw new ApiError(404, "Filing not found", "FILING_NOT_FOUND");
    const allowed: Record<string, string[]> = {
      pending: ["submitted"],
      submitted: ["accepted", "rejected"],
      accepted: [],
      rejected: ["submitted"],
    };
    if (
      data.status !== filing.status &&
      !allowed[filing.status]?.includes(data.status)
    ) {
      throw new ApiError(
        400,
        "Invalid filing status transition",
        "INVALID_STATUS_TRANSITION",
      );
    }

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

    return {
      ...updated,
      isExternalIntegration: false,
      submissionChannel: "INTERNAL_FIRM_TRACKER",
    };
  }

  static async getEngagementFilings(tenantId: string, engagementId: string) {
    const filings = await db
      .select()
      .from(regulatoryFilings)
      .where(
        and(
          eq(regulatoryFilings.tenantId, tenantId),
          eq(regulatoryFilings.engagementId, engagementId),
        ),
      );

    return filings.map((f) => ({
      ...f,
      isExternalIntegration: false,
      submissionChannel: "INTERNAL_FIRM_TRACKER",
    }));
  }
}
