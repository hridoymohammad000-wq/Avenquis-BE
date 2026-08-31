import { db, dvsRecords, engagements, eq, and } from "@avenquis/database";
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

    return record;
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

    return record;
  }

  static async getEngagementDvsRecords(tenantId: string, engagementId: string) {
    return db
      .select()
      .from(dvsRecords)
      .where(
        and(
          eq(dvsRecords.tenantId, tenantId),
          eq(dvsRecords.engagementId, engagementId),
        ),
      );
  }
}
