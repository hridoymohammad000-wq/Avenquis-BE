import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { TaskService } from "../../services/task.service.js";
import { ApiError } from "../../errors/api-error.js";

export const taskRouter = Router();

const createTaskSchema = z.object({
  engagementId: z.string().uuid(),
  assigneeMembershipId: z.string().uuid().optional(),
  title: z.string().min(2).max(255),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  estimatedHours: z.number().int().min(0).optional(),
});

const updateTaskStatusSchema = z.object({
  status: z.enum(["todo", "in_progress", "review", "completed", "cancelled"]),
  actualHours: z.number().int().min(0).optional(),
});

// GET / - List tasks
taskRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("tasks:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const engagementId = req.query.engagementId as string | undefined;
      const assigneeMembershipId = req.query.assigneeMembershipId as
        string | undefined;
      const status = req.query.status as string | undefined;
      const priority = req.query.priority as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : undefined;

      const list = await TaskService.listTasks(tenantId, {
        engagementId,
        assigneeMembershipId,
        status,
        priority,
        search,
        limit,
        offset,
      });

      res.json({
        success: true,
        data: list,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST / - Create task
taskRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("tasks:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = createTaskSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid task payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const task = await TaskService.createTask(tenantId, parseResult.data);

      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /:id/status - Update task status
taskRouter.patch(
  "/:id/status",
  authenticate,
  requireTenantContext,
  requirePermission("tasks:update"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const taskId = req.params.id;
      const parseResult = updateTaskStatusSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid task status payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const updated = await TaskService.updateTaskStatus(
        tenantId,
        taskId,
        parseResult.data.status,
        parseResult.data.actualHours,
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
