import { AiIntelligenceService } from "../ai-intelligence.service.js";
import { logger } from "../../logging/logger.js";
import { ApiError } from "../../errors/api-error.js";
import { PetPolicyService } from "./pet-policy.service.js";
import type { PetChatResult, PetContext } from "./pet.types.js";

export class PetService {
  static async chat(context: PetContext, message: string): Promise<PetChatResult> {
    PetPolicyService.assertChatAllowed(context);
    const adapter = AiIntelligenceService.getAdapter();
    const providerStatus = await adapter.getProviderState();
    logger.info({ event: "ai_pet.request_started", tenantId: context.tenantId, contextType: context.workspaceType }, "AI Pet request started");
    if (providerStatus === "NOT_CONFIGURED") {
      logger.warn({ event: "ai_pet.provider_unavailable", tenantId: context.tenantId }, "AI Pet provider unavailable");
      throw new ApiError(503, "AI Pet provider is not configured", "AI_NOT_CONFIGURED");
    }
    try {
      const result = await adapter.chat({ prompt: PetPolicyService.prompt(context, message) });
      if (!result.message) throw new Error("Provider returned an empty message");
      logger.info({ event: "ai_pet.request_succeeded", tenantId: context.tenantId, contextType: context.workspaceType }, "AI Pet request succeeded");
      return { message: result.message, state: "SUCCESS", contextType: context.workspaceType, providerStatus: result.providerStatus };
    } catch (error) {
      logger.error({ event: "ai_pet.request_failed", tenantId: context.tenantId, err: error instanceof Error ? error.message : "unknown" }, "AI Pet request failed");
      throw new ApiError(502, "AI Pet is temporarily unavailable", "AI_UNAVAILABLE");
    }
  }
}
