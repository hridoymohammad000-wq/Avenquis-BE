import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { requirePermission } from "../middlewares/rbac.js";
import { BillingService } from "../../services/billing.service.js";
import { ApiError } from "../../errors/api-error.js";

export const billingRouter = Router();

const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  engagementId: z.string().uuid().optional(),
  invoiceNumber: z.string().min(2).max(50),
  amount: z.number().int().min(1),
  vatAmount: z.number().int().min(0).optional(),
  currency: z.string().max(10).default("BDT"),
  issueDate: z.string().transform((val) => new Date(val)),
  dueDate: z.string().transform((val) => new Date(val)),
  remarks: z.string().optional(),
});

const recordPaymentSchema = z.object({
  receiptNumber: z.string().min(2).max(50),
  amount: z.number().int().min(1),
  paymentDate: z.string().transform((val) => new Date(val)),
  paymentMethod: z.enum(["bank_transfer", "cheque", "cash", "online"]),
  referenceNumber: z.string().max(100).optional(),
  remarks: z.string().optional(),
});

// GET /invoices - List invoices
billingRouter.get(
  "/invoices",
  authenticate,
  requireTenantContext,
  requirePermission("billing:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const clientId = req.query.clientId as string | undefined;
      const engagementId = req.query.engagementId as string | undefined;
      const status = req.query.status as string | undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : undefined;

      const list = await BillingService.listInvoices(tenantId, {
        clientId,
        engagementId,
        status,
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

// POST /invoices - Create invoice
billingRouter.post(
  "/invoices",
  authenticate,
  requireTenantContext,
  requirePermission("billing:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const parseResult = createInvoiceSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid invoice payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const invoice = await BillingService.createInvoice(
        tenantId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /invoices/:id/payments - Record payment receipt
billingRouter.post(
  "/invoices/:id/payments",
  authenticate,
  requireTenantContext,
  requirePermission("billing:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const invoiceId = req.params.id;
      const parseResult = recordPaymentSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid payment payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten(),
        );
      }

      const payment = await BillingService.recordPayment(
        tenantId,
        invoiceId,
        parseResult.data,
      );

      res.status(201).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },
);
