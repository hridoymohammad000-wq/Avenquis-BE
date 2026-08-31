import {
  db,
  clients,
  clientContacts,
  clientKycDocuments,
  memberships,
  userProfiles,
} from "@avenquis/database";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import { ApiError } from "../errors/api-error.js";

export class ClientService {
  static async listClients(
    tenantId: string,
    options?: {
      status?: string;
      clientType?: string;
      riskRating?: string;
      kycStatus?: string;
      search?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const conditions = [eq(clients.tenantId, tenantId)];

    if (options?.status) {
      conditions.push(eq(clients.status, options.status));
    }
    if (options?.clientType) {
      conditions.push(eq(clients.clientType, options.clientType));
    }
    if (options?.riskRating) {
      conditions.push(eq(clients.riskRating, options.riskRating));
    }
    if (options?.kycStatus) {
      conditions.push(eq(clients.kycStatus, options.kycStatus));
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      const condOr = or(
        ilike(clients.name, searchPattern),
        ilike(clients.clientCode, searchPattern),
        ilike(clients.primaryEmail, searchPattern),
      );
      if (condOr) conditions.push(condOr);
    }

    const rows = await db
      .select()
      .from(clients)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(clients.createdAt));

    return rows;
  }

  static async createClient(
    tenantId: string,
    data: {
      clientCode: string;
      name: string;
      clientType: string;
      industry?: string;
      taxIdentificationNumber?: string;
      businessRegistrationNumber?: string;
      primaryEmail?: string;
      primaryPhone?: string;
      address?: Record<string, unknown>;
      riskRating?: string;
      kycStatus?: string;
      status?: string;
      leadPartnerMembershipId?: string;
    },
  ) {
    const existing = await db.query.clients.findFirst({
      where: and(
        eq(clients.tenantId, tenantId),
        eq(clients.clientCode, data.clientCode),
      ),
    });

    if (existing) {
      throw new ApiError(
        409,
        `Client code '${data.clientCode}' already exists in this tenant`,
        "CLIENT_CODE_EXISTS",
      );
    }

    const [client] = await db
      .insert(clients)
      .values({
        tenantId,
        clientCode: data.clientCode,
        name: data.name,
        clientType: data.clientType,
        industry: data.industry,
        taxIdentificationNumber: data.taxIdentificationNumber,
        businessRegistrationNumber: data.businessRegistrationNumber,
        primaryEmail: data.primaryEmail,
        primaryPhone: data.primaryPhone,
        address: data.address,
        riskRating: data.riskRating ?? "unassessed",
        kycStatus: data.kycStatus ?? "pending",
        status: data.status ?? "active",
        leadPartnerMembershipId: data.leadPartnerMembershipId,
      })
      .returning();

    return client;
  }

  static async getClientById(tenantId: string, clientId: string) {
    const client = await db.query.clients.findFirst({
      where: and(eq(clients.tenantId, tenantId), eq(clients.id, clientId)),
    });

    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }

    const contacts = await db
      .select()
      .from(clientContacts)
      .where(
        and(
          eq(clientContacts.tenantId, tenantId),
          eq(clientContacts.clientId, clientId),
        ),
      )
      .orderBy(desc(clientContacts.isPrimary), clientContacts.fullName);

    const kycDocuments = await db
      .select()
      .from(clientKycDocuments)
      .where(
        and(
          eq(clientKycDocuments.tenantId, tenantId),
          eq(clientKycDocuments.clientId, clientId),
        ),
      )
      .orderBy(desc(clientKycDocuments.createdAt));

    let leadPartner = null;
    if (client.leadPartnerMembershipId) {
      const [partnerRow] = await db
        .select({
          membershipId: memberships.id,
          fullName: userProfiles.fullName,
          email: userProfiles.email,
        })
        .from(memberships)
        .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
        .where(eq(memberships.id, client.leadPartnerMembershipId));

      leadPartner = partnerRow ?? null;
    }

    return {
      ...client,
      contacts,
      kycDocuments,
      leadPartner,
    };
  }

  static async updateClient(
    tenantId: string,
    clientId: string,
    data: {
      name?: string;
      clientType?: string;
      industry?: string;
      taxIdentificationNumber?: string;
      businessRegistrationNumber?: string;
      primaryEmail?: string;
      primaryPhone?: string;
      address?: Record<string, unknown>;
      riskRating?: string;
      kycStatus?: string;
      status?: string;
      leadPartnerMembershipId?: string;
    },
  ) {
    const client = await db.query.clients.findFirst({
      where: and(eq(clients.tenantId, tenantId), eq(clients.id, clientId)),
    });

    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }

    const [updated] = await db
      .update(clients)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(clients.tenantId, tenantId), eq(clients.id, clientId)))
      .returning();

    return updated;
  }

  static async addContact(
    tenantId: string,
    clientId: string,
    data: {
      fullName: string;
      designation?: string;
      email?: string;
      phone?: string;
      isPrimary?: boolean;
      notes?: string;
    },
  ) {
    const client = await db.query.clients.findFirst({
      where: and(eq(clients.tenantId, tenantId), eq(clients.id, clientId)),
    });

    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }

    if (data.isPrimary) {
      await db
        .update(clientContacts)
        .set({ isPrimary: false })
        .where(
          and(
            eq(clientContacts.tenantId, tenantId),
            eq(clientContacts.clientId, clientId),
          ),
        );
    }

    const [contact] = await db
      .insert(clientContacts)
      .values({
        tenantId,
        clientId,
        fullName: data.fullName,
        designation: data.designation,
        email: data.email,
        phone: data.phone,
        isPrimary: data.isPrimary ?? false,
        notes: data.notes,
      })
      .returning();

    return contact;
  }

  static async uploadKycDocument(
    tenantId: string,
    clientId: string,
    data: {
      documentType: string;
      documentNumber?: string;
      fileUrl?: string;
      expiryDate?: Date;
      remarks?: string;
    },
  ) {
    const client = await db.query.clients.findFirst({
      where: and(eq(clients.tenantId, tenantId), eq(clients.id, clientId)),
    });

    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }

    const [document] = await db
      .insert(clientKycDocuments)
      .values({
        tenantId,
        clientId,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        fileUrl: data.fileUrl,
        verificationStatus: "pending",
        expiryDate: data.expiryDate,
        remarks: data.remarks,
      })
      .returning();

    return document;
  }

  static async verifyKycDocument(
    tenantId: string,
    documentId: string,
    data: {
      verificationStatus: "verified" | "rejected";
      verifierMembershipId: string;
      remarks?: string;
    },
  ) {
    const doc = await db.query.clientKycDocuments.findFirst({
      where: and(
        eq(clientKycDocuments.tenantId, tenantId),
        eq(clientKycDocuments.id, documentId),
      ),
    });

    if (!doc) {
      throw new ApiError(
        404,
        "KYC document record not found",
        "KYC_DOCUMENT_NOT_FOUND",
      );
    }

    const [updatedDoc] = await db
      .update(clientKycDocuments)
      .set({
        verificationStatus: data.verificationStatus,
        verifiedByMembershipId: data.verifierMembershipId,
        verifiedAt: new Date(),
        remarks: data.remarks ?? doc.remarks,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clientKycDocuments.tenantId, tenantId),
          eq(clientKycDocuments.id, documentId),
        ),
      )
      .returning();

    const allDocs = await db
      .select()
      .from(clientKycDocuments)
      .where(
        and(
          eq(clientKycDocuments.tenantId, tenantId),
          eq(clientKycDocuments.clientId, doc.clientId),
        ),
      );

    const hasVerified = allDocs.some(
      (d) => d.verificationStatus === "verified",
    );
    const hasRejected = allDocs.some(
      (d) => d.verificationStatus === "rejected",
    );

    let newKycStatus = "pending";
    if (hasVerified && !hasRejected) {
      newKycStatus = "verified";
    } else if (hasRejected) {
      newKycStatus = "rejected";
    }

    await db
      .update(clients)
      .set({ kycStatus: newKycStatus, updatedAt: new Date() })
      .where(
        and(eq(clients.tenantId, tenantId), eq(clients.id, doc.clientId)),
      );

    return updatedDoc;
  }

  static async updateRiskRating(
    tenantId: string,
    clientId: string,
    riskRating: "low" | "medium" | "high" | "unassessed",
  ) {
    const client = await db.query.clients.findFirst({
      where: and(eq(clients.tenantId, tenantId), eq(clients.id, clientId)),
    });

    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }

    const [updated] = await db
      .update(clients)
      .set({
        riskRating,
        updatedAt: new Date(),
      })
      .where(and(eq(clients.tenantId, tenantId), eq(clients.id, clientId)))
      .returning();

    return updated;
  }
}
