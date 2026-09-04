import {
  IDvsProviderAdapter,
  DvsProviderStatus,
  DvsVerificationResult,
  DvsGenerateRequest,
} from "./dvs-provider.interface.js";

export class ManualDvsAdapter implements IDvsProviderAdapter {
  public readonly providerName = "MANUAL_DVS";

  async getProviderState(): Promise<DvsProviderStatus> {
    return "MANUAL_REQUIRED";
  }

  async generateVerificationCode(
    req: DvsGenerateRequest,
  ): Promise<DvsVerificationResult> {
    void req;
    return {
      isAuthoritative: false,
      status: "MANUAL_ACTION_REQUIRED",
      provider: this.providerName,
      providerState: "MANUAL_REQUIRED",
      dvsCode: "",
      verificationNote: "Manual DVS code acquisition required.",
      auditEvidence: { manual: true, timestamp: new Date().toISOString() },
    };
  }

  async verifyCode(
    dvsCode: string,
    tenantId: string,
  ): Promise<DvsVerificationResult> {
    return {
      isAuthoritative: false,
      status: "MANUAL_ACTION_REQUIRED",
      provider: this.providerName,
      providerState: "MANUAL_REQUIRED",
      dvsCode,
      verificationNote: "Manual DVS verification required.",
      auditEvidence: { tenantId, manual: true, timestamp: new Date().toISOString() },
    };
  }
}
