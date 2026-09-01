import {
  db,
  auditPrograms,
  auditProcedures,
  engagements,
  memberships,
  riskAssessments,
  eq,
  and,
  desc,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class AuditProgramService {
  // ──────────── AUDIT PROGRAMS ────────────

  static async createProgram(
    tenantId: string,
    preparedByMembershipId: string,
    data: {
      engagementId: string;
      name: string;
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

    const preparer = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.id, preparedByMembershipId),
        eq(memberships.tenantId, tenantId),
      ),
    });
    if (!preparer) {
      throw new ApiError(
        403,
        "Invalid preparer membership",
        "INVALID_MEMBERSHIP",
      );
    }

    const [program] = await db
      .insert(auditPrograms)
      .values({
        tenantId,
        engagementId: data.engagementId,
        name: data.name,
        description: data.description,
        preparedByMembershipId,
        status: "draft",
      })
      .returning();

    return program;
  }

  static async listPrograms(tenantId: string, engagementId: string) {
    const programs = await db
      .select()
      .from(auditPrograms)
      .where(
        and(
          eq(auditPrograms.tenantId, tenantId),
          eq(auditPrograms.engagementId, engagementId),
        ),
      )
      .orderBy(desc(auditPrograms.createdAt));

    return programs;
  }

  static async getProgramDetails(tenantId: string, programId: string) {
    const program = await db.query.auditPrograms.findFirst({
      where: and(
        eq(auditPrograms.tenantId, tenantId),
        eq(auditPrograms.id, programId),
      ),
      with: {
        // Unfortunately, relations weren't declared in schema.ts, so we have to manually fetch procedures
      },
    });

    if (!program) {
      throw new ApiError(404, "Audit program not found", "PROGRAM_NOT_FOUND");
    }

    const procedures = await db
      .select()
      .from(auditProcedures)
      .where(
        and(
          eq(auditProcedures.tenantId, tenantId),
          eq(auditProcedures.programId, programId),
        ),
      )
      .orderBy(desc(auditProcedures.createdAt));

    return { ...program, procedures };
  }

  // ──────────── AUDIT PROCEDURES ────────────

  static async addProcedure(
    tenantId: string,
    programId: string,
    data: {
      riskAssessmentId?: string;
      assertion?: string;
      procedureText: string;
      procedureType: string;
      assignedToMembershipId?: string;
    },
  ) {
    const program = await db.query.auditPrograms.findFirst({
      where: and(
        eq(auditPrograms.tenantId, tenantId),
        eq(auditPrograms.id, programId),
      ),
    });

    if (!program) {
      throw new ApiError(404, "Audit program not found", "PROGRAM_NOT_FOUND");
    }

    if (data.riskAssessmentId) {
      const risk = await db.query.riskAssessments.findFirst({
        where: and(
          eq(riskAssessments.id, data.riskAssessmentId),
          eq(riskAssessments.tenantId, tenantId),
          eq(riskAssessments.engagementId, program.engagementId),
        ),
      });
      if (!risk) {
        throw new ApiError(
          400,
          "Risk assessment is not part of this engagement",
          "INVALID_RISK_ASSESSMENT",
        );
      }
    }

    if (data.assignedToMembershipId) {
      const assignee = await db.query.memberships.findFirst({
        where: and(
          eq(memberships.id, data.assignedToMembershipId),
          eq(memberships.tenantId, tenantId),
        ),
      });
      if (!assignee) {
        throw new ApiError(
          400,
          "Assigned member is not part of this tenant",
          "INVALID_ASSIGNEE",
        );
      }
    }

    const [procedure] = await db
      .insert(auditProcedures)
      .values({
        tenantId,
        programId,
        riskAssessmentId: data.riskAssessmentId ?? null,
        assertion: data.assertion,
        procedureText: data.procedureText,
        procedureType: data.procedureType,
        assignedToMembershipId: data.assignedToMembershipId ?? null,
        status: "not_started",
      })
      .returning();

    return procedure;
  }

  static async updateProcedureStatus(
    tenantId: string,
    procedureId: string,
    data: {
      status: string;
      workPaperReference?: string;
      results?: string;
    },
  ) {
    const [updated] = await db
      .update(auditProcedures)
      .set({
        status: data.status,
        ...(data.workPaperReference !== undefined && {
          workPaperReference: data.workPaperReference,
        }),
        ...(data.results !== undefined && { results: data.results }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(auditProcedures.tenantId, tenantId),
          eq(auditProcedures.id, procedureId),
        ),
      )
      .returning();

    if (!updated) {
      throw new ApiError(404, "Procedure not found", "PROCEDURE_NOT_FOUND");
    }

    return updated;
  }
}
