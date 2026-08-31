import { Router } from "express";
import { z } from "zod";
import { StudentService } from "../../services/student.service.js";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { ApiError } from "../../errors/api-error.js";

export const studentRouter = Router();

const createStudentSchema = z.object({
  membershipId: z.string().uuid(),
  registrationNumber: z.string().min(2).max(100),
  principalMembershipId: z.string().uuid().optional(),
  courseLevel: z
    .enum(["knowledge", "application", "advanced"])
    .default("knowledge"),
  articleshipStartDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  articleshipEndDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  status: z
    .enum(["active", "completed", "transferred", "suspended"])
    .default("active"),
  emergencyContact: z.record(z.string(), z.unknown()).optional(),
  address: z.record(z.string(), z.unknown()).optional(),
});

const updateStudentSchema = z.object({
  courseLevel: z.enum(["knowledge", "application", "advanced"]).optional(),
  principalMembershipId: z.string().uuid().nullable().optional(),
  articleshipEndDate: z
    .string()
    .transform((val) => new Date(val))
    .nullable()
    .optional(),
  status: z
    .enum(["active", "completed", "transferred", "suspended"])
    .optional(),
  emergencyContact: z.record(z.string(), z.unknown()).optional(),
  address: z.record(z.string(), z.unknown()).optional(),
});

const logTrainingSchema = z.object({
  topic: z.string().min(2).max(255),
  hoursCompleted: z.number().int().min(1),
  supervisorMembershipId: z.string().uuid().optional(),
  remarks: z.string().optional(),
  verifyNow: z.boolean().optional(),
});

const applyLeaveSchema = z.object({
  leaveType: z.enum(["study", "exam", "sick", "casual"]),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  totalDays: z.number().int().min(1),
  remarks: z.string().optional(),
});

const updateLeaveStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  remarks: z.string().optional(),
});

const recordExamSchema = z.object({
  session: z.string().min(2).max(100),
  level: z.enum(["knowledge", "application", "advanced"]),
  subject: z.string().min(2).max(255),
  resultStatus: z.enum(["passed", "failed", "appeared"]),
  marks: z.number().int().min(0).max(100).optional(),
  examDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
});

const logAssignmentSchema = z.object({
  clientName: z.string().min(2).max(255),
  role: z.string().min(2).max(100),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  hoursLogged: z.number().int().min(0).optional(),
  remarks: z.string().optional(),
});

// GET / - List students
studentRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("students:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const {
        status,
        courseLevel,
        principalMembershipId,
        search,
        limit,
        offset,
      } = req.query;

      const students = await StudentService.listStudents(tenantId, {
        status: status as string,
        courseLevel: courseLevel as string,
        principalMembershipId: principalMembershipId as string,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json({
        success: true,
        data: students,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST / - Onboard CA Student Profile
studentRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("students:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = createStudentSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid student profile payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const student = await StudentService.createStudent(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: student,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /leaves/:leaveId - Approve or reject leave
studentRouter.patch(
  "/leaves/:leaveId",
  authenticate,
  requireTenantContext,
  requirePermission("students:manage_leaves"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const leaveId = req.params.leaveId;
      const membershipId = req.membership!.id;
      const parseResult = updateLeaveStatusSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid leave update payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const updated = await StudentService.updateLeaveStatus(
        tenantId,
        leaveId,
        {
          ...parseResult.data,
          approvedByMembershipId: membershipId,
        },
      );

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /:id - Get student details
studentRouter.get(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("students:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const studentId = req.params.id;

      const student = await StudentService.getStudentById(tenantId, studentId);

      res.json({
        success: true,
        data: student,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /:id/dashboard - Student articleship dashboard
studentRouter.get(
  "/:id/dashboard",
  authenticate,
  requireTenantContext,
  requirePermission("students:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const studentId = req.params.id;

      const dashboard = await StudentService.getStudentDashboard(
        tenantId,
        studentId,
      );

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /:id - Update student profile
studentRouter.patch(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("students:update"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const studentId = req.params.id;
      const parseResult = updateStudentSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid student update payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const updated = await StudentService.updateStudent(
        tenantId,
        studentId,
        parseResult.data,
      );

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /:id/training - Log training record
studentRouter.post(
  "/:id/training",
  authenticate,
  requireTenantContext,
  requirePermission("students:update"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const studentId = req.params.id;
      const parseResult = logTrainingSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid training record payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const record = await StudentService.logTraining(
        tenantId,
        studentId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /:id/leaves - Apply for leave
studentRouter.post(
  "/:id/leaves",
  authenticate,
  requireTenantContext,
  requirePermission("students:update"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const studentId = req.params.id;
      const parseResult = applyLeaveSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid leave application payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const leave = await StudentService.applyLeave(
        tenantId,
        studentId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: leave,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /:id/exams - Record exam result
studentRouter.post(
  "/:id/exams",
  authenticate,
  requireTenantContext,
  requirePermission("students:update"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const studentId = req.params.id;
      const parseResult = recordExamSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid exam result payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const exam = await StudentService.recordExamResult(
        tenantId,
        studentId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: exam,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /:id/assignments - Log client assignment
studentRouter.post(
  "/:id/assignments",
  authenticate,
  requireTenantContext,
  requirePermission("students:update"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const studentId = req.params.id;
      const parseResult = logAssignmentSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid assignment payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const assignment = await StudentService.logAssignment(
        tenantId,
        studentId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  },
);
