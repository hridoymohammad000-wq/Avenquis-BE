import {
  db,
  auditCompletionChecklists,
  auditReports,
  engagements,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class CompletionReportingService {
  // ──────────── COMPLETION CHECKLIST ────────────

  static async addChecklistItem(
    tenantId: string,
    data: {
      engagementId: string;
      category: string;
      item: string;
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

    const [checklistItem] = await db
      .insert(auditCompletionChecklists)
      .values({
        tenantId,
        engagementId: data.engagementId,
        category: data.category,
        item: data.item,
        isCompleted: false,
      })
      .returning();

    return checklistItem;
  }

  static async markChecklistItemComplete(
    tenantId: string,
    completedByMembershipId: string,
    itemId: string,
    data: {
      isCompleted: boolean;
      comments?: string;
    },
  ) {
    const [updated] = await db
      .update(auditCompletionChecklists)
      .set({
        isCompleted: data.isCompleted,
        ...(data.isCompleted && {
          completedByMembershipId,
          completedAt: new Date(),
        }),
        ...(!data.isCompleted && {
          completedByMembershipId: null,
          completedAt: null,
        }),
        ...(data.comments !== undefined && { comments: data.comments }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(auditCompletionChecklists.tenantId, tenantId),
          eq(auditCompletionChecklists.id, itemId),
        ),
      )
      .returning();

    if (!updated) {
      throw new ApiError(
        404,
        "Checklist item not found",
        "CHECKLIST_ITEM_NOT_FOUND",
      );
    }

    return updated;
  }

  static async getChecklist(tenantId: string, engagementId: string) {
    return db
      .select()
      .from(auditCompletionChecklists)
      .where(
        and(
          eq(auditCompletionChecklists.tenantId, tenantId),
          eq(auditCompletionChecklists.engagementId, engagementId),
        ),
      );
  }

  // ──────────── AUDIT REPORTING ────────────

  static async draftReport(
    tenantId: string,
    draftedByMembershipId: string,
    data: {
      engagementId: string;
      reportType: string;
      opinionText: string;
      basisForOpinion?: string;
      emphasisOfMatter?: string;
      keyAuditMatters?: string;
      otherInformation?: string;
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

    // Check if report already exists
    const existing = await db.query.auditReports.findFirst({
      where: and(
        eq(auditReports.tenantId, tenantId),
        eq(auditReports.engagementId, data.engagementId),
      ),
    });

    if (existing) {
      // Update
      const [updated] = await db
        .update(auditReports)
        .set({
          reportType: data.reportType,
          opinionText: data.opinionText,
          basisForOpinion: data.basisForOpinion,
          emphasisOfMatter: data.emphasisOfMatter,
          keyAuditMatters: data.keyAuditMatters,
          otherInformation: data.otherInformation,
          updatedAt: new Date(),
        })
        .where(eq(auditReports.id, existing.id))
        .returning();
      return updated;
    }

    // Insert
    const [report] = await db
      .insert(auditReports)
      .values({
        tenantId,
        engagementId: data.engagementId,
        reportType: data.reportType,
        opinionText: data.opinionText,
        basisForOpinion: data.basisForOpinion,
        emphasisOfMatter: data.emphasisOfMatter,
        keyAuditMatters: data.keyAuditMatters,
        otherInformation: data.otherInformation,
        status: "draft",
        draftedByMembershipId,
      })
      .returning();

    return report;
  }

  static async signReport(
    tenantId: string,
    signedByMembershipId: string,
    reportId: string,
  ) {
    const report = await db.query.auditReports.findFirst({
      where: and(
        eq(auditReports.tenantId, tenantId),
        eq(auditReports.id, reportId),
      ),
    });

    if (!report || report.status !== "draft") {
      throw new ApiError(
        404,
        "Report not found or already signed",
        "REPORT_NOT_FOUND_OR_SIGNED",
      );
    }

    const pendingChecklist = await db
      .select()
      .from(auditCompletionChecklists)
      .where(
        and(
          eq(auditCompletionChecklists.tenantId, tenantId),
          eq(auditCompletionChecklists.engagementId, report.engagementId),
          eq(auditCompletionChecklists.isCompleted, false),
        ),
      );

    if (pendingChecklist.length > 0) {
      throw new ApiError(
        400,
        "Cannot sign audit report while completion checklist items remain incomplete",
        "UNCOMPLETED_CHECKLIST_ITEMS",
      );
    }

    const [updated] = await db
      .update(auditReports)
      .set({
        status: "signed",
        signedByMembershipId,
        signedAt: new Date(),
        issueDate: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(auditReports.tenantId, tenantId),
          eq(auditReports.id, reportId),
          eq(auditReports.status, "draft"),
        ),
      )
      .returning();

    return updated;
  }

  static async getReport(tenantId: string, engagementId: string) {
    const report = await db.query.auditReports.findFirst({
      where: and(
        eq(auditReports.tenantId, tenantId),
        eq(auditReports.engagementId, engagementId),
      ),
    });
    return report || null;
  }
}
