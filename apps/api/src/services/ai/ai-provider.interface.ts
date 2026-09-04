export type AiProviderStatus =
  | "NOT_CONFIGURED"
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "DEGRADED";

export type AiJobStatus =
  | "QUEUED"
  | "PROCESSING"
  | "REVIEW_REQUIRED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type HumanReviewStatus =
  | "UNREVIEWED"
  | "APPROVED"
  | "REJECTED"
  | "OVERRIDDEN";

export interface UsageMetadata {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
  estimatedCostUsd?: number;
}

export interface AiAnalysisRequest {
  tenantId: string;
  engagementId?: string;
  documentUrl: string;
  documentType: string;
  model?: string;
  idempotencyKey?: string;
}

export interface AiAnalysisResult {
  provider: string;
  model: string;
  status: AiJobStatus;
  providerStatus: AiProviderStatus;
  confidenceScore?: number;
  extractedEntities?: Record<string, unknown>;
  classification?: string;
  findings?: Array<{ type: string; severity: string; description: string }>;
  failureReason?: string;
  usageMetadata?: UsageMetadata;
  isTestProvider?: boolean;
}

export interface AiReviewRequest {
  tenantId: string;
  engagementId: string;
  model: string;
  idempotencyKey?: string;
}

export interface AiReviewResult {
  provider: string;
  model: string;
  status: AiJobStatus;
  providerStatus: AiProviderStatus;
  confidenceScore?: number;
  findings?: Array<{ type: string; severity: string; description: string }>;
  failureReason?: string;
  usageMetadata?: UsageMetadata;
  isTestProvider?: boolean;
}

export interface IAiProviderAdapter {
  providerName: string;
  getProviderState(): Promise<AiProviderStatus>;
  analyzeDocument(req: AiAnalysisRequest): Promise<AiAnalysisResult>;
  reviewEngagement(req: AiReviewRequest): Promise<AiReviewResult>;
}
