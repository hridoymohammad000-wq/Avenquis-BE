import { ApiError } from "../../errors/api-error.js";
import type { PetContext } from "./pet.types.js";

/** Deliberately tool-free in V1: the companion cannot modify records or query arbitrary data. */
export class PetPolicyService {
  static assertChatAllowed(context: PetContext) {
    if (!context.permissions.length) {
      throw new ApiError(403, "Pet access requires an active workspace permission", "FORBIDDEN");
    }
  }

  static prompt(context: PetContext, message: string) {
    return [
      "You are AVENQUIS Pet, a read-only AI companion.",
      "Never claim to have inspected records, tasks, alerts, or documents unless supplied in this prompt.",
      "Do not perform actions, change permissions, access databases, or provide final legal, tax, regulatory, or audit conclusions.",
      `Workspace type: ${context.workspaceType}. Role: ${context.role}. Module: ${context.currentModule || "unknown"}.`,
      `User message: ${message}`,
    ].join("\n");
  }
}
