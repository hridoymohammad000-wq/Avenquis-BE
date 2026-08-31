import { describe, expect, it } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import {
  canonicalEvidence,
  hashAuditRecord,
  sha256Bytes,
  signEvidence,
  verifyAuditChain,
  verifyEvidence,
} from "../services/crypto-evidence.service.js";

describe("cryptographic audit evidence", () => {
  it("changes the SHA-256 hash when artifact bytes change", () => {
    expect(sha256Bytes(Buffer.from("file-v1"))).not.toBe(sha256Bytes(Buffer.from("file-v2")));
  });

  it("rejects tampered payloads and the wrong public key", () => {
    const payload = canonicalEvidence({ artifactHash: "a", action: "approved" });
    const signed = signEvidence(payload);
    const wrongKey = generateKeyPairSync("ed25519").publicKey;
    expect(verifyEvidence(payload, signed.signature)).toBe(true);
    expect(verifyEvidence(canonicalEvidence({ artifactHash: "tampered", action: "approved" }), signed.signature)).toBe(false);
    expect(verifyEvidence(payload, signed.signature, wrongKey)).toBe(false);
  });

  it("detects a broken audit hash chain", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const signed = signEvidence(canonicalEvidence({
      artifactHash: "a",
      signerMembershipId: "m",
      signoffRole: "reviewer",
      action: "approve",
      createdAt: createdAt.toISOString(),
    }));
    const record = {
      previousRecordHash: null,
      artifactHash: "a",
      signerMembershipId: "m",
      signoffRole: "reviewer",
      action: "approve",
      createdAt,
      signature: signed.signature,
      recordHash: "",
    };
    record.recordHash = hashAuditRecord(record);
    expect(verifyAuditChain([record])).toBe(true);
    expect(verifyAuditChain([{ ...record, artifactHash: "tampered" }])).toBe(false);
  });
});
