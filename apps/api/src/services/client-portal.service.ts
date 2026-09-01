import {
  db,
  clientPortalUsers,
  secureDocumentExchanges,
  eq,
  and,
  clients,
  engagements,
  memberships,
} from "@avenquis/database";
import { AuthService } from "./auth.service.js";
import { ApiError } from "../errors/api-error.js";

export class ClientPortalService {
  // ──────────── CLIENT USER MANAGEMENT ────────────
  static async createClientUser(
    tenantId: string,
    data: {
      clientId: string;
      email: string;
      fullName: string;
      passwordRaw: string;
    },
  ) {
    const client = await db.query.clients.findFirst({
      where: and(eq(clients.id, data.clientId), eq(clients.tenantId, tenantId)),
    });
    if (!client)
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");

    const passwordHash = await AuthService.hashPassword(data.passwordRaw);

    const [user] = await db
      .insert(clientPortalUsers)
      .values({
        tenantId,
        clientId: data.clientId,
        email: data.email,
        fullName: data.fullName,
        passwordHash,
        status: "active",
      })
      .returning();

    // omit hash before return
    const safeUser = { ...user } as Record<string, unknown>;
    delete safeUser.passwordHash;
    return safeUser;
  }

  // ──────────── SECURE DOCUMENT EXCHANGE ────────────
  static async uploadSecureDocument(
    tenantId: string,
    data: {
      clientId: string;
      engagementId?: string;
      documentUrl: string;
      fileName: string;
      accessLevel: string;
      uploadedByClientUserId?: string;
      uploadedByMembershipId?: string;
    },
  ) {
    const client = await db.query.clients.findFirst({
      where: and(eq(clients.id, data.clientId), eq(clients.tenantId, tenantId)),
    });
    if (!client)
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    if (data.uploadedByMembershipId) {
      const member = await db.query.memberships.findFirst({
        where: and(
          eq(memberships.id, data.uploadedByMembershipId),
          eq(memberships.tenantId, tenantId),
        ),
      });
      if (!member)
        throw new ApiError(
          403,
          "Invalid uploader membership",
          "INVALID_MEMBERSHIP",
        );
    }
    if (data.engagementId) {
      const engagement = await db.query.engagements.findFirst({
        where: and(
          eq(engagements.id, data.engagementId),
          eq(engagements.tenantId, tenantId),
        ),
      });
      if (!engagement)
        throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
      if (engagement.clientId !== data.clientId)
        throw new ApiError(
          400,
          "Engagement does not belong to this client",
          "INVALID_ENGAGEMENT_CLIENT",
        );
    }
    const [doc] = await db
      .insert(secureDocumentExchanges)
      .values({
        tenantId,
        clientId: data.clientId,
        engagementId: data.engagementId,
        documentUrl: data.documentUrl,
        fileName: data.fileName,
        accessLevel: data.accessLevel,
        uploadedByClientUserId: data.uploadedByClientUserId,
        uploadedByMembershipId: data.uploadedByMembershipId,
      })
      .returning();

    return doc;
  }

  static async getClientDocuments(
    tenantId: string,
    clientId: string,
    forClientPortal: boolean = false,
  ) {
    const filters = [
      eq(secureDocumentExchanges.tenantId, tenantId),
      eq(secureDocumentExchanges.clientId, clientId),
    ];

    if (forClientPortal) {
      // If fetching specifically for the external client portal, only show client_visible docs
      filters.push(eq(secureDocumentExchanges.accessLevel, "client_visible"));
    }

    return db
      .select()
      .from(secureDocumentExchanges)
      .where(and(...filters))
      .orderBy(secureDocumentExchanges.createdAt);
  }
}
