import {
  db,
  clients,
  engagements,
  studentProfiles,
  tasks,
  timesheetEntries,
  invoices,
  payments,
  workingPapers,
  digitalCertificates,
  eq,
  and,
  sum,
  count,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class AnalyticsService {
  static async getExecutiveDashboardMetrics(tenantId: string) {
    // 1. Total Clients Count
    const [clientCountRow] = await db
      .select({ count: count() })
      .from(clients)
      .where(eq(clients.tenantId, tenantId));
    const totalClients = Number(clientCountRow?.count ?? 0);

    // 2. Total Engagements & Breakdown by Status
    const allEngagements = await db
      .select({
        id: engagements.id,
        status: engagements.status,
      })
      .from(engagements)
      .where(eq(engagements.tenantId, tenantId));

    const totalEngagements = allEngagements.length;
    const engagementsByStatus: Record<string, number> = {
      planning: 0,
      field_work: 0,
      review: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const eng of allEngagements) {
      if (engagementsByStatus[eng.status] !== undefined) {
        engagementsByStatus[eng.status]++;
      }
    }

    // 3. CA Students Count
    const [studentCountRow] = await db
      .select({ count: count() })
      .from(studentProfiles)
      .where(eq(studentProfiles.tenantId, tenantId));
    const caStudentsCount = Number(studentCountRow?.count ?? 0);

    // 4. Invoicing & Billing Financial Metrics
    const [billedSumRow] = await db
      .select({ totalBilled: sum(invoices.totalAmount) })
      .from(invoices)
      .where(eq(invoices.tenantId, tenantId));
    const totalRevenueBilled = Number(billedSumRow?.totalBilled ?? 0);

    const [collectedSumRow] = await db
      .select({ totalCollected: sum(payments.amount) })
      .from(payments)
      .where(eq(payments.tenantId, tenantId));
    const totalRevenueCollected = Number(collectedSumRow?.totalCollected ?? 0);

    const outstandingBilling = totalRevenueBilled - totalRevenueCollected;

    // 5. Working Papers Sign-off Metrics
    const allWps = await db
      .select({ status: workingPapers.status })
      .from(workingPapers)
      .where(eq(workingPapers.tenantId, tenantId));

    const workingPapersByStatus: Record<string, number> = {
      draft: 0,
      prepared: 0,
      approved: 0,
      rejected: 0,
    };
    for (const wp of allWps) {
      if (workingPapersByStatus[wp.status] !== undefined) {
        workingPapersByStatus[wp.status]++;
      }
    }

    // 6. Digital Certificates Issued Metrics
    const allCerts = await db
      .select({
        status: digitalCertificates.status,
        auditOpinion: digitalCertificates.auditOpinion,
      })
      .from(digitalCertificates)
      .where(eq(digitalCertificates.tenantId, tenantId));

    const certificatesIssuedCount = allCerts.filter(
      (c) => c.status === "issued",
    ).length;
    const certificatesByOpinion: Record<string, number> = {
      unmodified: 0,
      qualified: 0,
      adverse: 0,
      disclaimer: 0,
    };
    for (const cert of allCerts) {
      if (certificatesByOpinion[cert.auditOpinion] !== undefined) {
        certificatesByOpinion[cert.auditOpinion]++;
      }
    }

    // 7. Timesheet Hours Metrics
    const [timesheetHoursRow] = await db
      .select({ totalHours: sum(timesheetEntries.hours) })
      .from(timesheetEntries)
      .where(eq(timesheetEntries.tenantId, tenantId));
    const totalLoggedHours = Number(timesheetHoursRow?.totalHours ?? 0);

    return {
      kpiSummary: {
        totalClients,
        totalEngagements,
        activeEngagements:
          (engagementsByStatus.planning || 0) +
          (engagementsByStatus.field_work || 0) +
          (engagementsByStatus.review || 0),
        caStudentsCount,
        totalRevenueBilled,
        totalRevenueCollected,
        outstandingBilling,
        totalLoggedHours,
        certificatesIssuedCount,
      },
      engagementsByStatus,
      workingPapersByStatus,
      certificatesByOpinion,
    };
  }

  static async getEngagementHealthReport(
    tenantId: string,
    engagementId: string,
  ) {
    const engagement = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.tenantId, tenantId),
        eq(engagements.id, engagementId),
      ),
    });

    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }

    // 1. Task Metrics
    const engagementTasks = await db
      .select()
      .from(tasks)
      .where(
        and(eq(tasks.tenantId, tenantId), eq(tasks.engagementId, engagementId)),
      );

    const totalTasks = engagementTasks.length;
    const completedTasks = engagementTasks.filter(
      (t) => t.status === "completed",
    ).length;
    const taskCompletionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 2. Working Paper Metrics
    const engagementWps = await db
      .select()
      .from(workingPapers)
      .where(
        and(
          eq(workingPapers.tenantId, tenantId),
          eq(workingPapers.engagementId, engagementId),
        ),
      );

    const totalWps = engagementWps.length;
    const approvedWps = engagementWps.filter(
      (w) => w.status === "approved",
    ).length;
    const wpApprovalPercentage =
      totalWps > 0 ? Math.round((approvedWps / totalWps) * 100) : 0;

    // 3. Invoicing Metrics
    const [invRow] = await db
      .select({ totalBilled: sum(invoices.totalAmount) })
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          eq(invoices.engagementId, engagementId),
        ),
      );
    const totalBilled = Number(invRow?.totalBilled ?? 0);

    return {
      engagementId: engagement.id,
      title: engagement.title,
      engagementCode: engagement.engagementCode,
      status: engagement.status,
      financialYear: engagement.financialYear,
      tasks: {
        totalTasks,
        completedTasks,
        completionPercentage: taskCompletionPercentage,
      },
      workingPapers: {
        totalWps,
        approvedWps,
        approvalPercentage: wpApprovalPercentage,
      },
      billing: {
        totalBilled,
      },
    };
  }
}
