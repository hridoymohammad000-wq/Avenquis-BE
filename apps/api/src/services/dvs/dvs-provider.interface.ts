export type DvsProviderStatus =
  | "NOT_CONFIGURED"
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "DEGRADED"
  | "OFFLINE";

export type DvsVerificationStatus =
  | "PENDING"
  | "PROCESSING"
  | "VERIFIED"
  | "REJECTED"
  | "FAILED"
  | "PROVIDER_UNAVAILABLE";

export interface DvsGenerateRequest {
  tenantId: string;
  engagementId: string;
  documentType: string;
  documentHash?: string;
  metadata?: Record<string, unknown>;
}

export interface DvsVerificationResult {
  isAuthoritative: boolean;
  status: DvsVerificationStatus;
  provider: string;
  providerState: DvsProviderStatus;
  dvsCode: string;
  externalReference?: string;
  verificationNote: string;
  auditEvidence: Record<string, unknown>;
  failureReason?: string;
}

export interface IDvsProviderAdapter {
  providerName: string;
  getProviderState(): Promise<DvsProviderStatus>;
  generateVerificationCode(
    req: DvsGenerateRequest,
  ): Promise<DvsVerificationResult>;
  verifyCode(
    dvsCode: string,
    tenantId: string,
  ): Promise<DvsVerificationResult>;
}
