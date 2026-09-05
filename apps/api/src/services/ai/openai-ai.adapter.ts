import {
  IAiProviderAdapter,
  AiProviderStatus,
  AiAnalysisRequest,
  AiAnalysisResult,
  AiReviewRequest,
  AiReviewResult,
} from "./ai-provider.interface.js";
import { GeminiAdapterConfig } from "./gemini-ai.adapter.js";

export class OpenAiAdapter implements IAiProviderAdapter {
  public readonly providerName = "OPENAI";
  private config: GeminiAdapterConfig;

  constructor(configOverrides?: Partial<GeminiAdapterConfig>) {
    this.config = {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o",
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
    const model = req.model || this.config.model || "gpt-4o";

    if (providerStatus === "NOT_CONFIGURED") {
      return {
        provider: this.providerName,
        model,
        status: "FAILED",
        providerStatus,
        failureReason:
          "AI Provider not configured. Set OPENAI_API_KEY in environment variables.",
      };
    }

    if (this.config.mockMode) {
      return this.handleMockAnalysis(req, providerStatus, model);
    }

    return this.executeWithRetry(async () => {
      return this.callOpenAiApiForDocument(req, providerStatus, model);
    });
  }

  async reviewEngagement(req: AiReviewRequest): Promise<AiReviewResult> {
    const providerStatus = await this.getProviderState();
    const model = req.model || this.config.model || "gpt-4o";

    if (providerStatus === "NOT_CONFIGURED") {
      return {
        provider: this.providerName,
        model,
        status: "FAILED",
        providerStatus,
        failureReason:
          "AI Provider not configured. Set OPENAI_API_KEY in environment variables.",
      };
    }

    if (this.config.mockMode) {
      return this.handleMockReview(req, providerStatus, model);
    }

    return this.executeWithRetry(async () => {
      return this.callOpenAiApiForReview(req, providerStatus, model);
    });
  }

  private handleMockAnalysis(
    req: AiAnalysisRequest,
    providerStatus: AiProviderStatus,
    model: string,
  ): AiAnalysisResult {
    return {
      provider: this.providerName,
      model,
      status: "REVIEW_REQUIRED",
      providerStatus,
      confidenceScore: 91.0,
      classification: req.documentType,
      extractedEntities: { documentType: req.documentType, documentId: req.documentId },
      usageMetadata: { promptTokens: 300, completionTokens: 100, totalTokens: 400 },
      isTestProvider: true,
    };
  }

  private handleMockReview(
    _req: AiReviewRequest,
    providerStatus: AiProviderStatus,
    model: string,
  ): AiReviewResult {
    return {
      provider: this.providerName,
      model,
      status: "REVIEW_REQUIRED",
      providerStatus,
      confidenceScore: 89,
      findings: [
        {
          type: "compliance",
          severity: "low",
          description: "OpenAI automated engagement review completed",
        },
      ],
      usageMetadata: { promptTokens: 1000, completionTokens: 250, totalTokens: 1250 },
      isTestProvider: true,
    };
  }

  private async callOpenAiApiForDocument(
    req: AiAnalysisRequest,
    providerStatus: AiProviderStatus,
    model: string,
  ): Promise<AiAnalysisResult> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You are an AI document extraction assistant. Extract key structured entities and output valid JSON.",
            },
            {
              role: "user",
              content: `Analyze document type "${req.documentType}". Document content:\n${req.extractedText.substring(0, 10000)}`,
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status >= 500 || response.status === 429) {
          throw new Error(`HTTP_${response.status}_RETRYABLE`);
        }
        throw new Error(`HTTP_${response.status}_NON_RETRYABLE`);
      }

      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } };
      const textResponse = data.choices?.[0]?.message?.content;

      if (!textResponse) {
        return {
          provider: this.providerName,
          model,
          status: "FAILED",
          providerStatus,
          failureReason: "Malformed provider response: Missing message content",
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
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
          latencyMs: Date.now() - startTime,
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async callOpenAiApiForReview(
    req: AiReviewRequest,
    providerStatus: AiProviderStatus,
    model: string,
  ): Promise<AiReviewResult> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You are an AI audit review assistant. Output structured findings array in JSON.",
            },
            {
              role: "user",
              content: `Review engagement "${req.evidencePackage.title}" (${req.evidencePackage.engagementType}, ${req.evidencePackage.financialYear}). Evidence summary: ${req.evidencePackage.auditFilesCount} files, ${req.evidencePackage.auditFindingsCount} findings.`,
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status >= 500 || response.status === 429) {
          throw new Error(`HTTP_${response.status}_RETRYABLE`);
        }
        throw new Error(`HTTP_${response.status}_NON_RETRYABLE`);
      }

      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } };
      const textResponse = data.choices?.[0]?.message?.content;

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
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
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
