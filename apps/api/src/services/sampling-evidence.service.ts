import {
  db,
  auditSamples,
  auditEvidence,
  auditProcedures,
  auditPrograms,
  memberships,
  engagements,
  eq,
  and,
  desc,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class SamplingEvidenceService {
  // ──────────── STATISTICAL SAMPLING ────────────

  static calculateSampleSize(
    populationSize: number,
    confidenceLevelPct: number, // e.g. 9500 = 95%
    tolerableErrorPct: number, // e.g. 500 = 5%
  ): number {
    if (
      !Number.isFinite(populationSize) ||
      !Number.isFinite(confidenceLevelPct) ||
      !Number.isFinite(tolerableErrorPct)
    )
      return 0;
    if (populationSize <= 0) return 0;
    if (populationSize === 1) return 1;

    // Map confidence level to Reliability Factor (R-Factor) per ISA 530
    let rFactor: number;
    if (confidenceLevelPct >= 9900) rFactor = 4.61;
    else if (confidenceLevelPct >= 9500) rFactor = 3.0;
    else if (confidenceLevelPct >= 9000) rFactor = 2.31;
    else if (confidenceLevelPct >= 8000) rFactor = 1.61;
    else rFactor = 1.0;

    // Convert bps to decimal
    const teDecimal = tolerableErrorPct / 10000;

    if (teDecimal <= 0) return populationSize; // avoid division by zero

    // Simplified sample size: R-Factor / Tolerable Error Rate
    const rawSampleSize = rFactor / teDecimal;

    // Apply finite population correction
    const correctedSize =
      (rawSampleSize * populationSize) / (rawSampleSize + populationSize - 1);

    return Math.min(Math.ceil(correctedSize), populationSize);
  }

  static async saveSamplePlan(
    tenantId: string,
    createdByMembershipId: string,
    data: {
      engagementId: string;
      procedureId: string;
      populationSize: number;
      selectionMethod: string;
      confidenceLevelPct?: number;
      tolerableErrorPct?: number;
    },
  ) {
    const procedure = await db.query.auditProcedures.findFirst({
      where: and(
        eq(auditProcedures.tenantId, tenantId),
        eq(auditProcedures.id, data.procedureId),
      ),
    });

    if (!procedure) {
      throw new ApiError(404, "Procedure not found", "PROCEDURE_NOT_FOUND");
    }

    if (procedure.programId) {
      const program = await db.query.auditPrograms.findFirst({
        where: and(
          eq(auditPrograms.id, procedure.programId),
          eq(auditPrograms.tenantId, tenantId),
        ),
      });
      if (!program || program.engagementId !== data.engagementId) {
        throw new ApiError(
          400,
          "Procedure is not part of this engagement",
          "INVALID_PROCEDURE",
        );
      }
    }

    const creator = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.id, createdByMembershipId),
        eq(memberships.tenantId, tenantId),
      ),
    });
    if (!creator) {
      throw new ApiError(
        403,
        "Invalid creator membership",
        "INVALID_MEMBERSHIP",
      );
    }

    const conf = data.confidenceLevelPct ?? 9500;
    const te = data.tolerableErrorPct ?? 500;

    const sampleSize = this.calculateSampleSize(data.populationSize, conf, te);

    const [sample] = await db
      .insert(auditSamples)
      .values({
        tenantId,
        engagementId: data.engagementId,
        procedureId: data.procedureId,
        populationSize: data.populationSize,
        sampleSize,
        selectionMethod: data.selectionMethod,
        confidenceLevelPct: conf,
        tolerableErrorPct: te,
        status: "planned",
        createdByMembershipId,
      })
      .returning();

    return sample;
  }

  // ──────────── EVIDENCE VAULT ────────────

  static async uploadEvidenceMetadata(
    tenantId: string,
    uploadedByMembershipId: string,
    data: {
      engagementId: string;
      procedureId?: string;
      fileName: string;
      fileUrl: string;
      referenceCode?: string;
      description?: string;
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

    if (data.procedureId) {
      const procedure = await db.query.auditProcedures.findFirst({
        where: and(
          eq(auditProcedures.id, data.procedureId),
          eq(auditProcedures.tenantId, tenantId),
        ),
      });
      if (!procedure) {
        throw new ApiError(
          400,
          "Procedure not found in this tenant",
          "INVALID_PROCEDURE",
        );
      }
      const program = await db.query.auditPrograms.findFirst({
        where: and(
          eq(auditPrograms.id, procedure.programId),
          eq(auditPrograms.tenantId, tenantId),
        ),
      });
      if (!program || program.engagementId !== data.engagementId) {
        throw new ApiError(
          400,
          "Procedure is not part of this engagement",
          "INVALID_PROCEDURE",
        );
      }
    }

    const uploader = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.id, uploadedByMembershipId),
        eq(memberships.tenantId, tenantId),
      ),
    });
    if (!uploader) {
      throw new ApiError(
        403,
        "Invalid uploader membership",
        "INVALID_MEMBERSHIP",
      );
    }

    const [evidence] = await db
      .insert(auditEvidence)
      .values({
        tenantId,
        engagementId: data.engagementId,
        procedureId: data.procedureId ?? null,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        referenceCode: data.referenceCode,
        description: data.description,
        uploadedByMembershipId,
      })
      .returning();

    return evidence;
  }

  static async listEvidence(
    tenantId: string,
    engagementId: string,
    options?: { procedureId?: string },
  ) {
    const conditions = [
      eq(auditEvidence.tenantId, tenantId),
      eq(auditEvidence.engagementId, engagementId),
    ];

    if (options?.procedureId) {
      conditions.push(eq(auditEvidence.procedureId, options.procedureId));
    }

    const evidenceList = await db
      .select()
      .from(auditEvidence)
      .where(and(...conditions))
      .orderBy(desc(auditEvidence.createdAt));

    return evidenceList;
  }
}
