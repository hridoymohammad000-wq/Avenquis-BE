import {
  IAiProviderAdapter,
  AiProviderStatus,
  AiAnalysisRequest,
  AiAnalysisResult,
  AiReviewRequest,
  AiReviewResult,
} from "./ai-provider.interface.js";

export interface GeminiAdapterConfig {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
  mockMode?: "SUCCESS" | "FAIL_RETRYABLE" | "FAIL_PERMANENT" | "TIMEOUT" | "MALFORMED";
}

export class GeminiAiAdapter implements IAiProviderAdapter {
  public readonly providerName = "GEMINI";
  private config: GeminiAdapterConfig;

  constructor(configOverrides?: Partial<GeminiAdapterConfig>) {
    this.config = {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
      timeoutMs: process.env.AI_TIMEOUT_MS ? parseInt(process.env.AI_TIMEOUT_MS, 10) : 10000,
      maxRetries: 2,
      ...configOverrides,
    };
  }

  async getProviderState(): Promise<AiProviderStatus> {
    if (!this.config.apiKey) {
      return "NOT_CONFIGURED";
    }
    return "AVAILABLE";
  }

  async analyzeDocument(req: AiAnalysisRequest): Promise<AiAnalysisResult> {
    const providerStatus = await this.getProviderState();
    const model = req.model || this.config.model || "gemini-1.5-pro";

    if (providerStatus === "NOT_CONFIGURED") {
      return {
        provider: this.providerName,
        model,
        status: "FAILED",
        providerStatus,
        failureReason:
          "AI Provider not configured. Set GEMINI_API_KEY in environment variables.",
      };
    }

    if (this.config.mockMode) {
      return this.handleMockAnalysis(req, providerStatus, model);
    }

    return this.executeWithRetry(async () => {
      return this.callGeminiApiForDocument(req, providerStatus, model);
    });
  }

  async reviewEngagement(req: AiReviewRequest): Promise<AiReviewResult> {
    const providerStatus = await this.getProviderState();
    const model = req.model || this.config.model || "gemini-1.5-pro";

    if (providerStatus === "NOT_CONFIGURED") {
      return {
        provider: this.providerName,
        model,
        status: "FAILED",
        providerStatus,
        failureReason:
          "AI Provider not configured. Set GEMINI_API_KEY in environment variables.",
      };
    }

    if (this.config.mockMode) {
      return this.handleMockReview(req, providerStatus, model);
    }

    return this.executeWithRetry(async () => {
      return this.callGeminiApiForReview(req, providerStatus, model);
    });
  }

  private handleMockAnalysis(
    req: AiAnalysisRequest,
    providerStatus: AiProviderStatus,
    model: string,
  ): AiAnalysisResult {
    const startTime = Date.now();

    switch (this.config.mockMode) {
      case "FAIL_PERMANENT":
        return {
          provider: this.providerName,
          model,
          status: "FAILED",
          providerStatus,
          failureReason: "Document extraction or analysis failed permanently",
          isTestProvider: true,
        };
      case "FAIL_RETRYABLE":
        throw new Error("HTTP_503_RETRYABLE: Gemini service temporarily unavailable");
      case "TIMEOUT":
        throw new Error("AI provider request timed out after " + this.config.timeoutMs + "ms");
      case "MALFORMED":
        return {
          provider: this.providerName,
          model,
          status: "FAILED",
          providerStatus,
          failureReason: "Malformed provider response: Cannot parse structured entities",
          isTestProvider: true,
        };
      case "SUCCESS":
      default:
        return {
          provider: this.providerName,
          model,
          status: "REVIEW_REQUIRED",
          providerStatus,
          confidenceScore: 92.5,
          classification: req.documentType,
          extractedEntities: {
            documentType: req.documentType,
            documentId: req.documentId,
            extractedFields: ["entity_name", "date", "amount"],
          },
          usageMetadata: {
            promptTokens: 450,
            completionTokens: 120,
            totalTokens: 570,
            latencyMs: Date.now() - startTime + 50,
            estimatedCostUsd: 0.001425,
          },
          isTestProvider: true,
        };
    }
  }

  private handleMockReview(
    _req: AiReviewRequest,
    providerStatus: AiProviderStatus,
    model: string,
  ): AiReviewResult {
    const startTime = Date.now();

    switch (this.config.mockMode) {
      case "FAIL_PERMANENT":
        return {
          provider: this.providerName,
          model,
          status: "FAILED",
          providerStatus,
          failureReason: "Engagement review failed due to incomplete workpaper data",
          isTestProvider: true,
        };
      case "FAIL_RETRYABLE":
        throw new Error("HTTP_503_RETRYABLE: Gemini model quota exceeded");
      case "TIMEOUT":
        throw new Error("AI provider request timed out after " + this.config.timeoutMs + "ms");
      case "MALFORMED":
        return {
          provider: this.providerName,
          model,
          status: "FAILED",
          providerStatus,
          failureReason: "Malformed provider response: Invalid findings JSON structure",
          isTestProvider: true,
        };
      case "SUCCESS":
      default:
        return {
          provider: this.providerName,
          model,
          status: "REVIEW_REQUIRED",
          providerStatus,
          confidenceScore: 88,
          findings: [
            {
              type: "risk",
              severity: "medium",
              description: "Verification required for signoff documentation completeness.",
            },
          ],
          usageMetadata: {
            promptTokens: 1200,
            completionTokens: 350,
            totalTokens: 1550,
            latencyMs: Date.now() - startTime + 80,
            estimatedCostUsd: 0.003875,
          },
          isTestProvider: true,
        };
    }
  }

  private async callGeminiApiForDocument(
    req: AiAnalysisRequest,
    providerStatus: AiProviderStatus,
    model: string,
  ): Promise<AiAnalysisResult> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze document type "${req.documentType}". Document content:\n${req.extractedText.substring(0, 10000)}\nExtract key structured entities and output valid JSON.`,
                  },
                ],
              },
            ],
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        if (response.status >= 500 || response.status === 429) {
          throw new Error(`HTTP_${response.status}_RETRYABLE`);
        }
        throw new Error(`HTTP_${response.status}_NON_RETRYABLE`);
      }

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          totalTokenCount?: number;
        };
      };
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) {
        return {
          provider: this.providerName,
          model,
          status: "FAILED",
          providerStatus,
          failureReason: "Malformed provider response: Missing generated content parts",
        };
      }

      return {
        provider: this.providerName,
        model,
        status: "REVIEW_REQUIRED",
        providerStatus,
        confidenceScore: 90.0,
        classification: req.documentType,
        extractedEntities: { rawOutput: textResponse },
        usageMetadata: {
          promptTokens: data.usageMetadata?.promptTokenCount || 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata?.totalTokenCount || 0,
          latencyMs: Date.now() - startTime,
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async callGeminiApiForReview(
    req: AiReviewRequest,
    providerStatus: AiProviderStatus,
    model: string,
  ): Promise<AiReviewResult> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Review engagement "${req.evidencePackage.title}" (${req.evidencePackage.engagementType}, ${req.evidencePackage.financialYear}). Evidence summary: ${req.evidencePackage.auditFilesCount} files, ${req.evidencePackage.auditFindingsCount} findings. Output structured findings array in JSON.`,
                  },
                ],
              },
            ],
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        if (response.status >= 500 || response.status === 429) {
          throw new Error(`HTTP_${response.status}_RETRYABLE`);
        }
        throw new Error(`HTTP_${response.status}_NON_RETRYABLE`);
      }

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          totalTokenCount?: number;
        };
      };
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      return {
        provider: this.providerName,
        model,
        status: "REVIEW_REQUIRED",
        providerStatus,
        confidenceScore: 85,
        findings: [
          {
            type: "compliance",
            severity: "medium",
            description: textResponse || "Review completed",
          },
        ],
        usageMetadata: {
          promptTokens: data.usageMetadata?.promptTokenCount || 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata?.totalTokenCount || 0,
          latencyMs: Date.now() - startTime,
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    const maxRetries = this.config.maxRetries ?? 2;

    while (attempt <= maxRetries) {
      try {
        return await fn();
      } catch (err: unknown) {
        attempt++;
        const message = (err as Error)?.message || String(err);
        const isRetryable =
          message.includes("RETRYABLE") ||
          message.includes("timed out") ||
          message.includes("AbortError") ||
          message.includes("ECONNRESET");

        if (!isRetryable || attempt > maxRetries) {
          throw err;
        }

        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 100));
      }
    }

    throw new Error("Execution failed after maximum retries");
  }
}
