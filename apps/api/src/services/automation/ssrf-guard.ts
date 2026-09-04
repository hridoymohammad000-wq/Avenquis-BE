import { URL } from "url";
import net from "net";
import { ApiError } from "../../errors/api-error.js";

/**
 * SSRF Guard Utility
 * Validates external webhook URLs against SSRF vulnerabilities (loopback, private ranges, metadata IPs).
 */
export class SsrfGuard {
  static validateUrl(
    targetUrl: string,
    options?: { allowHttpInNonProd?: boolean },
  ): void {
    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      throw new ApiError(400, "Invalid webhook target URL format", "INVALID_WEBHOOK_URL");
    }

    const isProduction = process.env.NODE_ENV === "production";
    const allowHttp = options?.allowHttpInNonProd ?? !isProduction;

    if (parsed.protocol !== "https:" && !(allowHttp && parsed.protocol === "http:")) {
      throw new ApiError(
        400,
        "Webhook endpoints must use HTTPS protocol in production",
        "HTTPS_REQUIRED",
      );
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost, loopback names, and local hostnames
    if (
      hostname === "localhost" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname === "0.0.0.0"
    ) {
      throw new ApiError(
        400,
        "Webhook target URL cannot point to local or internal hostnames",
        "SSRF_BLOCKED",
      );
    }

    // Check IP addresses
    if (net.isIP(hostname)) {
      if (this.isPrivateOrLoopbackIp(hostname)) {
        throw new ApiError(
          400,
          `Webhook target URL points to restricted IP address (${hostname})`,
          "SSRF_BLOCKED",
        );
      }
    }
  }

  /**
   * Checks if an IPv4 or IPv6 address belongs to private/loopback/metadata ranges.
   */
  static isPrivateOrLoopbackIp(ip: string): boolean {
    if (ip === "127.0.0.1" || ip === "::1" || ip === "0.0.0.0") {
      return true;
    }

    // Cloud Metadata Endpoint (AWS / GCP / Azure)
    if (ip === "169.254.169.254" || ip.startsWith("169.254.")) {
      return true;
    }

    // IPv4 Private Ranges
    if (net.isIPv4(ip)) {
      const parts = ip.split(".").map((p) => parseInt(p, 10));

      // 10.0.0.0/8
      if (parts[0] === 10) return true;

      // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

      // 192.168.0.0/16
      if (parts[0] === 192 && parts[1] === 168) return true;

      // 127.0.0.0/8
      if (parts[0] === 127) return true;

      // 0.0.0.0/8
      if (parts[0] === 0) return true;
    }

    return false;
  }
}
