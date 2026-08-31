import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { AuditProgramService } from "../../services/audit-program.service.js";
import { ApiError } from "../../errors/api-error.js";

export const auditProgramRouter = Router();

const createProgramSchema = z.object({
  engagementId: z.string().uuid(),
  name: z.string().min(2).max(255),
  description: z.string().optional(),
});

const addProcedureSchema = z.object({
  riskAssessmentId: z.string().uuid().optional(),
  assertion: z.string().max(100).optional(),
  procedureText: z.string().min(2),
  procedureType: z.enum(["test_of_controls", "substantive", "analytical"]),
  assignedToMembershipId: z.string().uuid().optional(),
});

const updateProcedureStatusSchema = z.object({
  status: z.enum(["not_started", "in_progress", "completed", "n_a"]),
  workPaperReference: z.string().max(255).optional(),
  results: z.string().optional(),
});

// POST /programs - Create a new audit program
auditProgramRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = createProgramSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid audit program payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await AuditProgramService.createProgram(
        tenantId,
        membershipId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// GET /programs?engagementId= - List audit programs
auditProgramRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const engagementId = req.query.engagementId as string;

      if (!engagementId) {
        throw new ApiError(
          400,
          "engagementId query parameter is required",
          "MISSING_ENGAGEMENT_ID",
        );
      }

      const list = await AuditProgramService.listPrograms(
        tenantId,
        engagementId,
      );

      res.json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  },
);

// GET /programs/:programId - Get audit program with procedures
auditProgramRouter.get(
  "/:programId",
  authenticate,
  requireTenantContext,
  requirePermission("audit:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const { programId } = req.params;

      const details = await AuditProgramService.getProgramDetails(
        tenantId,
        programId,
      );

      res.json({ success: true, data: details });
    } catch (error) {
      next(error);
    }
  },
);

// POST /programs/:programId/procedures - Add a procedure to a program
auditProgramRouter.post(
  "/:programId/procedures",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const { programId } = req.params;
      const parseResult = addProcedureSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid audit procedure payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await AuditProgramService.addProcedure(
        tenantId,
        programId,
        parseResult.data,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /procedures/:procedureId - Update procedure execution status
// We mount this slightly differently in app.ts or within this router to avoid /programs prefix for procedures.
// Actually, it's easier to mount it as /api/v1/audit/procedures/:procedureId
// But let's just use /api/v1/audit-programs/procedures/:procedureId
export const auditProcedureRouter = Router();

auditProcedureRouter.patch(
  "/:procedureId",
  authenticate,
  requireTenantContext,
  requirePermission("audit:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const { procedureId } = req.params;
      const parseResult = updateProcedureStatusSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid procedure update payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const result = await AuditProgramService.updateProcedureStatus(
        tenantId,
        procedureId,
        parseResult.data,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);
