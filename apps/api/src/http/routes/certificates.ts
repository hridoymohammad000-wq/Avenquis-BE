import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { CertificateService } from "../../services/certificate.service.js";
import { ApiError } from "../../errors/api-error.js";

export const certificateRouter = Router();

const signoffEngagementSchema = z.object({
  engagementId: z.string().uuid(),
  signoffRole: z.enum([
    "audit_senior",
    "engagement_manager",
    "eqcr_partner",
    "lead_partner",
  ]),
  action: z.enum(["approved", "rejected", "signed_and_sealed"]),
  comments: z.string().optional(),
});

const issueCertificateSchema = z.object({
  engagementId: z.string().uuid(),
  certificateNumber: z.string().min(2).max(50),
  certificateType: z.enum([
    "independent_auditors_report",
    "tax_clearance_certificate",
    "special_audit_certificate",
    "net_worth_certificate",
    "compliance_certificate",
  ]),
  title: z.string().min(2).max(255),
  auditOpinion: z.enum(["unmodified", "qualified", "adverse", "disclaimer"]),
  summaryOpinionText: z.string().min(10),
});

const revokeCertificateSchema = z.object({
  reason: z.string().min(5),
});

// PUBLIC ENDPOINT: Verify certificate via public token
certificateRouter.get("/verify/:token", async (req, res, next) => {
  try {
    const token = req.params.token;
    const result = await CertificateService.verifyCertificatePublic(token);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /signoff - Record engagement sign-off log
certificateRouter.post(
  "/signoff",
  authenticate,
  requireTenantContext,
  requirePermission("engagements:signoff"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = signoffEngagementSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid signoff payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const log = await CertificateService.signoffEngagement(
        tenantId,
        parseResult.data.engagementId,
        membershipId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST / - Issue digital audit certificate
certificateRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("certificates:issue"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const membershipId = req.membership!.id;
      const parseResult = issueCertificateSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid certificate payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const certificate = await CertificateService.issueCertificate(tenantId, {
        ...parseResult.data,
        signedByMembershipId: membershipId,
      });

      res.status(201).json({
        success: true,
        data: certificate,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /:id - Get digital certificate details
certificateRouter.get(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("certificates:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const certificateId = req.params.id;

      const cert = await CertificateService.getCertificateById(
        tenantId,
        certificateId,
      );

      res.json({
        success: true,
        data: cert,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /:id/revoke - Revoke digital certificate
certificateRouter.patch(
  "/:id/revoke",
  authenticate,
  requireTenantContext,
  requirePermission("certificates:revoke"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const certificateId = req.params.id;
      const parseResult = revokeCertificateSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid revocation payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const revoked = await CertificateService.revokeCertificate(
        tenantId,
        certificateId,
        parseResult.data.reason,
      );

      res.json({
        success: true,
        data: revoked,
      });
    } catch (error) {
      next(error);
    }
  },
);
