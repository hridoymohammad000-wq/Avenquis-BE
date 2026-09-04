import {
  db,
  departments,
  designations,
  staffProfiles,
  staffLifecycleEvents,
  memberships,
  userProfiles,
  eq,
  and,
  desc,
  ilike,
  or,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class StaffService {
  // --- Departments ---
  static async listDepartments(tenantId: string) {
    return db
      .select()
      .from(departments)
      .where(eq(departments.tenantId, tenantId))
      .orderBy(departments.name);
  }

  static async createDepartment(
    tenantId: string,
    data: {
      name: string;
      code: string;
      description?: string;
      headMembershipId?: string;
    },
  ) {
    const existing = await db.query.departments.findFirst({
      where: and(
        eq(departments.tenantId, tenantId),
        eq(departments.code, data.code.toUpperCase()),
      ),
    });

    if (existing) {
      throw new ApiError(
        409,
        "Department with this code already exists in this tenant",
        "DEPARTMENT_EXISTS",
      );
    }

    const [dept] = await db
      .insert(departments)
      .values({
        tenantId,
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        headMembershipId: data.headMembershipId,
      })
      .returning();

    return dept;
  }

  // --- Designations ---
  static async listDesignations(tenantId: string) {
    return db
      .select()
      .from(designations)
      .where(eq(designations.tenantId, tenantId))
      .orderBy(desc(designations.level), designations.name);
  }

  static async createDesignation(
    tenantId: string,
    data: {
      name: string;
      code: string;
      level?: number;
      description?: string;
    },
  ) {
    const existing = await db.query.designations.findFirst({
      where: and(
        eq(designations.tenantId, tenantId),
        eq(designations.code, data.code.toUpperCase()),
      ),
    });

    if (existing) {
      throw new ApiError(
        409,
        "Designation with this code already exists in this tenant",
        "DESIGNATION_EXISTS",
      );
    }

    const [desig] = await db
      .insert(designations)
      .values({
        tenantId,
        name: data.name,
        code: data.code.toUpperCase(),
        level: data.level ?? 1,
        description: data.description,
      })
      .returning();

    return desig;
  }

  // --- Staff Profiles ---
  static async listStaff(
    tenantId: string,
    options?: {
      departmentId?: string;
      designationId?: string;
      status?: string;
      search?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const conditions = [eq(staffProfiles.tenantId, tenantId)];

    if (options?.departmentId) {
      conditions.push(eq(staffProfiles.departmentId, options.departmentId));
    }
    if (options?.designationId) {
      conditions.push(eq(staffProfiles.designationId, options.designationId));
    }
    if (options?.status) {
      conditions.push(eq(staffProfiles.status, options.status));
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      conditions.push(
        or(
          ilike(staffProfiles.employeeCode, searchPattern),
          ilike(userProfiles.fullName, searchPattern),
          ilike(userProfiles.email, searchPattern),
        )!,
      );
    }

    const rows = await db
      .select({
        id: staffProfiles.id,
        tenantId: staffProfiles.tenantId,
        membershipId: staffProfiles.membershipId,
        employeeCode: staffProfiles.employeeCode,
        departmentId: staffProfiles.departmentId,
        departmentName: departments.name,
        designationId: staffProfiles.designationId,
        designationName: designations.name,
        employmentType: staffProfiles.employmentType,
        status: staffProfiles.status,
        joiningDate: staffProfiles.joiningDate,
        exitDate: staffProfiles.exitDate,
        phone: staffProfiles.phone,
        emergencyContact: staffProfiles.emergencyContact,
        bio: staffProfiles.bio,
        fullName: userProfiles.fullName,
        email: userProfiles.email,
        avatarUrl: userProfiles.avatarUrl,
        createdAt: staffProfiles.createdAt,
      })
      .from(staffProfiles)
      .innerJoin(memberships, eq(staffProfiles.membershipId, memberships.id))
      .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
      .leftJoin(departments, eq(staffProfiles.departmentId, departments.id))
      .leftJoin(designations, eq(staffProfiles.designationId, designations.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(staffProfiles.employeeCode);

    return rows;
  }

  static async getStaffById(tenantId: string, staffId: string) {
    const [staff] = await db
      .select({
        id: staffProfiles.id,
        tenantId: staffProfiles.tenantId,
        membershipId: staffProfiles.membershipId,
        employeeCode: staffProfiles.employeeCode,
        departmentId: staffProfiles.departmentId,
        departmentName: departments.name,
        designationId: staffProfiles.designationId,
        designationName: designations.name,
        employmentType: staffProfiles.employmentType,
        status: staffProfiles.status,
        joiningDate: staffProfiles.joiningDate,
        exitDate: staffProfiles.exitDate,
        phone: staffProfiles.phone,
        emergencyContact: staffProfiles.emergencyContact,
        address: staffProfiles.address,
        bio: staffProfiles.bio,
        fullName: userProfiles.fullName,
        email: userProfiles.email,
        avatarUrl: userProfiles.avatarUrl,
        createdAt: staffProfiles.createdAt,
        updatedAt: staffProfiles.updatedAt,
      })
      .from(staffProfiles)
      .innerJoin(memberships, eq(staffProfiles.membershipId, memberships.id))
      .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
      .leftJoin(departments, eq(staffProfiles.departmentId, departments.id))
      .leftJoin(designations, eq(staffProfiles.designationId, designations.id))
      .where(
        and(
          eq(staffProfiles.tenantId, tenantId),
          eq(staffProfiles.id, staffId),
        ),
      );

    if (!staff) {
      throw new ApiError(404, "Staff profile not found", "STAFF_NOT_FOUND");
    }

    const history = await db
      .select()
      .from(staffLifecycleEvents)
      .where(
        and(
          eq(staffLifecycleEvents.tenantId, tenantId),
          eq(staffLifecycleEvents.staffId, staffId),
        ),
      )
      .orderBy(desc(staffLifecycleEvents.effectiveDate));

    return { ...staff, lifecycleHistory: history };
  }

  static async createStaff(
    tenantId: string,
    data: {
      membershipId: string;
      employeeCode: string;
      departmentId?: string;
      designationId?: string;
      employmentType?: string;
      status?: string;
      joiningDate?: Date;
      phone?: string;
      emergencyContact?: Record<string, unknown>;
      bio?: string;
      address?: Record<string, unknown>;
      performedByMembershipId?: string;
    },
  ) {
    return db.transaction(async (tx) => {
      const existingCode = await tx.query.staffProfiles.findFirst({
        where: and(
          eq(staffProfiles.tenantId, tenantId),
          eq(staffProfiles.employeeCode, data.employeeCode),
        ),
      });

      if (existingCode) {
        throw new ApiError(
          409,
          `Employee code '${data.employeeCode}' is already in use in this tenant`,
          "EMPLOYEE_CODE_EXISTS",
        );
      }

      const membership = await tx.query.memberships.findFirst({
        where: and(
          eq(memberships.id, data.membershipId),
          eq(memberships.tenantId, tenantId),
        ),
      });
      if (!membership) {
        throw new ApiError(
          400,
          "Membership does not belong to this tenant",
          "MEMBERSHIP_TENANT_MISMATCH",
        );
      }

      if (data.departmentId) {
        const department = await tx.query.departments.findFirst({
          where: and(
            eq(departments.id, data.departmentId),
            eq(departments.tenantId, tenantId),
          ),
        });
        if (!department) {
          throw new ApiError(
            400,
            "Department does not belong to this tenant",
            "DEPARTMENT_TENANT_MISMATCH",
          );
        }
      }

      if (data.designationId) {
        const designation = await tx.query.designations.findFirst({
          where: and(
            eq(designations.id, data.designationId),
            eq(designations.tenantId, tenantId),
          ),
        });
        if (!designation) {
          throw new ApiError(
            400,
            "Designation does not belong to this tenant",
            "DESIGNATION_TENANT_MISMATCH",
          );
        }
      }

      const [newStaff] = await tx
        .insert(staffProfiles)
        .values({
          tenantId,
          membershipId: data.membershipId,
          employeeCode: data.employeeCode,
          departmentId: data.departmentId,
          designationId: data.designationId,
          employmentType: data.employmentType ?? "full_time",
          status: data.status ?? "active",
          joiningDate: data.joiningDate ?? new Date(),
          phone: data.phone,
          emergencyContact: data.emergencyContact,
          bio: data.bio,
          address: data.address,
        })
        .returning();

      await tx.insert(staffLifecycleEvents).values({
        tenantId,
        staffId: newStaff.id,
        eventType: "joined",
        effectiveDate: newStaff.joiningDate,
        remarks: "Initial staff onboarding and profile creation",
        performedByMembershipId: data.performedByMembershipId,
      });

      return newStaff;
    });
  }

  static async updateStaff(
    tenantId: string,
    staffId: string,
    data: Partial<{
      departmentId: string | null;
      designationId: string | null;
      employmentType: string;
      status: string;
      phone: string;
      emergencyContact: Record<string, unknown>;
      bio: string;
      address: Record<string, unknown>;
    }>,
  ) {
    const existing = await db.query.staffProfiles.findFirst({
      where: and(
        eq(staffProfiles.tenantId, tenantId),
        eq(staffProfiles.id, staffId),
      ),
    });

    if (!existing) {
      throw new ApiError(404, "Staff profile not found", "STAFF_NOT_FOUND");
    }

    const [updated] = await db
      .update(staffProfiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(staffProfiles.tenantId, tenantId),
          eq(staffProfiles.id, staffId),
        ),
      )
      .returning();

    return updated;
  }

  static async recordLifecycleEvent(
    tenantId: string,
    staffId: string,
    data: {
      eventType: string;
      effectiveDate?: Date;
      remarks?: string;
      metadata?: Record<string, unknown>;
      newStatus?: string;
      newDepartmentId?: string;
      newDesignationId?: string;
      performedByMembershipId?: string;
    },
  ) {
    return db.transaction(async (tx) => {
      const staff = await tx.query.staffProfiles.findFirst({
        where: and(
          eq(staffProfiles.tenantId, tenantId),
          eq(staffProfiles.id, staffId),
        ),
      });

      if (!staff) {
        throw new ApiError(404, "Staff profile not found", "STAFF_NOT_FOUND");
      }

      const effectiveDate = data.effectiveDate ?? new Date();

      const [event] = await tx
        .insert(staffLifecycleEvents)
        .values({
          tenantId,
          staffId,
          eventType: data.eventType,
          effectiveDate,
          remarks: data.remarks,
          metadata: {
            ...data.metadata,
            previousStatus: staff.status,
            previousDepartmentId: staff.departmentId,
            previousDesignationId: staff.designationId,
          },
          performedByMembershipId: data.performedByMembershipId,
        })
        .returning();

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (data.newStatus) {
        updates.status = data.newStatus;
        if (
          data.newStatus === "exited" ||
          data.eventType === "resigned" ||
          data.eventType === "terminated"
        ) {
          updates.exitDate = effectiveDate;
        }
      }
      if (data.newDepartmentId !== undefined) {
        if (data.newDepartmentId) {
          const department = await tx.query.departments.findFirst({
            where: and(
              eq(departments.id, data.newDepartmentId),
              eq(departments.tenantId, tenantId),
            ),
          });
          if (!department) {
            throw new ApiError(
              400,
              "Department does not belong to this tenant",
              "DEPARTMENT_TENANT_MISMATCH",
            );
          }
        }
        updates.departmentId = data.newDepartmentId;
      }
      if (data.newDesignationId !== undefined) {
        if (data.newDesignationId) {
          const designation = await tx.query.designations.findFirst({
            where: and(
              eq(designations.id, data.newDesignationId),
              eq(designations.tenantId, tenantId),
            ),
          });
          if (!designation) {
            throw new ApiError(
              400,
              "Designation does not belong to this tenant",
              "DESIGNATION_TENANT_MISMATCH",
            );
          }
        }
        updates.designationId = data.newDesignationId;
      }

      await tx
        .update(staffProfiles)
        .set(updates)
        .where(
          and(
            eq(staffProfiles.tenantId, tenantId),
            eq(staffProfiles.id, staffId),
          ),
        );

      return event;
    });
  }
}
