import { RegulatoryFilingStatus } from "./regulator-adapter.interface.js";
import { ApiError } from "../../errors/api-error.js";

const ALLOWED_TRANSITIONS: Record<RegulatoryFilingStatus, RegulatoryFilingStatus[]> = {
  DRAFT: ["READY_FOR_SUBMISSION", "SUBMISSION_PENDING", "MANUAL_ACTION_REQUIRED", "SUBMITTED", "FAILED"],
  READY_FOR_SUBMISSION: ["SUBMISSION_PENDING", "MANUAL_ACTION_REQUIRED", "SUBMITTED", "FAILED"],
  SUBMISSION_PENDING: ["SUBMITTED", "ACCEPTED", "REJECTED", "FAILED", "MANUAL_ACTION_REQUIRED"],
  MANUAL_ACTION_REQUIRED: ["SUBMITTED", "ACCEPTED", "REJECTED", "FAILED"],
  SUBMITTED: ["ACCEPTED", "REJECTED", "FAILED"],
  REJECTED: ["DRAFT", "READY_FOR_SUBMISSION"],
  FAILED: ["DRAFT", "READY_FOR_SUBMISSION"],
  ACCEPTED: [], // Terminal state
};

export class FilingStateMachine {
  static validateTransition(
    currentStatus: RegulatoryFilingStatus | string,
    newStatus: RegulatoryFilingStatus | string,
  ): void {
    // Normalization if string matches case-insensitive or legacy format
    const curr = (currentStatus?.toUpperCase() || "DRAFT") as RegulatoryFilingStatus;
    const next = (newStatus?.toUpperCase()) as RegulatoryFilingStatus;

    if (curr === next) {
      return; // No-op transition
    }

    const allowed = ALLOWED_TRANSITIONS[curr];
    if (!allowed || !allowed.includes(next)) {
      throw new ApiError(
        400,
        `Invalid filing state transition from '${currentStatus}' to '${newStatus}'`,
        "INVALID_STATE_TRANSITION",
      );
    }
  }
}
