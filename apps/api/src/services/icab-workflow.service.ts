import {
  db,
  icabForms,
  icabExamRegistrations,
  studentProfiles,
  memberships,
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
    const principal = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.id, principalMembershipId),
        eq(memberships.tenantId, tenantId),
      ),
    });
    if (!principal) {
      throw new ApiError(
        403,
        "Invalid principal membership",
        "INVALID_MEMBERSHIP",
      );
    }

    const form = await db.query.icabForms.findFirst({
      where: and(eq(icabForms.id, formId), eq(icabForms.tenantId, tenantId)),
    });
    if (!form) throw new ApiError(404, "Form not found", "FORM_NOT_FOUND");
    if (form.status !== "draft") {
      throw new ApiError(
        400,
        "Form has already been signed",
        "FORM_ALREADY_SIGNED",
      );
    }
    const [updated] = await db
      .update(icabForms)
      .set({
        status: "principal_signed",
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
    const approver = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.id, approvedByMembershipId),
        eq(memberships.tenantId, tenantId),
      ),
    });
    if (!approver) {
      throw new ApiError(
        403,
        "Invalid approver membership",
        "INVALID_MEMBERSHIP",
      );
    }

    const registration = await db.query.icabExamRegistrations.findFirst({
      where: and(
        eq(icabExamRegistrations.id, registrationId),
        eq(icabExamRegistrations.tenantId, tenantId),
      ),
    });
    if (!registration) {
      throw new ApiError(
        404,
        "Exam registration not found",
        "EXAM_REG_NOT_FOUND",
      );
    }
    if (registration.status !== "applied") {
      throw new ApiError(
        400,
        "Exam registration has already been processed",
        "EXAM_REG_ALREADY_PROCESSED",
      );
    }

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
