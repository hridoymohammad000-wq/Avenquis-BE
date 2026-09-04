import {
  db,
  regulatoryFilings,
  engagements,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";
import { IRegulatorAdapter, RegulatoryFilingStatus } from "./regulatory/regulator-adapter.interface.js";
import { NbrAdapter } from "./regulatory/nbr.adapter.js";
import { FrcAdapter } from "./regulatory/frc.adapter.js";
import { BsecAdapter } from "./regulatory/bsec.adapter.js";
import { FilingStateMachine } from "./regulatory/filing-state-machine.js";

export class RegulatoryFilingService {
  private static adapters: Map<string, IRegulatorAdapter> = new Map<string, IRegulatorAdapter>([
    ["NBR", new NbrAdapter()],
    ["FRC", new FrcAdapter()],
    ["BSEC", new BsecAdapter()],
  ]);

  static registerAdapter(regulator: string, adapter: IRegulatorAdapter) {
    this.adapters.set(regulator.toUpperCase(), adapter);
  }

  static getAdapter(regulator: string): IRegulatorAdapter {
    const adapter = this.adapters.get(regulator.toUpperCase());
    if (!adapter) {
      // Default manual fallback adapter for unsupported or generic regulators
      return new FrcAdapter();
    }
    return adapter;
  }

  static async createFiling(
    tenantId: string,
    preparedByMembershipId: string,
    data: {
      engagementId: string;
      regulator: string;
      filingType: string;
      documentUrl?: string;
      status?: string;
      idempotencyKey?: string;
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

    // Check Idempotency Key
    if (data.idempotencyKey) {
      const existing = await db.query.regulatoryFilings.findFirst({
        where: and(
          eq(regulatoryFilings.tenantId, tenantId),
          eq(regulatoryFilings.idempotencyKey, data.idempotencyKey),
        ),
      });

      if (existing) {
        const adapter = this.getAdapter(existing.regulator);
        const providerState = await adapter.getProviderState();
        return {
          ...existing,
          providerStatus: existing.providerStatus || providerState,
          isDuplicateSubmission: true,
          note: "Idempotency key matched existing filing record",
        };
      }
    }

    const adapter = this.getAdapter(data.regulator);
    const providerState = await adapter.getProviderState();

    // Default status handling: normalize "pending" to "DRAFT" or "MANUAL_ACTION_REQUIRED"
    let initialStatus: RegulatoryFilingStatus = "DRAFT";
    if (data.status) {
      const upper = data.status.toUpperCase();
      if (upper === "PENDING") {
        initialStatus = "DRAFT";
      } else {
        initialStatus = upper as RegulatoryFilingStatus;
      }
    }

    const [filing] = await db
      .insert(regulatoryFilings)
      .values({
        tenantId,
        engagementId: data.engagementId,
        regulator: data.regulator.toUpperCase(),
        filingType: data.filingType,
        documentUrl: data.documentUrl,
        status: initialStatus,
        submissionChannel: providerState === "API_AVAILABLE" ? "API_INTEGRATED" : "MANUAL_SUBMISSION",
        providerStatus: providerState,
        idempotencyKey: data.idempotencyKey,
        preparedByMembershipId,
        responseMetadata: {
          createdChannel: providerState,
          timestamp: new Date().toISOString(),
        },
      })
      .returning();

    return {
      ...filing,
      providerStatus: providerState,
      submissionChannel: filing.submissionChannel,
      isExternalIntegration: providerState === "API_AVAILABLE",
      note: providerState === "API_AVAILABLE"
        ? "Filing created and ready for automated API submission"
        : "Internal compliance ledger entry. Direct regulator API unconfigured.",
    };
  }

  static async submitFiling(
    tenantId: string,
    filingId: string,
    submittedByMembershipId: string,
    options?: {
      idempotencyKey?: string;
      adapterOverride?: IRegulatorAdapter;
    },
  ) {
    const filing = await db.query.regulatoryFilings.findFirst({
      where: and(
        eq(regulatoryFilings.tenantId, tenantId),
        eq(regulatoryFilings.id, filingId),
      ),
    });

    if (!filing) {
      throw new ApiError(404, "Filing not found", "FILING_NOT_FOUND");
    }

    const adapter = options?.adapterOverride || this.getAdapter(filing.regulator);

    let result;
    try {
      result = await adapter.submitFiling({
        tenantId,
        filingId: filing.id,
        regulator: filing.regulator,
        filingType: filing.filingType,
        documentUrl: filing.documentUrl || undefined,
        idempotencyKey: options?.idempotencyKey || filing.idempotencyKey || undefined,
      });
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || String(err);
      if (errMsg.includes("timed out")) {
        throw new ApiError(504, "Regulatory gateway timed out", "GATEWAY_TIMEOUT");
      }
      if (errMsg.includes("RETRYABLE")) {
        throw new ApiError(503, "Regulatory gateway temporarily unavailable", "GATEWAY_UNAVAILABLE");
      }
      throw new ApiError(400, `Regulatory submission error: ${errMsg}`, "REGULATOR_ERROR");
    }

    // Validate State Machine Transition
    FilingStateMachine.validateTransition(filing.status, result.status);

    const [updated] = await db
      .update(regulatoryFilings)
      .set({
        status: result.status,
        submissionChannel: result.submissionChannel,
        providerStatus: result.providerState,
        referenceNumber: result.externalReference || filing.referenceNumber,
        responseMetadata: result.receiptMetadata || filing.responseMetadata,
        rejectionReason: result.rejectionReason || filing.rejectionReason,
        submittedAt: result.submittedAt || new Date(),
        submittedByMembershipId,
        lastAttemptAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(regulatoryFilings.tenantId, tenantId), eq(regulatoryFilings.id, filingId)))
      .returning();

    return {
      ...updated,
      isExternalIntegration: result.submissionChannel === "API_INTEGRATED",
      note: result.note,
    };
  }

  static async updateFilingStatus(
    tenantId: string,
    filingId: string,
    actorMembershipId: string,
    data: {
      status: string;
      referenceNumber?: string;
      rejectionReason?: string;
    },
  ) {
    const filing = await db.query.regulatoryFilings.findFirst({
      where: and(
        eq(regulatoryFilings.tenantId, tenantId),
        eq(regulatoryFilings.id, filingId),
      ),
    });

    if (!filing) {
      throw new ApiError(404, "Filing not found", "FILING_NOT_FOUND");
    }

    // Normalize status string
    let newStatus: RegulatoryFilingStatus = data.status.toUpperCase() as RegulatoryFilingStatus;
    if (data.status.toLowerCase() === "submitted") {
      newStatus = "SUBMITTED";
    } else if (data.status.toLowerCase() === "accepted") {
      newStatus = "ACCEPTED";
    } else if (data.status.toLowerCase() === "rejected") {
      newStatus = "REJECTED";
    } else if (data.status.toLowerCase() === "pending") {
      newStatus = "DRAFT";
    }

    FilingStateMachine.validateTransition(filing.status, newStatus);

    const [updated] = await db
      .update(regulatoryFilings)
      .set({
        status: newStatus,
        referenceNumber: data.referenceNumber !== undefined ? data.referenceNumber : filing.referenceNumber,
        rejectionReason: data.rejectionReason !== undefined ? data.rejectionReason : filing.rejectionReason,
        submittedByMembershipId:
          newStatus === "SUBMITTED" || newStatus === "ACCEPTED"
            ? actorMembershipId
            : filing.submittedByMembershipId,
        submittedAt:
          newStatus === "SUBMITTED" || newStatus === "ACCEPTED"
            ? filing.submittedAt || new Date()
            : filing.submittedAt,
        filingDate:
          newStatus === "SUBMITTED" || newStatus === "ACCEPTED"
            ? filing.filingDate || new Date()
            : filing.filingDate,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(regulatoryFilings.tenantId, tenantId),
          eq(regulatoryFilings.id, filingId),
        ),
      )
      .returning();

    return {
      ...updated,
      isExternalIntegration: updated.submissionChannel === "API_INTEGRATED",
    };
  }

  static async recordManualReceipt(
    tenantId: string,
    filingId: string,
    actorMembershipId: string,
    data: {
      referenceNumber: string;
      receiptMetadata?: Record<string, unknown>;
      status?: "SUBMITTED" | "ACCEPTED";
    },
  ) {
    const targetStatus: RegulatoryFilingStatus = data.status || "SUBMITTED";

    return this.updateFilingStatus(tenantId, filingId, actorMembershipId, {
      status: targetStatus,
      referenceNumber: data.referenceNumber,
    });
  }

  static async getEngagementFilings(tenantId: string, engagementId: string) {
    const filings = await db
      .select()
      .from(regulatoryFilings)
      .where(
        and(
          eq(regulatoryFilings.tenantId, tenantId),
          eq(regulatoryFilings.engagementId, engagementId),
        ),
      );

    return filings.map((f) => ({
      ...f,
      isExternalIntegration: f.submissionChannel === "API_INTEGRATED",
    }));
  }
}
