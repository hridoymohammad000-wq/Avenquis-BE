import {
  db,
  auditFiles,
  clients,
  engagements,
  memberships,
  eq,
  and,
  desc,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class AuditFilesService {
  static async uploadAuditFile(
    tenantId: string,
    uploadedByMembershipId: string,
    data: {
      clientId: string;
      engagementId?: string;
      fileType: "PAF" | "CAF";
      category: string;
      fileName: string;
      fileUrl: string;
      description?: string;
    },
  ) {
    // Basic validation
    const client = await db.query.clients.findFirst({
      where: and(eq(clients.tenantId, tenantId), eq(clients.id, data.clientId)),
    });
    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }

    const uploader = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.id, uploadedByMembershipId),
        eq(memberships.tenantId, tenantId),
      ),
    });
    if (!uploader) {
      throw new ApiError(
        403,
        "Invalid uploader membership",
        "INVALID_MEMBERSHIP",
      );
    }

    if (data.fileType === "CAF") {
      if (!data.engagementId) {
        throw new ApiError(
          400,
          "Engagement ID is required for Current Audit Files",
          "MISSING_ENGAGEMENT_ID",
        );
      }
      const engagement = await db.query.engagements.findFirst({
        where: and(
          eq(engagements.tenantId, tenantId),
          eq(engagements.id, data.engagementId),
        ),
      });
      if (!engagement) {
        throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
      }
      if (engagement.clientId !== data.clientId) {
        throw new ApiError(
          400,
          "Engagement does not belong to this client",
          "INVALID_ENGAGEMENT_CLIENT",
        );
      }
    } else if (data.engagementId) {
      throw new ApiError(
        400,
        "Permanent files cannot include an engagement",
        "INVALID_ENGAGEMENT_ID",
      );
    }

    const [file] = await db
      .insert(auditFiles)
      .values({
        tenantId,
        clientId: data.clientId,
        engagementId: data.fileType === "CAF" ? data.engagementId : null,
        fileType: data.fileType,
        category: data.category,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        description: data.description,
        uploadedByMembershipId,
      })
      .returning();

    return file;
  }

  static async getPermanentFiles(tenantId: string, clientId: string) {
    return db
      .select()
      .from(auditFiles)
      .where(
        and(
          eq(auditFiles.tenantId, tenantId),
          eq(auditFiles.clientId, clientId),
          eq(auditFiles.fileType, "PAF"),
        ),
      )
      .orderBy(desc(auditFiles.createdAt));
  }

  static async getCurrentFiles(tenantId: string, engagementId: string) {
    return db
      .select()
      .from(auditFiles)
      .where(
        and(
          eq(auditFiles.tenantId, tenantId),
          eq(auditFiles.engagementId, engagementId),
          eq(auditFiles.fileType, "CAF"),
        ),
      )
      .orderBy(desc(auditFiles.createdAt));
  }
}
