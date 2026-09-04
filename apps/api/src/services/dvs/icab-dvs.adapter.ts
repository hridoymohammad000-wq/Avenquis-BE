import {
  IDvsProviderAdapter,
  DvsProviderStatus,
  DvsVerificationResult,
  DvsGenerateRequest,
} from "./dvs-provider.interface.js";

export interface IcabDvsAdapterConfig {
  apiUrl?: string;
  apiKey?: string;
  clientSecret?: string;
}

export class IcabDvsAdapter implements IDvsProviderAdapter {
  public readonly providerName = "ICAB_DVS";
  private config: IcabDvsAdapterConfig;

  constructor(configOverrides?: Partial<IcabDvsAdapterConfig>) {
    this.config = {
      apiUrl: process.env.ICAB_DVS_API_URL,
      apiKey: process.env.ICAB_DVS_API_KEY,
      clientSecret: process.env.ICAB_DVS_CLIENT_SECRET,
      ...configOverrides,
    };
  }

  async getProviderState(): Promise<DvsProviderStatus> {
    if (!this.config.apiUrl || !this.config.apiKey) {
      return "NOT_CONFIGURED";
    }
    // We do not have a verified ICAB API contract for production yet.
    return "MANUAL_REQUIRED";
  }

  async generateVerificationCode(
    req: DvsGenerateRequest,
  ): Promise<DvsVerificationResult> {
    void req;
    const providerState = await this.getProviderState();

    if (providerState === "NOT_CONFIGURED") {
      return {
        isAuthoritative: false,
        status: "PROVIDER_UNAVAILABLE",
        provider: this.providerName,
        providerState,
        dvsCode: "",
        verificationNote: "ICAB DVS provider not configured. Manual action required.",
        auditEvidence: { configured: false, timestamp: new Date().toISOString() },
      };
    }

    // Fail closed because there is no verified live API contract.
    throw new Error("Authoritative ICAB DVS API contract is not yet verified. Automated generation failed closed.");
  }

  async verifyCode(
    dvsCode: string,
    tenantId: string,
  ): Promise<DvsVerificationResult> {
    const providerState = await this.getProviderState();

    if (providerState === "NOT_CONFIGURED") {
      return {
        isAuthoritative: false,
        status: "PROVIDER_UNAVAILABLE",
        provider: this.providerName,
        providerState,
        dvsCode,
        verificationNote: "ICAB DVS provider not configured. Manual verification required.",
        auditEvidence: { tenantId, configured: false, timestamp: new Date().toISOString() },
      };
    }

    throw new Error("Authoritative ICAB DVS API contract is not yet verified. Automated verification failed closed.");
  }
}
