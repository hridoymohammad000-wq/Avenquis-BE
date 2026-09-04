import { db, dvsRecords, engagements, eq, and } from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";
import { IDvsProviderAdapter } from "./dvs/dvs-provider.interface.js";
import { IcabDvsAdapter } from "./dvs/icab-dvs.adapter.js";

export class DvsService {
  private static defaultAdapter: IDvsProviderAdapter = new IcabDvsAdapter();

  static setAdapter(adapter: IDvsProviderAdapter) {
    this.defaultAdapter = adapter;
  }

  static async generateDvsCode(
    tenantId: string,
    generatedByMembershipId: string,
    data: {
      engagementId: string;
      documentType: string;
    },
    adapterOverride?: IDvsProviderAdapter,
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

    const adapter = adapterOverride || this.defaultAdapter;
    const providerState = await adapter.getProviderState();

    let result;
    try {
      result = await adapter.generateVerificationCode({
        tenantId,
        engagementId: data.engagementId,
        documentType: data.documentType,
      });
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || String(err);
      if (errMsg.includes("timed out") || errMsg.includes("AbortError")) {
        throw new ApiError(504, "DVS Provider request timed out", "PROVIDER_TIMEOUT");
      }
      if (errMsg.includes("RETRYABLE")) {
        throw new ApiError(503, "DVS Provider temporarily unavailable", "PROVIDER_UNAVAILABLE");
      }
      throw new ApiError(400, `DVS Generation failed: ${errMsg}`, "PROVIDER_ERROR");
    }

    const [record] = await db
      .insert(dvsRecords)
      .values({
        tenantId,
        engagementId: data.engagementId,
        documentType: data.documentType,
        dvsCode: result.dvsCode,
        status: result.status,
        provider: result.provider,
        isAuthoritative: result.isAuthoritative,
        verificationStatus: result.status,
        providerReference: result.externalReference,
        failureReason: result.failureReason,
        generatedByMembershipId,
        auditEvidence: {
          ...result.auditEvidence,
          actorMembershipId: generatedByMembershipId,
          tenantId,
          generatedAt: new Date().toISOString(),
        },
      })
      .returning();

    return {
      ...record,
      status: result.status,
      isAuthoritative: result.isAuthoritative,
      provider: result.provider,
      providerState,
      verificationNote: result.verificationNote,
    };
  }

  static async verifyDvsCode(
    tenantId: string,
    dvsCode: string,
    verifiedByMembershipId?: string,
    adapterOverride?: IDvsProviderAdapter,
  ) {
    // Enforce tenant security: query strictly by tenantId AND dvsCode
    const record = await db.query.dvsRecords.findFirst({
      where: and(
        eq(dvsRecords.tenantId, tenantId),
        eq(dvsRecords.dvsCode, dvsCode),
      ),
    });

    if (!record) {
      throw new ApiError(404, "DVS Code not found or invalid", "DVS_NOT_FOUND");
    }

    const adapter = adapterOverride || this.defaultAdapter;
    const providerState = await adapter.getProviderState();

    let result;
    try {
      result = await adapter.verifyCode(dvsCode, tenantId);
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || String(err);
      if (errMsg.includes("timed out") || errMsg.includes("AbortError")) {
        throw new ApiError(504, "DVS Provider request timed out", "PROVIDER_TIMEOUT");
      }
      if (errMsg.includes("RETRYABLE")) {
        throw new ApiError(503, "DVS Provider temporarily unavailable", "PROVIDER_UNAVAILABLE");
      }
      throw new ApiError(400, `DVS Verification failed: ${errMsg}`, "PROVIDER_ERROR");
    }

    const [updated] = await db
      .update(dvsRecords)
      .set({
        status: result.status,
        verificationStatus: result.status,
        isAuthoritative: result.isAuthoritative,
        providerReference: result.externalReference || record.providerReference,
        failureReason: result.failureReason || record.failureReason,
        verifiedAt: new Date(),
        verifiedByMembershipId: verifiedByMembershipId || record.verifiedByMembershipId,
        auditEvidence: {
          ...(typeof record.auditEvidence === "object" && record.auditEvidence !== null
            ? record.auditEvidence
            : {}),
          ...result.auditEvidence,
          lastVerifiedAt: new Date().toISOString(),
          verifiedByMembershipId,
        },
        updatedAt: new Date(),
      })
      .where(and(eq(dvsRecords.tenantId, tenantId), eq(dvsRecords.id, record.id)))
      .returning();

    return {
      ...updated,
      status: result.status,
      isAuthoritative: result.isAuthoritative,
      provider: result.provider,
      providerState,
      verificationNote: result.verificationNote,
    };
  }

  static async recordManualDvs(
    tenantId: string,
    engagementId: string,
    recordedByMembershipId: string,
    data: {
      documentType: string;
      dvsCode: string;
      provider?: string;
      providerReference?: string;
    }
  ) {
    const engagement = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.tenantId, tenantId),
        eq(engagements.id, engagementId),
      ),
    });

    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }

    const [record] = await db
      .insert(dvsRecords)
      .values({
        tenantId,
        engagementId,
        documentType: data.documentType,
        dvsCode: data.dvsCode,
        status: "VERIFIED",
        provider: data.provider || "MANUAL_DVS",
        isAuthoritative: false,
        verificationStatus: "VERIFIED",
        providerReference: data.providerReference,
        generatedByMembershipId: recordedByMembershipId,
        verifiedByMembershipId: recordedByMembershipId,
        verifiedAt: new Date(),
        auditEvidence: {
          manual: true,
          actorMembershipId: recordedByMembershipId,
          tenantId,
          generatedAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
        },
      })
      .returning();

    return {
      ...record,
      status: "VERIFIED",
      isAuthoritative: false,
      provider: record.provider,
      providerState: "MANUAL_REQUIRED",
      verificationNote: "DVS code recorded manually by user",
    };
  }

  static async getEngagementDvsRecords(tenantId: string, engagementId: string) {
    const engagement = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.tenantId, tenantId),
        eq(engagements.id, engagementId),
      ),
    });

    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }

    const records = await db
      .select()
      .from(dvsRecords)
      .where(
        and(
          eq(dvsRecords.tenantId, tenantId),
          eq(dvsRecords.engagementId, engagementId),
        ),
      );

    const providerState = await this.defaultAdapter.getProviderState();

    return records.map((r) => ({
      ...r,
      isAuthoritative: r.isAuthoritative,
      provider: r.provider || "ICAB_DVS",
      providerState,
      verificationNote: r.isAuthoritative
        ? "Verified via authoritative ICAB endpoint"
        : "Local offline record. Live ICAB endpoint unconfigured.",
    }));
  }
}
