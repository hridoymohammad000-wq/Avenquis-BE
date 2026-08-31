import {
  db,
  workingPapers,
  reviewNotes,
  clientDocumentRequests,
  engagements,
  memberships,
  userProfiles,
} from "@avenquis/database";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import { ApiError } from "../errors/api-error.js";

export class WorkingPaperService {
  static async listWorkingPapers(
    tenantId: string,
    engagementId: string,
    options?: {
      section?: string;
      status?: string;
      search?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const conditions = [
      eq(workingPapers.tenantId, tenantId),
      eq(workingPapers.engagementId, engagementId),
    ];

    if (options?.section) {
      conditions.push(eq(workingPapers.section, options.section));
    }
    if (options?.status) {
      conditions.push(eq(workingPapers.status, options.status));
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      const condOr = or(
        ilike(workingPapers.title, searchPattern),
        ilike(workingPapers.wpCode, searchPattern),
      );
      if (condOr) conditions.push(condOr);
    }

    const rows = await db
      .select()
      .from(workingPapers)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(workingPapers.createdAt));

    return rows;
  }

  static async createWorkingPaper(
    tenantId: string,
    data: {
      engagementId: string;
      wpCode: string;
      title: string;
      section: string;
      fileUrl?: string;
      remarks?: string;
    },
  ) {
    // 1. Verify engagement exists in tenant
    const engagement = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.tenantId, tenantId),
        eq(engagements.id, data.engagementId),
      ),
    });

    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }

    // 2. Enforce unique wpCode per engagement
    const existing = await db.query.workingPapers.findFirst({
      where: and(
        eq(workingPapers.tenantId, tenantId),
        eq(workingPapers.engagementId, data.engagementId),
        eq(workingPapers.wpCode, data.wpCode),
      ),
    });

    if (existing) {
      throw new ApiError(
        409,
        `Working paper code '${data.wpCode}' already exists in this engagement`,
        "WP_CODE_EXISTS",
      );
    }

    const [wp] = await db
      .insert(workingPapers)
      .values({
        tenantId,
        engagementId: data.engagementId,
        wpCode: data.wpCode,
        title: data.title,
        section: data.section,
        fileUrl: data.fileUrl,
        remarks: data.remarks,
        status: "draft",
        version: 1,
      })
      .returning();

    return wp;
  }

  static async getWorkingPaperById(tenantId: string, wpId: string) {
    const wp = await db.query.workingPapers.findFirst({
      where: and(
        eq(workingPapers.tenantId, tenantId),
        eq(workingPapers.id, wpId),
      ),
    });

    if (!wp) {
      throw new ApiError(
        404,
        "Working paper not found",
        "WORKING_PAPER_NOT_FOUND",
      );
    }

    // Fetch review notes with author details
    const notes = await db
      .select({
        id: reviewNotes.id,
        content: reviewNotes.content,
        status: reviewNotes.status,
        authorMembershipId: reviewNotes.authorMembershipId,
        authorFullName: userProfiles.fullName,
        addressedAt: reviewNotes.addressedAt,
        clearedAt: reviewNotes.clearedAt,
        createdAt: reviewNotes.createdAt,
      })
      .from(reviewNotes)
      .innerJoin(
        memberships,
        eq(reviewNotes.authorMembershipId, memberships.id),
      )
      .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
      .where(
        and(
          eq(reviewNotes.tenantId, tenantId),
          eq(reviewNotes.workingPaperId, wpId),
        ),
      )
      .orderBy(desc(reviewNotes.createdAt));

    // Fetch preparer details
    let preparer = null;
    if (wp.preparedByMembershipId) {
      const [p] = await db
        .select({
          membershipId: memberships.id,
          fullName: userProfiles.fullName,
          email: userProfiles.email,
        })
        .from(memberships)
        .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
        .where(eq(memberships.id, wp.preparedByMembershipId));
      preparer = p ?? null;
    }

    // Fetch reviewer details
    let reviewer = null;
    if (wp.reviewedByMembershipId) {
      const [r] = await db
        .select({
          membershipId: memberships.id,
          fullName: userProfiles.fullName,
          email: userProfiles.email,
        })
        .from(memberships)
        .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
        .where(eq(memberships.id, wp.reviewedByMembershipId));
      reviewer = r ?? null;
    }

    return {
      ...wp,
      preparer,
      reviewer,
      reviewNotes: notes,
    };
  }

  static async signoffWorkingPaper(
    tenantId: string,
    wpId: string,
    action: "prepare" | "approve" | "reject",
    membershipId: string,
    remarks?: string,
  ) {
    const wp = await db.query.workingPapers.findFirst({
      where: and(
        eq(workingPapers.tenantId, tenantId),
        eq(workingPapers.id, wpId),
      ),
    });

    if (!wp) {
      throw new ApiError(
        404,
        "Working paper not found",
        "WORKING_PAPER_NOT_FOUND",
      );
    }

    let updatedStatus = wp.status;
    let preparedByMembershipId = wp.preparedByMembershipId;
    let preparedAt = wp.preparedAt;
    let reviewedByMembershipId = wp.reviewedByMembershipId;
    let reviewedAt = wp.reviewedAt;

    if (action === "prepare") {
      updatedStatus = "prepared";
      preparedByMembershipId = membershipId;
      preparedAt = new Date();
    } else if (action === "approve") {
      updatedStatus = "approved";
      reviewedByMembershipId = membershipId;
      reviewedAt = new Date();
    } else if (action === "reject") {
      updatedStatus = "rejected";
      reviewedByMembershipId = membershipId;
      reviewedAt = new Date();
    }

    const [updated] = await db
      .update(workingPapers)
      .set({
        status: updatedStatus,
        preparedByMembershipId,
        preparedAt,
        reviewedByMembershipId,
        reviewedAt,
        remarks: remarks ?? wp.remarks,
        updatedAt: new Date(),
      })
      .where(
        and(eq(workingPapers.tenantId, tenantId), eq(workingPapers.id, wpId)),
      )
      .returning();

    return updated;
  }

  static async addReviewNote(
    tenantId: string,
    wpId: string,
    authorMembershipId: string,
    content: string,
  ) {
    const wp = await db.query.workingPapers.findFirst({
      where: and(
        eq(workingPapers.tenantId, tenantId),
        eq(workingPapers.id, wpId),
      ),
    });

    if (!wp) {
      throw new ApiError(
        404,
        "Working paper not found",
        "WORKING_PAPER_NOT_FOUND",
      );
    }

    const [note] = await db
      .insert(reviewNotes)
      .values({
        tenantId,
        workingPaperId: wpId,
        authorMembershipId,
        content,
        status: "open",
      })
      .returning();

    return note;
  }

  static async updateReviewNoteStatus(
    tenantId: string,
    noteId: string,
    action: "address" | "clear",
    membershipId: string,
  ) {
    const note = await db.query.reviewNotes.findFirst({
      where: and(
        eq(reviewNotes.tenantId, tenantId),
        eq(reviewNotes.id, noteId),
      ),
    });

    if (!note) {
      throw new ApiError(404, "Review note not found", "REVIEW_NOTE_NOT_FOUND");
    }

    let status = note.status;
    let addressedByMembershipId = note.addressedByMembershipId;
    let addressedAt = note.addressedAt;
    let clearedByMembershipId = note.clearedByMembershipId;
    let clearedAt = note.clearedAt;

    if (action === "address") {
      status = "addressed";
      addressedByMembershipId = membershipId;
      addressedAt = new Date();
    } else if (action === "clear") {
      status = "cleared";
      clearedByMembershipId = membershipId;
      clearedAt = new Date();
    }

    const [updated] = await db
      .update(reviewNotes)
      .set({
        status,
        addressedByMembershipId,
        addressedAt,
        clearedByMembershipId,
        clearedAt,
        updatedAt: new Date(),
      })
      .where(
        and(eq(reviewNotes.tenantId, tenantId), eq(reviewNotes.id, noteId)),
      )
      .returning();

    return updated;
  }

  static async listDocumentRequests(tenantId: string, engagementId: string) {
    const requests = await db
      .select()
      .from(clientDocumentRequests)
      .where(
        and(
          eq(clientDocumentRequests.tenantId, tenantId),
          eq(clientDocumentRequests.engagementId, engagementId),
        ),
      )
      .orderBy(desc(clientDocumentRequests.createdAt));

    return requests;
  }

  static async createDocumentRequest(
    tenantId: string,
    data: {
      engagementId: string;
      requestTitle: string;
      description?: string;
      dueDate?: Date;
    },
  ) {
    const engagement = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.tenantId, tenantId),
        eq(engagements.id, data.engagementId),
      ),
    });

    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }

    const [request] = await db
      .insert(clientDocumentRequests)
      .values({
        tenantId,
        engagementId: data.engagementId,
        requestTitle: data.requestTitle,
        description: data.description,
        dueDate: data.dueDate,
        status: "pending",
      })
      .returning();

    return request;
  }

  static async fulfillDocumentRequest(
    tenantId: string,
    requestId: string,
    uploadedFileUrl: string,
  ) {
    const req = await db.query.clientDocumentRequests.findFirst({
      where: and(
        eq(clientDocumentRequests.tenantId, tenantId),
        eq(clientDocumentRequests.id, requestId),
      ),
    });

    if (!req) {
      throw new ApiError(
        404,
        "Document request not found",
        "DOCUMENT_REQUEST_NOT_FOUND",
      );
    }

    const [updated] = await db
      .update(clientDocumentRequests)
      .set({
        uploadedFileUrl,
        status: "submitted",
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clientDocumentRequests.tenantId, tenantId),
          eq(clientDocumentRequests.id, requestId),
        ),
      )
      .returning();

    return updated;
  }
}
