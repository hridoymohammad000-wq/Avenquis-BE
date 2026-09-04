import {
  db,
  clientPortalUsers,
  clientInvitations,
  secureDocumentExchanges,
  portalAccessLogs,
  eq,
  and,
  ne,
  desc,
} from "@avenquis/database";
import crypto from "crypto";
import { AuthService } from "./auth.service.js";
import { ApiError } from "../errors/api-error.js";

const PROHIBITED_EXTENSIONS = [
  "exe",
  "bat",
  "cmd",
  "sh",
  "ps1",
  "dll",
  "vbs",
  "js",
  "jar",
  "scr",
  "com",
];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export class ClientPortalService {
  // ──────────── INVITATION & USER MANAGEMENT ────────────

  /**
   * Directly create a client user (for legacy or administrative quick provisioning).
   */
  static async createClientUser(
    tenantId: string,
    data: {
      clientId: string;
      email: string;
      fullName: string;
      passwordRaw: string;
    },
  ) {
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

    const safeUser = { ...user } as Record<string, unknown>;
    delete safeUser.passwordHash;
    return safeUser;
  }

  /**
   * Invite an external client user with a single-use expiring token hashed at rest.
   */
  static async inviteClientUser(
    tenantId: string,
    data: {
      clientId: string;
      email: string;
      invitedByMembershipId?: string;
      expiresInDays?: number;
    },
  ) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresInDays = data.expiresInDays || 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const [invitation] = await db
      .insert(clientInvitations)
      .values({
        tenantId,
        clientId: data.clientId,
        email: data.email.toLowerCase().trim(),
        tokenHash,
        status: "INVITED",
        invitedByMembershipId: data.invitedByMembershipId,
        expiresAt,
      })
      .returning();

    await this.logPortalAccess(tenantId, {
      clientId: data.clientId,
      membershipId: data.invitedByMembershipId,
      action: "INVITE_SENT",
      metadata: { invitationId: invitation.id, email: data.email },
    });

    return {
      invitation,
      rawToken,
    };
  }

  /**
   * Activate a client portal invitation using a raw invitation token.
   */
  static async activateClientInvitation(data: {
    rawToken: string;
    fullName: string;
    passwordRaw: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const tokenHash = crypto.createHash("sha256").update(data.rawToken).digest("hex");

    const [invitation] = await db
      .select()
      .from(clientInvitations)
      .where(eq(clientInvitations.tokenHash, tokenHash));

    if (!invitation) {
      throw new ApiError(404, "Invalid or unknown invitation token", "INVALID_TOKEN");
    }

    if (invitation.status !== "INVITED") {
      throw new ApiError(400, `Invitation is no longer valid (status: ${invitation.status})`, "INVITATION_NOT_ACTIVE");
    }

    if (new Date() > invitation.expiresAt) {
      await db
        .update(clientInvitations)
        .set({ status: "EXPIRED", updatedAt: new Date() })
        .where(eq(clientInvitations.id, invitation.id));

      throw new ApiError(400, "Invitation token has expired", "INVITATION_EXPIRED");
    }

    const passwordHash = await AuthService.hashPassword(data.passwordRaw);

    // Check if user already exists
    const existingUsers = await db
      .select()
      .from(clientPortalUsers)
      .where(
        and(
          eq(clientPortalUsers.tenantId, invitation.tenantId),
          eq(clientPortalUsers.email, invitation.email),
        ),
      );

    let userRecord;
    if (existingUsers.length > 0) {
      const [updated] = await db
        .update(clientPortalUsers)
        .set({
          fullName: data.fullName,
          passwordHash,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(clientPortalUsers.id, existingUsers[0].id))
        .returning();
      userRecord = updated;
    } else {
      const [inserted] = await db
        .insert(clientPortalUsers)
        .values({
          tenantId: invitation.tenantId,
          clientId: invitation.clientId,
          email: invitation.email,
          passwordHash,
          fullName: data.fullName,
          status: "active",
        })
        .returning();
      userRecord = inserted;
    }

    // Mark invitation active
    await db
      .update(clientInvitations)
      .set({
        status: "ACTIVE",
        activatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(clientInvitations.id, invitation.id));

    await this.logPortalAccess(invitation.tenantId, {
      clientId: invitation.clientId,
      clientUserId: userRecord.id,
      action: "INVITATION_ACTIVATED",
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: { invitationId: invitation.id },
    });

    const safeUser = { ...userRecord } as Record<string, unknown>;
    delete safeUser.passwordHash;
    return safeUser;
  }

  /**
   * Revoke an outstanding invitation.
   */
  static async revokeClientInvitation(tenantId: string, invitationId: string) {
    const [revoked] = await db
      .update(clientInvitations)
      .set({
        status: "REVOKED",
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clientInvitations.tenantId, tenantId),
          eq(clientInvitations.id, invitationId),
        ),
      )
      .returning();

    if (!revoked) {
      throw new ApiError(404, "Invitation not found", "INVITATION_NOT_FOUND");
    }

    return revoked;
  }

  /**
   * List client invitations for a tenant.
   */
  static async getClientInvitations(tenantId: string, clientId?: string) {
    const filters = [eq(clientInvitations.tenantId, tenantId)];
    if (clientId) {
      filters.push(eq(clientInvitations.clientId, clientId));
    }

    return db
      .select()
      .from(clientInvitations)
      .where(and(...filters))
      .orderBy(desc(clientInvitations.createdAt));
  }

  /**
   * Update external client user status (active, suspended, disabled).
   */
  static async updateClientUserStatus(
    tenantId: string,
    clientUserId: string,
    status: "active" | "suspended" | "disabled",
  ) {
    const [updated] = await db
      .update(clientPortalUsers)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clientPortalUsers.tenantId, tenantId),
          eq(clientPortalUsers.id, clientUserId),
        ),
      )
      .returning();

    if (!updated) {
      throw new ApiError(404, "Client user not found", "USER_NOT_FOUND");
    }

    const safeUser = { ...updated } as Record<string, unknown>;
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
      storageProvider?: string;
      fileSize?: number;
      mimeType?: string;
      extension?: string;
      scanStatus?: string;
      uploadedByClientUserId?: string;
      uploadedByMembershipId?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ) {
    // 1. Mandatory File & Extension Validation
    const ext = (
      data.extension ||
      data.fileName.split(".").pop() ||
      ""
    ).toLowerCase();

    if (PROHIBITED_EXTENSIONS.includes(ext)) {
      throw new ApiError(
        400,
        `File extension .${ext} is prohibited for security reasons`,
        "PROHIBITED_FILE_TYPE",
      );
    }

    if (data.fileSize && data.fileSize > MAX_FILE_SIZE_BYTES) {
      throw new ApiError(
        400,
        `File size exceeds maximum limit of 50MB`,
        "FILE_TOO_LARGE",
      );
    }

    // 2. Validate URL structure
    if (
      !data.documentUrl.startsWith("s3://") &&
      !data.documentUrl.startsWith("gcs://") &&
      !data.documentUrl.startsWith("azure://") &&
      !data.documentUrl.startsWith("https://")
    ) {
      throw new ApiError(
        400,
        "Document URL must be a valid object storage reference or secure HTTPS link",
        "INVALID_DOCUMENT_URL",
      );
    }

    const scanStatus = data.scanStatus || "CLEAN";

    const [doc] = await db
      .insert(secureDocumentExchanges)
      .values({
        tenantId,
        clientId: data.clientId,
        engagementId: data.engagementId,
        documentUrl: data.documentUrl,
        fileName: data.fileName,
        accessLevel: data.accessLevel || "client_visible",
        storageProvider: data.storageProvider || "s3",
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        extension: ext,
        scanStatus,
        uploadedByClientUserId: data.uploadedByClientUserId,
        uploadedByMembershipId: data.uploadedByMembershipId,
      })
      .returning();

    // 3. Log Audit Trail
    await this.logPortalAccess(tenantId, {
      clientId: data.clientId,
      clientUserId: data.uploadedByClientUserId,
      membershipId: data.uploadedByMembershipId,
      documentId: doc.id,
      action: "UPLOAD",
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: { fileName: data.fileName, scanStatus },
    });

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
      filters.push(eq(secureDocumentExchanges.accessLevel, "client_visible"));
      filters.push(ne(secureDocumentExchanges.scanStatus, "QUARANTINED"));
    }

    return db
      .select()
      .from(secureDocumentExchanges)
      .where(and(...filters))
      .orderBy(secureDocumentExchanges.createdAt);
  }

  // ──────────── ACCESS AUDIT LOGGING ────────────

  static async logPortalAccess(
    tenantId: string,
    data: {
      clientId?: string;
      clientUserId?: string;
      membershipId?: string;
      documentId?: string;
      action: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const [log] = await db
      .insert(portalAccessLogs)
      .values({
        tenantId,
        clientId: data.clientId,
        clientUserId: data.clientUserId,
        membershipId: data.membershipId,
        documentId: data.documentId,
        action: data.action,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata || {},
      })
      .returning();

    return log;
  }

  static async getPortalAccessLogs(tenantId: string, clientId?: string) {
    const filters = [eq(portalAccessLogs.tenantId, tenantId)];
    if (clientId) {
      filters.push(eq(portalAccessLogs.clientId, clientId));
    }

    return db
      .select()
      .from(portalAccessLogs)
      .where(and(...filters))
      .orderBy(desc(portalAccessLogs.createdAt));
  }
}
