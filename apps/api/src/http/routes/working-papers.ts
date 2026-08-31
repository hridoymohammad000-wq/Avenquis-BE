import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { WorkingPaperService } from "../../services/working-paper.service.js";
import { ApiError } from "../../errors/api-error.js";

export const workingPaperRouter = Router();

const createWpSchema = z.object({
  engagementId: z.string().uuid(),
  wpCode: z.string().min(1).max(50),
  title: z.string().min(2).max(255),
  section: z.enum([
    "planning",
    "assets",
    "liabilities",
    "equity",
    "revenue",
    "expenses",
    "taxation",
    "completion",
    "permanent_file",
  ]),
  fileUrl: z.string().url().optional(),
  remarks: z.string().optional(),
});

const signoffSchema = z.object({
  action: z.enum(["prepare", "approve", "reject"]),
  remarks: z.string().optional(),
});

const addReviewNoteSchema = z.object({
  content: z.string().min(2),
});

const updateReviewNoteSchema = z.object({
  action: z.enum(["address", "clear"]),
});

const createDocReqSchema = z.object({
  engagementId: z.string().uuid(),
  requestTitle: z.string().min(2).max(255),
  description: z.string().optional(),
  dueDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
});

const fulfillDocReqSchema = z.object({
  uploadedFileUrl: z.string().url(),
});

// GET / - List working papers for engagement
workingPaperRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const engagementId = req.query.engagementId as string;
      const section = req.query.section as string | undefined;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : undefined;

      if (!engagementId) {
        throw new ApiError(
          400,
          "engagementId query parameter is required",
          "MISSING_ENGAGEMENT_ID",
        );
      }

      const list = await WorkingPaperService.listWorkingPapers(
        tenantId,
        engagementId,
        {
          section,
          status,
          search,
          limit,
          offset,
        },
      );

      res.json({
        success: true,
        data: list,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST / - Create working paper
workingPaperRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = createWpSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid working paper creation payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const wp = await WorkingPaperService.createWorkingPaper(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: wp,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /requests - List client document requests
workingPaperRouter.get(
  "/requests",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:read"),
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

      const requests = await WorkingPaperService.listDocumentRequests(
        tenantId,
        engagementId,
      );

      res.json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /requests - Create client document request
workingPaperRouter.post(
  "/requests",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:manage_requests"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = createDocReqSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid document request payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const docReq = await WorkingPaperService.createDocumentRequest(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: docReq,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /requests/:requestId - Fulfill document request
workingPaperRouter.patch(
  "/requests/:requestId",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:manage_requests"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const requestId = req.params.requestId;
      const parseResult = fulfillDocReqSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid document fulfillment payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const fulfilled = await WorkingPaperService.fulfillDocumentRequest(
        tenantId,
        requestId,
        parseResult.data.uploadedFileUrl,
      );

      res.json({
        success: true,
        data: fulfilled,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /:id - Get working paper details
workingPaperRouter.get(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const wpId = req.params.id;

      const wp = await WorkingPaperService.getWorkingPaperById(tenantId, wpId);

      res.json({
        success: true,
        data: wp,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /:id/signoff - Sign-off working paper
workingPaperRouter.post(
  "/:id/signoff",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:signoff"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const wpId = req.params.id;
      const membershipId = req.membership!.id;
      const parseResult = signoffSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid sign-off payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const updated = await WorkingPaperService.signoffWorkingPaper(
        tenantId,
        wpId,
        parseResult.data.action,
        membershipId,
        parseResult.data.remarks,
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

// POST /:id/review-notes - Add review note
workingPaperRouter.post(
  "/:id/review-notes",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:review_notes"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const wpId = req.params.id;
      const membershipId = req.membership!.id;
      const parseResult = addReviewNoteSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid review note payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const note = await WorkingPaperService.addReviewNote(
        tenantId,
        wpId,
        membershipId,
        parseResult.data.content,
      );

      res.status(201).json({
        success: true,
        data: note,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /review-notes/:noteId - Address or clear review note
workingPaperRouter.patch(
  "/review-notes/:noteId",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:review_notes"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const noteId = req.params.noteId;
      const membershipId = req.membership!.id;
      const parseResult = updateReviewNoteSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid review note status payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const updated = await WorkingPaperService.updateReviewNoteStatus(
        tenantId,
        noteId,
        parseResult.data.action,
        membershipId,
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
