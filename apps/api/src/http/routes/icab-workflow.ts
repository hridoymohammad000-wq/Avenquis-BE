import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { IcabWorkflowService } from "../../services/icab-workflow.service.js";
import { ApiError } from "../../errors/api-error.js";

export const icabWorkflowRouter = Router();

const submitFormSchema = z.object({
  studentId: z.string().uuid(),
  formType: z.enum(["form_104", "form_108", "form_112"]),
  documentUrl: z.string().url().optional(),
});

const registerExamSchema = z.object({
  studentId: z.string().uuid(),
  examSession: z.string().min(1),
  level: z.enum(["certificate", "professional", "advanced"]),
  leaveRequestedDays: z.number().int().min(0).max(90),
});

const approveExamSchema = z.object({
  leaveApproved: z.boolean(),
  comments: z.string().optional(),
});

// ──────────── FORMS ────────────

icabWorkflowRouter.post(
  "/forms",
  authenticate,
  requireTenantContext,
  requirePermission("student:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = submitFormSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid form payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await IcabWorkflowService.submitForm(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

icabWorkflowRouter.patch(
  "/forms/:id/sign",
  authenticate,
  requireTenantContext,
  requirePermission("student:manage"), // Higher privilege required to sign as principal
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;

      const result = await IcabWorkflowService.principalSignForm(
        tenantId,
        membershipId,
        req.params.id,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

icabWorkflowRouter.get(
  "/forms",
  authenticate,
  requireTenantContext,
  requirePermission("student:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const studentId = req.query.studentId as string;

      if (!studentId) {
        throw new ApiError(
          400,
          "studentId query parameter is required",
          "MISSING_STUDENT_ID",
        );
      }

      const list = await IcabWorkflowService.getForms(tenantId, studentId);
      res.json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  },
);

// ──────────── EXAMS ────────────

icabWorkflowRouter.post(
  "/exams/register",
  authenticate,
  requireTenantContext,
  requirePermission("student:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = registerExamSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid exam registration payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await IcabWorkflowService.registerForExam(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

icabWorkflowRouter.patch(
  "/exams/:id/approve",
  authenticate,
  requireTenantContext,
  requirePermission("student:manage"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = approveExamSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid approval payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await IcabWorkflowService.approveExamRegistration(
        tenantId,
        membershipId,
        req.params.id,
        parseResult.data,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

icabWorkflowRouter.get(
  "/exams",
  authenticate,
  requireTenantContext,
  requirePermission("student:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const studentId = req.query.studentId as string;

      if (!studentId) {
        throw new ApiError(
          400,
          "studentId query parameter is required",
          "MISSING_STUDENT_ID",
        );
      }

      const list = await IcabWorkflowService.getExamRegistrations(
        tenantId,
        studentId,
      );
      res.json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  },
);
