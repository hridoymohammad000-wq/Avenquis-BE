import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { ClientService } from "../../services/client.service.js";
import { ApiError } from "../../errors/api-error.js";

export const clientRouter = Router();

const createClientSchema = z.object({
  clientCode: z.string().min(2).max(50),
  name: z.string().min(2).max(255),
  clientType: z.enum([
    "corporate",
    "individual",
    "government",
    "non_profit",
    "partnership",
  ]),
  industry: z.string().max(100).optional(),
  taxIdentificationNumber: z.string().max(100).optional(),
  businessRegistrationNumber: z.string().max(100).optional(),
  primaryEmail: z.string().email().optional(),
  primaryPhone: z.string().max(50).optional(),
  address: z.record(z.string(), z.unknown()).optional(),
  riskRating: z
    .enum(["low", "medium", "high", "unassessed"])
    .default("unassessed"),
  kycStatus: z
    .enum(["pending", "verified", "expired", "rejected"])
    .default("pending"),
  status: z
    .enum(["active", "onboarding", "inactive", "blacklisted"])
    .default("active"),
  leadPartnerMembershipId: z.string().uuid().optional(),
});

const updateClientSchema = createClientSchema.partial().omit({
  clientCode: true,
});

const addContactSchema = z.object({
  fullName: z.string().min(2).max(255),
  designation: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
});

const uploadKycSchema = z.object({
  documentType: z.enum([
    "trade_license",
    "tin_certificate",
    "vat_certificate",
    "incorporation_cert",
    "nid_passport",
    "utility_bill",
  ]),
  documentNumber: z.string().max(100).optional(),
  fileUrl: z.string().url().optional(),
  expiryDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  remarks: z.string().optional(),
});

const verifyKycSchema = z.object({
  verificationStatus: z.enum(["verified", "rejected"]),
  remarks: z.string().optional(),
});

const updateRiskSchema = z.object({
  riskRating: z.enum(["low", "medium", "high", "unassessed"]),
});

// GET / - List clients
clientRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("clients:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const status = req.query.status as string | undefined;
      const clientType = req.query.clientType as string | undefined;
      const riskRating = req.query.riskRating as string | undefined;
      const kycStatus = req.query.kycStatus as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : undefined;

      const clients = await ClientService.listClients(tenantId, {
        status,
        clientType,
        riskRating,
        kycStatus,
        search,
        limit,
        offset,
      });

      res.json({
        success: true,
        data: clients,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST / - Create client
clientRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("clients:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = createClientSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid client creation payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const client = await ClientService.createClient(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /:id - Get client details
clientRouter.get(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("clients:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const clientId = req.params.id;

      const client = await ClientService.getClientById(tenantId, clientId);

      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /:id - Update client
clientRouter.patch(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("clients:update"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const clientId = req.params.id;
      const parseResult = updateClientSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid client update payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const updated = await ClientService.updateClient(
        tenantId,
        clientId,
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

// POST /:id/contacts - Add contact person
clientRouter.post(
  "/:id/contacts",
  authenticate,
  requireTenantContext,
  requirePermission("clients:manage_contacts"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const clientId = req.params.id;
      const parseResult = addContactSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid contact payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const contact = await ClientService.addContact(
        tenantId,
        clientId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /:id/kyc - Upload KYC document
clientRouter.post(
  "/:id/kyc",
  authenticate,
  requireTenantContext,
  requirePermission("clients:manage_kyc"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const clientId = req.params.id;
      const parseResult = uploadKycSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid KYC document payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const document = await ClientService.uploadKycDocument(
        tenantId,
        clientId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /kyc/:documentId - Verify/reject KYC document
clientRouter.patch(
  "/kyc/:documentId",
  authenticate,
  requireTenantContext,
  requirePermission("clients:verify_kyc"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const documentId = req.params.documentId;
      const membershipId = req.membership!.id;
      const parseResult = verifyKycSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid KYC verification payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const verified = await ClientService.verifyKycDocument(
        tenantId,
        documentId,
        {
          ...parseResult.data,
          verifierMembershipId: membershipId,
        },
      );

      res.json({
        success: true,
        data: verified,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /:id/risk - Update risk rating
clientRouter.patch(
  "/:id/risk",
  authenticate,
  requireTenantContext,
  requirePermission("clients:manage_kyc"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const clientId = req.params.id;
      const parseResult = updateRiskSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid risk rating payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const updated = await ClientService.updateRiskRating(
        tenantId,
        clientId,
        parseResult.data.riskRating,
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
