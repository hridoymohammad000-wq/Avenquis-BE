import {
  db,
  dvsRecords,
  engagements,
  memberships,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";
import { randomBytes } from "crypto";

export class DvsService {
  static async generateDvsCode(
    tenantId: string,
    generatedByMembershipId: string,
    data: {
      engagementId: string;
      documentType: string;
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

    const generator = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.id, generatedByMembershipId),
        eq(memberships.tenantId, tenantId),
      ),
    });
    if (!generator) {
      throw new ApiError(
        403,
        "Invalid generator membership",
        "INVALID_MEMBERSHIP",
      );
    }

    // Mocking the DVS generation logic which would normally call ICAB's API
    const uniqueSegment = randomBytes(4).toString("hex").toUpperCase();
    const dvsCode = `DVS-${new Date().getFullYear()}-${uniqueSegment}`;

    const [record] = await db
      .insert(dvsRecords)
      .values({
        tenantId,
        engagementId: data.engagementId,
        documentType: data.documentType,
        dvsCode,
        status: "generated",
        generatedByMembershipId,
      })
      .returning();

    return {
      ...record,
      isAuthoritative: false,
      provider: "ICAB_DVS_STUB",
      verificationNote:
        "Local offline generation. Direct ICAB API credentials required for authoritative verification.",
    };
  }

  static async verifyDvsCode(tenantId: string, dvsCode: string) {
    const record = await db.query.dvsRecords.findFirst({
      where: and(
        eq(dvsRecords.tenantId, tenantId),
        eq(dvsRecords.dvsCode, dvsCode),
      ),
    });

    if (!record) {
      throw new ApiError(404, "DVS Code not found or invalid", "DVS_NOT_FOUND");
    }

    return {
      ...record,
      isAuthoritative: false,
      provider: "ICAB_DVS_STUB",
      verificationNote:
        "Verified against local database record. Not verified via live ICAB server endpoint.",
    };
  }

  static async getEngagementDvsRecords(tenantId: string, engagementId: string) {
    const records = await db
      .select()
      .from(dvsRecords)
      .where(
        and(
          eq(dvsRecords.tenantId, tenantId),
          eq(dvsRecords.engagementId, engagementId),
        ),
      );

    return records.map((r) => ({
      ...r,
      isAuthoritative: false,
      provider: "ICAB_DVS_STUB",
    }));
  }
}
