export type RegulatoryProviderState =
  | "NOT_CONFIGURED"
  | "MANUAL_SUBMISSION"
  | "API_AVAILABLE"
  | "UNAVAILABLE";

export type RegulatoryFilingStatus =
  | "DRAFT"
  | "READY_FOR_SUBMISSION"
  | "SUBMISSION_PENDING"
  | "SUBMITTED"
  | "ACCEPTED"
  | "REJECTED"
  | "FAILED"
  | "MANUAL_ACTION_REQUIRED";

export interface RegulatorSubmissionRequest {
  tenantId: string;
  filingId: string;
  regulator: string;
  filingType: string;
  documentUrl?: string;
  idempotencyKey?: string;
  payload?: Record<string, unknown>;
}

export interface RegulatorSubmissionResult {
  regulator: string;
  status: RegulatoryFilingStatus;
  providerState: RegulatoryProviderState;
  submissionChannel: "API_INTEGRATED" | "MANUAL_SUBMISSION";
  externalReference?: string;
  submittedAt?: Date;
  receiptMetadata?: Record<string, unknown>;
  rejectionReason?: string;
  note: string;
}

export interface IRegulatorAdapter {
  regulatorName: string;
  getProviderState(): Promise<RegulatoryProviderState>;
  submitFiling(req: RegulatorSubmissionRequest): Promise<RegulatorSubmissionResult>;
}
