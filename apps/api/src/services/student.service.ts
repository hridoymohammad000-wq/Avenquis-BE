import {
  db,
  studentProfiles,
  studentTrainingRecords,
  studentLeaveRecords,
  studentExamRecords,
  studentAssignmentHistory,
  memberships,
  userProfiles,
  eq,
  and,
  desc,
  ilike,
  or,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class StudentService {
  static async listStudents(
    tenantId: string,
    options?: {
      status?: string;
      courseLevel?: string;
      principalMembershipId?: string;
      search?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const conditions = [eq(studentProfiles.tenantId, tenantId)];

    if (options?.status) {
      conditions.push(eq(studentProfiles.status, options.status));
    }
    if (options?.courseLevel) {
      conditions.push(eq(studentProfiles.courseLevel, options.courseLevel));
    }
    if (options?.principalMembershipId) {
      conditions.push(
        eq(
          studentProfiles.principalMembershipId,
          options.principalMembershipId,
        ),
      );
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      conditions.push(
        or(
          ilike(studentProfiles.registrationNumber, searchPattern),
          ilike(userProfiles.fullName, searchPattern),
          ilike(userProfiles.email, searchPattern),
        )!,
      );
    }

    const rows = await db
      .select({
        id: studentProfiles.id,
        tenantId: studentProfiles.tenantId,
        membershipId: studentProfiles.membershipId,
        registrationNumber: studentProfiles.registrationNumber,
        principalMembershipId: studentProfiles.principalMembershipId,
        courseLevel: studentProfiles.courseLevel,
        articleshipStartDate: studentProfiles.articleshipStartDate,
        articleshipEndDate: studentProfiles.articleshipEndDate,
        status: studentProfiles.status,
        fullName: userProfiles.fullName,
        email: userProfiles.email,
        avatarUrl: userProfiles.avatarUrl,
        createdAt: studentProfiles.createdAt,
      })
      .from(studentProfiles)
      .innerJoin(memberships, eq(studentProfiles.membershipId, memberships.id))
      .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(studentProfiles.registrationNumber);

    return rows;
  }

  static async getStudentById(tenantId: string, studentId: string) {
    const [student] = await db
      .select({
        id: studentProfiles.id,
        tenantId: studentProfiles.tenantId,
        membershipId: studentProfiles.membershipId,
        registrationNumber: studentProfiles.registrationNumber,
        principalMembershipId: studentProfiles.principalMembershipId,
        courseLevel: studentProfiles.courseLevel,
        articleshipStartDate: studentProfiles.articleshipStartDate,
        articleshipEndDate: studentProfiles.articleshipEndDate,
        status: studentProfiles.status,
        emergencyContact: studentProfiles.emergencyContact,
        address: studentProfiles.address,
        fullName: userProfiles.fullName,
        email: userProfiles.email,
        avatarUrl: userProfiles.avatarUrl,
        createdAt: studentProfiles.createdAt,
        updatedAt: studentProfiles.updatedAt,
      })
      .from(studentProfiles)
      .innerJoin(memberships, eq(studentProfiles.membershipId, memberships.id))
      .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
      .where(
        and(
          eq(studentProfiles.tenantId, tenantId),
          eq(studentProfiles.id, studentId),
        ),
      );

    if (!student) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }

    const trainingRecords = await db
      .select()
      .from(studentTrainingRecords)
      .where(
        and(
          eq(studentTrainingRecords.tenantId, tenantId),
          eq(studentTrainingRecords.studentId, studentId),
        ),
      )
      .orderBy(desc(studentTrainingRecords.createdAt));

    const leaveRecords = await db
      .select()
      .from(studentLeaveRecords)
      .where(
        and(
          eq(studentLeaveRecords.tenantId, tenantId),
          eq(studentLeaveRecords.studentId, studentId),
        ),
      )
      .orderBy(desc(studentLeaveRecords.startDate));

    const examRecords = await db
      .select()
      .from(studentExamRecords)
      .where(
        and(
          eq(studentExamRecords.tenantId, tenantId),
          eq(studentExamRecords.studentId, studentId),
        ),
      )
      .orderBy(desc(studentExamRecords.createdAt));

    const assignmentHistory = await db
      .select()
      .from(studentAssignmentHistory)
      .where(
        and(
          eq(studentAssignmentHistory.tenantId, tenantId),
          eq(studentAssignmentHistory.studentId, studentId),
        ),
      )
      .orderBy(desc(studentAssignmentHistory.startDate));

    return {
      ...student,
      trainingRecords,
      leaveRecords,
      examRecords,
      assignmentHistory,
    };
  }

  static async getStudentDashboard(tenantId: string, studentId: string) {
    const student = await this.getStudentById(tenantId, studentId);

    // Calculate Articleship days
    const now = new Date();
    const startDate = new Date(student.articleshipStartDate);
    const endDate = student.articleshipEndDate
      ? new Date(student.articleshipEndDate)
      : new Date(startDate.getTime() + 3 * 365 * 24 * 60 * 60 * 1000); // Default 3 years articleship

    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const completedDays = Math.max(
      0,
      Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const remainingDays = Math.max(0, totalDays - completedDays);

    // Training hours summary
    const totalTrainingHours = student.trainingRecords.reduce(
      (sum, r) => sum + r.hoursCompleted,
      0,
    );
    const verifiedTrainingHours = student.trainingRecords
      .filter((r) => r.verifiedAt !== null)
      .reduce((sum, r) => sum + r.hoursCompleted, 0);

    // Leave summary
    const approvedLeaveDays = student.leaveRecords
      .filter((r) => r.status === "approved")
      .reduce((sum, r) => sum + r.totalDays, 0);
    const pendingLeaveDays = student.leaveRecords
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + r.totalDays, 0);

    // Exams summary
    const examsPassed = student.examRecords.filter(
      (r) => r.resultStatus === "passed",
    ).length;
    const examsFailed = student.examRecords.filter(
      (r) => r.resultStatus === "jailed",
    ).length;

    return {
      studentId: student.id,
      registrationNumber: student.registrationNumber,
      courseLevel: student.courseLevel,
      status: student.status,
      articleship: {
        startDate,
        endDate,
        totalDays,
        completedDays,
        remainingDays,
      },
      training: {
        totalHours: totalTrainingHours,
        verifiedHours: verifiedTrainingHours,
      },
      leaves: {
        approvedDays: approvedLeaveDays,
        pendingDays: pendingLeaveDays,
      },
      exams: {
        passed: examsPassed,
        failed: examsFailed,
        totalAppeared: student.examRecords.length,
      },
    };
  }

  static async createStudent(
    tenantId: string,
    data: {
      membershipId: string;
      registrationNumber: string;
      principalMembershipId?: string;
      courseLevel?: string;
      articleshipStartDate?: Date;
      articleshipEndDate?: Date;
      status?: string;
      emergencyContact?: Record<string, unknown>;
      address?: Record<string, unknown>;
    },
  ) {
    const existing = await db.query.studentProfiles.findFirst({
      where: and(
        eq(studentProfiles.tenantId, tenantId),
        eq(studentProfiles.registrationNumber, data.registrationNumber),
      ),
    });

    if (existing) {
      throw new ApiError(
        409,
        `Student registration number '${data.registrationNumber}' already exists in this tenant`,
        "REGISTRATION_NUMBER_EXISTS",
      );
    }

    const [newStudent] = await db
      .insert(studentProfiles)
      .values({
        tenantId,
        membershipId: data.membershipId,
        registrationNumber: data.registrationNumber,
        principalMembershipId: data.principalMembershipId,
        courseLevel: data.courseLevel ?? "knowledge",
        articleshipStartDate: data.articleshipStartDate ?? new Date(),
        articleshipEndDate: data.articleshipEndDate,
        status: data.status ?? "active",
        emergencyContact: data.emergencyContact,
        address: data.address,
      })
      .returning();

    return newStudent;
  }

  static async updateStudent(
    tenantId: string,
    studentId: string,
    data: Partial<{
      courseLevel: string;
      principalMembershipId: string | null;
      articleshipEndDate: Date | null;
      status: string;
      emergencyContact: Record<string, unknown>;
      address: Record<string, unknown>;
    }>,
  ) {
    const existing = await db.query.studentProfiles.findFirst({
      where: and(
        eq(studentProfiles.tenantId, tenantId),
        eq(studentProfiles.id, studentId),
      ),
    });

    if (!existing) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }

    const [updated] = await db
      .update(studentProfiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(studentProfiles.tenantId, tenantId),
          eq(studentProfiles.id, studentId),
        ),
      )
      .returning();

    return updated;
  }

  static async logTraining(
    tenantId: string,
    studentId: string,
    data: {
      topic: string;
      hoursCompleted: number;
      supervisorMembershipId?: string;
      remarks?: string;
      verifyNow?: boolean;
    },
  ) {
    const student = await db.query.studentProfiles.findFirst({
      where: and(
        eq(studentProfiles.tenantId, tenantId),
        eq(studentProfiles.id, studentId),
      ),
    });

    if (!student) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }

    const [record] = await db
      .insert(studentTrainingRecords)
      .values({
        tenantId,
        studentId,
        topic: data.topic,
        hoursCompleted: data.hoursCompleted,
        supervisorMembershipId: data.supervisorMembershipId,
        remarks: data.remarks,
        verifiedAt: data.verifyNow ? new Date() : null,
      })
      .returning();

    return record;
  }

  static async applyLeave(
    tenantId: string,
    studentId: string,
    data: {
      leaveType: string;
      startDate: Date;
      endDate: Date;
      totalDays: number;
      remarks?: string;
    },
  ) {
    const student = await db.query.studentProfiles.findFirst({
      where: and(
        eq(studentProfiles.tenantId, tenantId),
        eq(studentProfiles.id, studentId),
      ),
    });

    if (!student) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }

    const [leave] = await db
      .insert(studentLeaveRecords)
      .values({
        tenantId,
        studentId,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays,
        status: "pending",
        remarks: data.remarks,
      })
      .returning();

    return leave;
  }

  static async updateLeaveStatus(
    tenantId: string,
    leaveId: string,
    data: {
      status: "approved" | "rejected";
      approvedByMembershipId?: string;
      remarks?: string;
    },
  ) {
    const existing = await db.query.studentLeaveRecords.findFirst({
      where: and(
        eq(studentLeaveRecords.tenantId, tenantId),
        eq(studentLeaveRecords.id, leaveId),
      ),
    });

    if (!existing) {
      throw new ApiError(404, "Leave record not found", "LEAVE_NOT_FOUND");
    }

    const [updated] = await db
      .update(studentLeaveRecords)
      .set({
        status: data.status,
        approvedByMembershipId: data.approvedByMembershipId,
        remarks: data.remarks ?? existing.remarks,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(studentLeaveRecords.tenantId, tenantId),
          eq(studentLeaveRecords.id, leaveId),
        ),
      )
      .returning();

    return updated;
  }

  static async recordExamResult(
    tenantId: string,
    studentId: string,
    data: {
      session: string;
      level: string;
      subject: string;
      resultStatus: string;
      marks?: number;
      examDate?: Date;
    },
  ) {
    const student = await db.query.studentProfiles.findFirst({
      where: and(
        eq(studentProfiles.tenantId, tenantId),
        eq(studentProfiles.id, studentId),
      ),
    });

    if (!student) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }

    const [exam] = await db
      .insert(studentExamRecords)
      .values({
        tenantId,
        studentId,
        session: data.session,
        level: data.level,
        subject: data.subject,
        resultStatus: data.resultStatus,
        marks: data.marks,
        examDate: data.examDate,
      })
      .returning();

    // If passed knowledge level, auto-upgrade student course level if currently knowledge
    if (data.resultStatus === "passed" && data.level === "knowledge") {
      await db
        .update(studentProfiles)
        .set({ courseLevel: "application", updatedAt: new Date() })
        .where(eq(studentProfiles.id, studentId));
    }

    return exam;
  }

  static async logAssignment(
    tenantId: string,
    studentId: string,
    data: {
      clientName: string;
      role: string;
      startDate: Date;
      endDate?: Date;
      hoursLogged?: number;
      remarks?: string;
    },
  ) {
    const student = await db.query.studentProfiles.findFirst({
      where: and(
        eq(studentProfiles.tenantId, tenantId),
        eq(studentProfiles.id, studentId),
      ),
    });

    if (!student) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }

    const [assignment] = await db
      .insert(studentAssignmentHistory)
      .values({
        tenantId,
        studentId,
        clientName: data.clientName,
        role: data.role,
        startDate: data.startDate,
        endDate: data.endDate,
        hoursLogged: data.hoursLogged ?? 0,
        remarks: data.remarks,
      })
      .returning();

    return assignment;
  }
}
