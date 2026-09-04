import { URL } from "url";
import net from "net";
import dns from "dns/promises";
import { ApiError } from "../../errors/api-error.js";

/**
 * SSRF Guard Utility
 * Validates external webhook URLs against SSRF vulnerabilities (loopback, private ranges, metadata IPs).
 * 
 * Note on TOCTOU / Rebinding:
 * In this implementation, we resolve the hostname immediately before validation.
 * Because Node.js native `fetch` uses its own internal DNS resolution, there is a small TOCTOU
 * (Time-Of-Check to Time-Of-Use) window where DNS rebinding could still technically occur.
 * True prevention requires pinning the IP at the socket level or using a custom Undici dispatcher,
 * which is a known network-layer limitation documented here.
 */
export class SsrfGuard {
  static async validateUrl(
    targetUrl: string,
    options?: { allowHttpInNonProd?: boolean },
  ): Promise<void> {
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
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname === "[::1]"
    ) {
      throw new ApiError(
        400,
        "Webhook target URL cannot point to local or internal hostnames",
        "SSRF_BLOCKED",
      );
    }

    // Resolve DNS and check all IPs
    let addresses: string[];
    // If target URL is an IPv6 address, parsed.hostname includes brackets like [::1]
    const cleanHostname = hostname.replace(/^\[/, "").replace(/\]$/, "");

    if (net.isIP(cleanHostname)) {
      addresses = [cleanHostname];
    } else {
      try {
        const lookup = await dns.lookup(cleanHostname, { all: true });
        addresses = lookup.map(l => l.address);
      } catch {
        throw new ApiError(400, `Could not resolve hostname: ${cleanHostname}`, "DNS_RESOLUTION_FAILED");
      }
    }

    if (addresses.length === 0) {
      throw new ApiError(400, `Could not resolve hostname: ${cleanHostname}`, "DNS_RESOLUTION_FAILED");
    }

    for (const ip of addresses) {
      if (this.isPrivateOrLoopbackIp(ip)) {
        throw new ApiError(
          400,
          `Webhook target URL points to restricted IP address (${ip})`,
          "SSRF_BLOCKED",
        );
      }
    }
  }

  /**
   * Checks if an IPv4 or IPv6 address belongs to private/loopback/metadata ranges.
   */
  static isPrivateOrLoopbackIp(ip: string): boolean {
    // Exact matches
    if (
      ip === "127.0.0.1" || 
      ip === "::1" || 
      ip === "0.0.0.0" ||
      ip === "::"
    ) {
      return true;
    }

    // Cloud Metadata Endpoint (AWS / GCP / Azure)
    if (ip === "169.254.169.254" || ip.startsWith("169.254.")) {
      return true;
    }

    if (net.isIPv4(ip)) {
      const parts = ip.split(".").map((p) => parseInt(p, 10));

      // 10.0.0.0/8
      if (parts[0] === 10) return true;

      // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

      // 192.168.0.0/16
      if (parts[0] === 192 && parts[1] === 168) return true;

      // 127.0.0.0/8 (Loopback)
      if (parts[0] === 127) return true;

      // 0.0.0.0/8 (Current network)
      if (parts[0] === 0) return true;
      
      // 169.254.0.0/16 (Link-local)
      if (parts[0] === 169 && parts[1] === 254) return true;
      
      // 224.0.0.0/4 (Multicast)
      if (parts[0] >= 224 && parts[0] <= 239) return true;
      
      // 240.0.0.0/4 (Reserved)
      if (parts[0] >= 240 && parts[0] <= 255) return true;
    } else if (net.isIPv6(ip)) {
      // Normalize IPv6 by compressing if needed or just use simple checks
      const lowerIp = ip.toLowerCase();
      
      if (lowerIp === "::1") return true;
      if (lowerIp === "::") return true;
      
      // Link-local (fe80::/10)
      if (lowerIp.startsWith("fe8") || lowerIp.startsWith("fe9") || lowerIp.startsWith("fea") || lowerIp.startsWith("feb")) {
        return true;
      }
      
      // Unique local address (fc00::/7)
      if (lowerIp.startsWith("fc") || lowerIp.startsWith("fd")) {
        return true;
      }
      
      // IPv4-mapped IPv6 (::ffff:0:0/96)
      if (lowerIp.startsWith("::ffff:")) {
        // Block all IPv4-mapped IPv6 addresses as they are often used to bypass filters
        return true;
      }
    }

    return false;
  }
}
