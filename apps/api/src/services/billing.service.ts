import {
  db,
  invoices,
  payments,
  clients,
  engagements,
  eq,
  and,
  desc,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class BillingService {
  static async listInvoices(
    tenantId: string,
    options?: {
      clientId?: string;
      engagementId?: string;
      status?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const conditions = [eq(invoices.tenantId, tenantId)];

    if (options?.clientId) {
      conditions.push(eq(invoices.clientId, options.clientId));
    }
    if (options?.engagementId) {
      conditions.push(eq(invoices.engagementId, options.engagementId));
    }
    if (options?.status) {
      conditions.push(eq(invoices.status, options.status));
    }

    const rows = await db
      .select({
        id: invoices.id,
        tenantId: invoices.tenantId,
        clientId: invoices.clientId,
        clientName: clients.name,
        engagementId: invoices.engagementId,
        invoiceNumber: invoices.invoiceNumber,
        amount: invoices.amount,
        vatAmount: invoices.vatAmount,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        paidAmount: invoices.paidAmount,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .leftJoin(engagements, eq(invoices.engagementId, engagements.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(invoices.createdAt));

    return rows;
  }

  static async createInvoice(
    tenantId: string,
    data: {
      clientId: string;
      engagementId?: string;
      invoiceNumber: string;
      amount: number;
      vatAmount?: number;
      currency?: string;
      issueDate: Date;
      dueDate: Date;
      remarks?: string;
    },
  ) {
    const client = await db.query.clients.findFirst({
      where: and(eq(clients.tenantId, tenantId), eq(clients.id, data.clientId)),
    });

    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }

    const existing = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.tenantId, tenantId),
        eq(invoices.invoiceNumber, data.invoiceNumber),
      ),
    });

    if (existing) {
      throw new ApiError(
        409,
        `Invoice number '${data.invoiceNumber}' already exists in this tenant`,
        "INVOICE_NUMBER_EXISTS",
      );
    }

    const vatAmount = data.vatAmount ?? 0;
    const totalAmount = data.amount + vatAmount;

    const [invoice] = await db
      .insert(invoices)
      .values({
        tenantId,
        clientId: data.clientId,
        engagementId: data.engagementId,
        invoiceNumber: data.invoiceNumber,
        amount: data.amount,
        vatAmount,
        totalAmount,
        currency: data.currency ?? "BDT",
        status: "sent",
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        paidAmount: 0,
        remarks: data.remarks,
      })
      .returning();

    return invoice;
  }

  static async recordPayment(
    tenantId: string,
    invoiceId: string,
    data: {
      receiptNumber: string;
      amount: number;
      paymentDate: Date;
      paymentMethod: "bank_transfer" | "cheque" | "cash" | "online";
      referenceNumber?: string;
      remarks?: string;
    },
  ) {
    const invoice = await db.query.invoices.findFirst({
      where: and(eq(invoices.tenantId, tenantId), eq(invoices.id, invoiceId)),
    });

    if (!invoice) {
      throw new ApiError(404, "Invoice not found", "INVOICE_NOT_FOUND");
    }

    const [payment] = await db
      .insert(payments)
      .values({
        tenantId,
        invoiceId,
        receiptNumber: data.receiptNumber,
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
        remarks: data.remarks,
      })
      .returning();

    const newPaidAmount = invoice.paidAmount + data.amount;
    let newStatus = invoice.status;

    if (newPaidAmount >= invoice.totalAmount) {
      newStatus = "paid";
    } else if (newPaidAmount > 0) {
      newStatus = "partially_paid";
    }

    await db
      .update(invoices)
      .set({
        paidAmount: newPaidAmount,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(and(eq(invoices.tenantId, tenantId), eq(invoices.id, invoiceId)));

    return payment;
  }
}
