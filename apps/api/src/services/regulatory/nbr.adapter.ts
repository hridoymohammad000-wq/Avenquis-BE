import {
  IRegulatorAdapter,
  RegulatoryProviderState,
  RegulatorSubmissionRequest,
  RegulatorSubmissionResult,
} from "./regulator-adapter.interface.js";

export interface RegulatorAdapterConfig {
  apiUrl?: string;
  apiKey?: string;
}

export class NbrAdapter implements IRegulatorAdapter {
  public readonly regulatorName = "NBR";
  private config: RegulatorAdapterConfig;

  constructor(configOverrides?: Partial<RegulatorAdapterConfig>) {
    this.config = {
      apiUrl: process.env.NBR_API_URL,
      apiKey: process.env.NBR_API_KEY,
      ...configOverrides,
    };
  }

  async getProviderState(): Promise<RegulatoryProviderState> {
    if (this.config.apiUrl && this.config.apiKey) {
      return "API_AVAILABLE"; // But we don't have the API contract implemented yet!
    }
    return "MANUAL_SUBMISSION";
  }

  async submitFiling(req: RegulatorSubmissionRequest): Promise<RegulatorSubmissionResult> {
    void req;
    const state = await this.getProviderState();
    
    // NBR Automated integration is not yet verified. Always require manual submission or fail closed.
    if (state === "MANUAL_SUBMISSION") {
      return {
        regulator: this.regulatorName,
        status: "MANUAL_ACTION_REQUIRED",
        providerState: "MANUAL_SUBMISSION",
        submissionChannel: "MANUAL_SUBMISSION",
        note: "National Board of Revenue (NBR) automated API unconfigured. Filing data prepared for manual submission.",
        receiptMetadata: {
          preparedAt: new Date().toISOString(),
          requiresManualUpload: true,
        },
      };
    }
    
    // We don't have the actual endpoints, fail closed.
    throw new Error("Authoritative NBR API contract is not yet verified. Automated submission failed closed.");
  }
}
