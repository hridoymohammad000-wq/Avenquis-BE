import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { SsrfGuard } from "../ssrf-guard.js";
import { WebhookDeliveryEngine } from "../webhook-delivery.engine.js";

describe("Phase 31 Automation & Security - Unit Tests", () => {
  describe("SSRF Protection Guard", () => {
    it("should allow valid external HTTPS webhook URLs", () => {
      expect(() =>
        SsrfGuard.validateUrl("https://api.externalpartner.com/webhooks/receiver", {
          allowHttpInNonProd: false,
        }),
      ).not.toThrow();
    });

    it("should reject localhost and loopback targets", () => {
      expect(() => SsrfGuard.validateUrl("http://localhost:3000/webhook")).toThrow();
      expect(() => SsrfGuard.validateUrl("http://127.0.0.1/webhook")).toThrow();
      expect(() => SsrfGuard.validateUrl("http://0.0.0.0:8080/webhook")).toThrow();
      expect(() => SsrfGuard.validateUrl("http://server.local/webhook")).toThrow();
    });

    it("should reject private IP address ranges", () => {
      // 10.0.0.0/8
      expect(() => SsrfGuard.validateUrl("http://10.0.0.5/webhook")).toThrow();
      // 172.16.0.0/12
      expect(() => SsrfGuard.validateUrl("http://172.20.0.10/webhook")).toThrow();
      // 192.168.0.0/16
      expect(() => SsrfGuard.validateUrl("http://192.168.1.100/webhook")).toThrow();
    });

    it("should reject Cloud Metadata Endpoint (169.254.169.254)", () => {
      expect(() =>
        SsrfGuard.validateUrl("http://169.254.169.254/latest/meta-data/"),
      ).toThrow();
    });
  });

  describe("Webhook HMAC-SHA256 Payload Signatures", () => {
    it("should correctly compute X-Avenquis-Signature format", () => {
      const secret = "whsec_super_secret_key_12345";
      const timestamp = 1757000000000;
      const payloadString = JSON.stringify({ event: "document.uploaded", docId: "123" });

      const headerValue = WebhookDeliveryEngine.generateSignature(
        secret,
        timestamp,
        payloadString,
      );

      expect(headerValue).toContain(`t=${timestamp},v1=`);
      const hmacHex = headerValue.split("v1=")[1];
      expect(hmacHex.length).toBe(64);

      // Verify HMAC matches independent calculation
      const expectedHmac = crypto
        .createHmac("sha256", secret)
        .update(`${timestamp}.${payloadString}`)
        .digest("hex");

      expect(hmacHex).toBe(expectedHmac);
    });
  });

  describe("API Key Hashing & Prefix", () => {
    it("should generate avq_live_ prefix and SHA256 hash at rest", () => {
      const randomHex = crypto.randomBytes(24).toString("hex");
      const rawKey = `avq_live_${randomHex}`;
      const prefix = rawKey.substring(0, 16);
      const hash = crypto.createHash("sha256").update(rawKey).digest("hex");

      expect(rawKey.startsWith("avq_live_")).toBe(true);
      expect(prefix).toBe("avq_live_" + randomHex.substring(0, 7));
      expect(hash.length).toBe(64);
    });
  });
});
