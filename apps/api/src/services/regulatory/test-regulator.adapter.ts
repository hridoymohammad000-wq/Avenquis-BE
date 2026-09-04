import {
  IRegulatorAdapter,
  RegulatoryProviderState,
  RegulatorSubmissionRequest,
  RegulatorSubmissionResult,
} from "./regulator-adapter.interface.js";

export interface TestRegulatorAdapterConfig {
  apiUrl?: string;
  apiKey?: string;
  mockMode?: "SUCCESS" | "REJECT" | "TIMEOUT" | "RETRYABLE_FAIL" | "NON_RETRYABLE_FAIL";
  regulatorName?: string;
}

export class TestRegulatorAdapter implements IRegulatorAdapter {
  public readonly regulatorName: string;
  private config: TestRegulatorAdapterConfig;

  constructor(configOverrides?: Partial<TestRegulatorAdapterConfig>) {
    this.config = { ...configOverrides };
    this.regulatorName = this.config.regulatorName || "TEST_REGULATOR";
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
    
    if (this.config.mockMode) {
      return this.handleMock(req, state);
    }
    
    if (state === "MANUAL_SUBMISSION") {
      return {
        regulator: this.regulatorName,
        status: "MANUAL_ACTION_REQUIRED",
        providerState: "MANUAL_SUBMISSION",
        submissionChannel: "MANUAL_SUBMISSION",
        note: "Automated API unconfigured. Filing data prepared for manual submission.",
        receiptMetadata: {
          preparedAt: new Date().toISOString(),
          requiresManualUpload: true,
        },
      };
    }
    
    throw new Error("Authoritative API contract is not yet verified. Automated submission failed closed.");
  }

  private handleMock(
    req: RegulatorSubmissionRequest,
    providerState: RegulatoryProviderState,
  ): RegulatorSubmissionResult {
    void req;
    switch (this.config.mockMode) {
      case "REJECT":
        return {
          regulator: this.regulatorName,
          status: "REJECTED",
          providerState,
          submissionChannel: "API_INTEGRATED",
          rejectionReason: `${this.regulatorName} validation failed: Invalid TIN or BIN number format`,
          note: `Filing rejected by ${this.regulatorName} automated validation rules`,
        };
      case "TIMEOUT":
        throw new Error(`${this.regulatorName} gateway connection timed out after 5000ms`);
      case "RETRYABLE_FAIL":
        throw new Error(`HTTP_503_SERVICE_UNAVAILABLE: ${this.regulatorName} gateway undergoing maintenance`);
      case "NON_RETRYABLE_FAIL":
        throw new Error("HTTP_400_BAD_REQUEST: Malformed tax filing XML schema");
      case "SUCCESS":
      default:
        return {
          regulator: this.regulatorName,
          status: "ACCEPTED",
          providerState: "API_AVAILABLE",
          submissionChannel: "API_INTEGRATED",
          externalReference: `${this.regulatorName}-ACK-${Date.now()}`,
          submittedAt: new Date(),
          note: `Filing authoritatively accepted by ${this.regulatorName} portal`,
          receiptMetadata: { ackNumber: `ACK-${this.regulatorName}-${Date.now()}` },
        };
    }
  }
}
