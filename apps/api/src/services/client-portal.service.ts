import {
  db,
  clientPortalUsers,
  secureDocumentExchanges,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";
// Simple mock for hash
import crypto from "crypto";

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
    const passwordHash = crypto
      .createHash("sha256")
      .update(data.passwordRaw)
      .digest("hex");

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
    const { passwordHash: _ph, ...safeUser } = user;
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
