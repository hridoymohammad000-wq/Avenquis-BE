import { describe, it, expect, vi, beforeEach } from "vitest";
import { SsrfGuard } from "../ssrf-guard.js";
import dns from "dns/promises";

vi.mock("dns/promises");

describe("Phase 31 - SSRF Guard Security Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("IP Address Blocking", () => {
    const blockedIps = [
      "127.0.0.1",
      "127.12.34.56",
      "10.0.0.1",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254",
      "0.0.0.0",
      "0.1.2.3",
      "224.0.0.1", // multicast
      "240.0.0.1", // reserved
      "::1",
      "fc00::1",
      "fe80::1",
      "::ffff:127.0.0.1", // IPv4-mapped loopback
      "::ffff:10.0.0.1", // IPv4-mapped private
    ];

    blockedIps.forEach((ip) => {
      it(`should block private/restricted IP: ${ip}`, async () => {
        // Enclose IPv6 in brackets for URL constructor if needed
        const urlStr = ip.includes(":") ? `http://[${ip}]` : `http://${ip}`;
        await expect(SsrfGuard.validateUrl(urlStr, { allowHttpInNonProd: true }))
          .rejects.toThrow(/(restricted IP address|cannot point to local)/);
      });
    });
    
    it("should allow safe public IPs", async () => {
      const safeIps = ["8.8.8.8", "1.1.1.1", "142.250.190.46"];
      for (const ip of safeIps) {
        await expect(SsrfGuard.validateUrl(`http://${ip}`, { allowHttpInNonProd: true })).resolves.toBeUndefined();
      }
    });
  });

  describe("DNS Resolution Blocking", () => {
    it("should block hostname resolving to private IPv4", async () => {
      // @ts-expect-error Overload mismatch for dns.lookup with all: true option
      vi.mocked(dns.lookup).mockResolvedValue([{ address: "10.0.0.1", family: 4 }]);
      
      await expect(SsrfGuard.validateUrl("http://evil-private.local.dev", { allowHttpInNonProd: true }))
        .rejects.toThrow(/restricted IP address/);
    });

    it("should block hostname resolving to private IPv6", async () => {
      // @ts-expect-error Overload mismatch for dns.lookup with all: true option
      vi.mocked(dns.lookup).mockResolvedValue([{ address: "::1", family: 6 }]);
      
      await expect(SsrfGuard.validateUrl("http://evil-ipv6.local.dev", { allowHttpInNonProd: true }))
        .rejects.toThrow(/restricted IP address/);
    });

    it("should block if ANY resolved answer is private", async () => {
      // @ts-expect-error Overload mismatch for dns.lookup with all: true option
      vi.mocked(dns.lookup).mockResolvedValue([
        { address: "8.8.8.8", family: 4 },
        { address: "192.168.1.1", family: 4 }, // private!
      ]);
      
      await expect(SsrfGuard.validateUrl("http://rebinding.local.dev", { allowHttpInNonProd: true }))
        .rejects.toThrow(/restricted IP address/);
    });

    it("should allow if all resolved answers are public", async () => {
      // @ts-expect-error Overload mismatch for dns.lookup with all: true option
      vi.mocked(dns.lookup).mockResolvedValue([
        { address: "8.8.8.8", family: 4 },
        { address: "1.1.1.1", family: 4 },
      ]);
      
      await expect(SsrfGuard.validateUrl("http://good-domain.com", { allowHttpInNonProd: true }))
        .resolves.toBeUndefined();
    });

    it("should reject if DNS resolution fails completely", async () => {
      vi.mocked(dns.lookup).mockRejectedValue(new Error("ENOTFOUND"));
      
      await expect(SsrfGuard.validateUrl("http://non-existent-domain.com", { allowHttpInNonProd: true }))
        .rejects.toThrow(/Could not resolve hostname/);
    });
  });

  describe("Protocol & Scheme Validations", () => {
    it("should block non-HTTP/HTTPS schemes", async () => {
      await expect(SsrfGuard.validateUrl("ftp://142.250.190.46", { allowHttpInNonProd: true }))
        .rejects.toThrow(/HTTPS protocol/);
        
      await expect(SsrfGuard.validateUrl("file:///etc/passwd", { allowHttpInNonProd: true }))
        .rejects.toThrow(/HTTPS protocol/);
    });

    it("should block HTTP in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      
      try {
        await expect(SsrfGuard.validateUrl("http://8.8.8.8"))
          .rejects.toThrow(/must use HTTPS protocol in production/);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe("Literal Hostname Blocking", () => {
    it("should block localhost and .local", async () => {
      await expect(SsrfGuard.validateUrl("http://localhost", { allowHttpInNonProd: true }))
        .rejects.toThrow(/cannot point to local or internal hostnames/);
        
      await expect(SsrfGuard.validateUrl("http://app.local", { allowHttpInNonProd: true }))
        .rejects.toThrow(/cannot point to local or internal hostnames/);
    });
  });
});
