import {
  IRegulatorAdapter,
  RegulatoryProviderState,
  RegulatorSubmissionRequest,
  RegulatorSubmissionResult,
} from "./regulator-adapter.interface.js";
import { RegulatorAdapterConfig } from "./nbr.adapter.js";

export class FrcAdapter implements IRegulatorAdapter {
  public readonly regulatorName = "FRC";
  private config: RegulatorAdapterConfig;

  constructor(configOverrides?: Partial<RegulatorAdapterConfig>) {
    this.config = {
      apiUrl: process.env.FRC_API_URL,
      apiKey: process.env.FRC_API_KEY,
      ...configOverrides,
    };
  }

  async getProviderState(): Promise<RegulatoryProviderState> {
    if (this.config.apiUrl && this.config.apiKey) {
      return "API_AVAILABLE";
    }
    return "MANUAL_SUBMISSION";
  }

  async submitFiling(req: RegulatorSubmissionRequest): Promise<RegulatorSubmissionResult> {
    void req;
    const state = await this.getProviderState();

    if (state === "MANUAL_SUBMISSION") {
      return {
        regulator: this.regulatorName,
        status: "MANUAL_ACTION_REQUIRED",
        providerState: "MANUAL_SUBMISSION",
        submissionChannel: "MANUAL_SUBMISSION",
        note: "Financial Reporting Council (FRC) automated API unconfigured. Filing data prepared for manual submission.",
        receiptMetadata: {
          preparedAt: new Date().toISOString(),
          requiresManualUpload: true,
        },
      };
    }

    throw new Error("Authoritative FRC API contract is not yet verified. Automated submission failed closed.");
  }
}
