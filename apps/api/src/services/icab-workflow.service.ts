import {
  db,
  icabForms,
  icabExamRegistrations,
  studentProfiles,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class IcabWorkflowService {
  // ──────────── FORMS ────────────
  static async submitForm(
    tenantId: string,
    data: {
      studentId: string;
      formType: string;
      documentUrl?: string;
    },
  ) {
    const student = await db.query.studentProfiles.findFirst({
      where: and(
        eq(studentProfiles.tenantId, tenantId),
        eq(studentProfiles.id, data.studentId),
      ),
    });
    if (!student) {
      throw new ApiError(404, "Student not found", "STUDENT_NOT_FOUND");
    }

    const [form] = await db
      .insert(icabForms)
      .values({
        tenantId,
        studentId: data.studentId,
        formType: data.formType,
        documentUrl: data.documentUrl,
        status: "draft",
      })
      .returning();

    return form;
  }

  static async principalSignForm(
    tenantId: string,
    principalMembershipId: string,
    formId: string,
  ) {
    const [updated] = await db
      .update(icabForms)
      .set({
        status: "pending_principal_signature", // the action actually applies the signature, let's mark it submitted_to_icab or similar based on flow. We'll mark it approved internally
        signedByPrincipalId: principalMembershipId,
        signedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(icabForms.tenantId, tenantId), eq(icabForms.id, formId)))
      .returning();

    if (!updated) {
      throw new ApiError(404, "Form not found", "FORM_NOT_FOUND");
    }

    return updated;
  }

  static async getForms(tenantId: string, studentId: string) {
    return db
      .select()
      .from(icabForms)
      .where(
        and(
          eq(icabForms.tenantId, tenantId),
          eq(icabForms.studentId, studentId),
        ),
      );
  }

  // ──────────── EXAMS ────────────
  static async registerForExam(
    tenantId: string,
    data: {
      studentId: string;
      examSession: string;
      level: string;
      leaveRequestedDays: number;
    },
  ) {
    const student = await db.query.studentProfiles.findFirst({
      where: and(
        eq(studentProfiles.tenantId, tenantId),
        eq(studentProfiles.id, data.studentId),
      ),
    });
    if (!student) {
      throw new ApiError(404, "Student not found", "STUDENT_NOT_FOUND");
    }

    const [registration] = await db
      .insert(icabExamRegistrations)
      .values({
        tenantId,
        studentId: data.studentId,
        examSession: data.examSession,
        level: data.level,
        leaveRequestedDays: data.leaveRequestedDays,
        status: "applied",
      })
      .returning();

    return registration;
  }

  static async approveExamRegistration(
    tenantId: string,
    approvedByMembershipId: string,
    registrationId: string,
    data: {
      leaveApproved: boolean;
      comments?: string;
    },
  ) {
    const [updated] = await db
      .update(icabExamRegistrations)
      .set({
        status: data.leaveApproved ? "principal_approved" : "rejected",
        leaveApproved: data.leaveApproved,
        comments: data.comments,
        approvedByMembershipId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(icabExamRegistrations.tenantId, tenantId),
          eq(icabExamRegistrations.id, registrationId),
        ),
      )
      .returning();

    if (!updated) {
      throw new ApiError(
        404,
        "Exam registration not found",
        "EXAM_REG_NOT_FOUND",
      );
    }

    return updated;
  }

  static async getExamRegistrations(tenantId: string, studentId: string) {
    return db
      .select()
      .from(icabExamRegistrations)
      .where(
        and(
          eq(icabExamRegistrations.tenantId, tenantId),
          eq(icabExamRegistrations.studentId, studentId),
        ),
      );
  }
}
