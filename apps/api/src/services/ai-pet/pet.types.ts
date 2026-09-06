import type { AiProviderStatus } from "../ai/ai-provider.interface.js";

export const PET_STATES = ["IDLE", "THINKING", "WORKING", "SUCCESS", "ALERT", "CONFUSED", "ERROR", "SLEEPING"] as const;
export type PetState = (typeof PET_STATES)[number];
export type PetContextType = "FIRM" | "PLATFORM_ADMIN";

export interface PetContext {
  userId: string;
  membershipId: string;
  tenantId: string;
  role: string;
  workspaceType: PetContextType;
  permissions: string[];
  currentRoute?: string;
  currentModule?: string;
  entityType?: string;
  entityId?: string;
}

export interface PetChatResult {
  message: string;
  state: PetState;
  contextType: PetContextType;
  providerStatus: AiProviderStatus;
}
