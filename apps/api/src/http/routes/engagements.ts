import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { EngagementService } from "../../services/engagement.service.js";
import { ApiError } from "../../errors/api-error.js";

export const engagementRouter = Router();

const createEngagementSchema = z.object({
  clientId: z.string().uuid(),
  engagementCode: z.string().min(2).max(50),
  title: z.string().min(2).max(255),
  engagementType: z.enum([
    "statutory_audit",
    "tax_advisory",
    "accounting_services",
    "special_audit",
    "vat_consulting",
    "valuation_advisory",
  ]),
  financialYear: z.string().min(2).max(50),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  budgetedHours: z.number().int().min(0).optional(),
  budgetedFee: z.number().int().min(0).optional(),
  currency: z.string().max(10).default("BDT"),
  engagementPartnerMembershipId: z.string().uuid().optional(),
  engagementManagerMembershipId: z.string().uuid().optional(),
  auditQualityReviewerMembershipId: z.string().uuid().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum([
    "planning",
    "fieldwork",
    "review",
    "partner_signoff",
    "completed",
    "archived",
  ]),
});

const assignTeamMemberSchema = z.object({
  membershipId: z.string().uuid(),
  role: z.enum([
    "lead_partner",
    "engagement_manager",
    "senior_auditor",
    "staff_auditor",
    "article_student",
    "eqcr_partner",
  ]),
  allocatedHours: z.number().int().min(0).optional(),
  startDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  endDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
});

const submitIndependenceSchema = z.object({
  hasFinancialInterest: z.boolean(),
  hasPersonalRelationship: z.boolean(),
  remarks: z.string().optional(),
});

// GET / - List engagements
engagementRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("engagements:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const clientId = req.query.clientId as string | undefined;
      const status = req.query.status as string | undefined;
      const engagementType = req.query.engagementType as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : undefined;

      const list = await EngagementService.listEngagements(tenantId, {
        clientId,
        status,
        engagementType,
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

// POST / - Create engagement
engagementRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("engagements:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = createEngagementSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid engagement creation payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const engagement = await EngagementService.createEngagement(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: engagement,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /:id - Get engagement details
engagementRouter.get(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("engagements:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const engagementId = req.params.id;

      const engagement = await EngagementService.getEngagementById(
        tenantId,
        engagementId,
      );

      res.json({
        success: true,
        data: engagement,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /:id/status - Update engagement status
engagementRouter.patch(
  "/:id/status",
  authenticate,
  requireTenantContext,
  requirePermission("engagements:update"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const engagementId = req.params.id;
      const parseResult = updateStatusSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid status payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const updated = await EngagementService.updateEngagementStatus(
        tenantId,
        engagementId,
        parseResult.data.status,
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

// POST /:id/team - Assign team member
engagementRouter.post(
  "/:id/team",
  authenticate,
  requireTenantContext,
  requirePermission("engagements:manage_team"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const engagementId = req.params.id;
      const parseResult = assignTeamMemberSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid team assignment payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const member = await EngagementService.assignTeamMember(
        tenantId,
        engagementId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: member,
      });
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /:id/team/:membershipId - Remove team member
engagementRouter.delete(
  "/:id/team/:membershipId",
  authenticate,
  requireTenantContext,
  requirePermission("engagements:manage_team"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const engagementId = req.params.id;
      const membershipId = req.params.membershipId;

      const result = await EngagementService.removeTeamMember(
        tenantId,
        engagementId,
        membershipId,
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /:id/independence - Submit independence declaration
engagementRouter.post(
  "/:id/independence",
  authenticate,
  requireTenantContext,
  requirePermission("engagements:manage_independence"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const engagementId = req.params.id;
      const membershipId = req.membership!.id;
      const parseResult = submitIndependenceSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid independence declaration payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const declaration = await EngagementService.submitIndependenceDeclaration(
        tenantId,
        engagementId,
        membershipId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: declaration,
      });
    } catch (error) {
      next(error);
    }
  },
);
