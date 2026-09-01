import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  KeyObject,
  sign as signBytes,
  verify as verifyBytes,
} from "node:crypto";
import { env } from "../config/env.js";
import dns from "node:dns/promises";
import net from "node:net";

export const SIGNATURE_ALGORITHM = "Ed25519";

let ephemeralKeys: { privateKey: KeyObject; publicKey: KeyObject } | undefined;

function keys() {
  if (env.SIGNING_PRIVATE_KEY && env.SIGNING_PUBLIC_KEY) {
    return {
      privateKey: createPrivateKey(env.SIGNING_PRIVATE_KEY),
      publicKey: createPublicKey(env.SIGNING_PUBLIC_KEY),
      keyId: env.SIGNING_KEY_ID,
    } as const;
  }
  if (env.NODE_ENV === "production") {
    throw new Error("Signing keys are required in production");
  }
  ephemeralKeys ??= generateKeyPairSync("ed25519");
  return { ...ephemeralKeys, keyId: "ephemeral-development-key" };
}

export function sha256Bytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function hashArtifactUrl(fileUrl: string): Promise<string> {
  const url = new URL(fileUrl);
  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    throw new Error("Artifact URL must use HTTPS");
  }
  const allowedHosts = env.ARTIFACT_ALLOWED_HOSTS.split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  if (!allowedHosts.includes(url.hostname.toLowerCase())) {
    throw new Error("Artifact host is not allowlisted");
  }

  const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Artifact host resolves to a private or local address");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let response: Response;
  try {
    response = await fetch(url, { redirect: "error", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error("Unable to retrieve artifact bytes");
  const maxBytes = 10 * 1024 * 1024;
  const declaredLength = response.headers.get("content-length");
  if (declaredLength && Number(declaredLength) > maxBytes) {
    throw new Error("Artifact exceeds maximum allowed size");
  }
  if (!response.body) throw new Error("Artifact response has no body");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) throw new Error("Artifact exceeds maximum allowed size");
    chunks.push(value);
  }
  return sha256Bytes(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))));
}

function isPrivateAddress(address: string): boolean {
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168);
  }
  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized === "::" ||
    normalized.startsWith("fc") || normalized.startsWith("fd") ||
    normalized.startsWith("fe8") || normalized.startsWith("fe9") ||
    normalized.startsWith("fea") || normalized.startsWith("feb") ||
    normalized.startsWith("::ffff:127.") || normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.");
}

export function canonicalEvidence(value: unknown): Buffer {
  return Buffer.from(JSON.stringify(value));
}

export function signEvidence(payload: Uint8Array) {
  const key = keys();
  return {
    signature: signBytes(null, payload, key.privateKey).toString("base64"),
    algorithm: SIGNATURE_ALGORITHM,
    keyId: key.keyId,
  };
}

export function verifyEvidence(
  payload: Uint8Array,
  signature: string,
  publicKey = keys().publicKey,
): boolean {
  return verifyBytes(
    null,
    payload,
    publicKey,
    Buffer.from(signature, "base64"),
  );
}

export function hashAuditRecord(record: {
  previousRecordHash: string | null;
  artifactHash: string;
  signerMembershipId: string;
  signoffRole: string;
  action: string;
  createdAt: Date;
  signature: string;
}): string {
  return sha256Bytes(
    canonicalEvidence({
      previousRecordHash: record.previousRecordHash,
      artifactHash: record.artifactHash,
      signerMembershipId: record.signerMembershipId,
      signoffRole: record.signoffRole,
      action: record.action,
      signature: record.signature,
      createdAt: record.createdAt.toISOString(),
    }),
  );
}

export function verifyAuditChain(
  records: Array<{
    previousRecordHash: string | null;
    artifactHash: string;
    signerMembershipId: string;
    signoffRole: string;
    action: string;
    createdAt: Date | string;
    signature: string;
    recordHash: string;
  }>,
): boolean {
  let previous: string | null = null;
  for (const record of records) {
    if (record.previousRecordHash !== previous) return false;
    const createdAt =
      record.createdAt instanceof Date
        ? record.createdAt
        : new Date(record.createdAt);
    if (hashAuditRecord({ ...record, createdAt }) !== record.recordHash)
      return false;
    if (
      !verifyEvidence(
        canonicalEvidence({
          artifactHash: record.artifactHash,
          signerMembershipId: record.signerMembershipId,
          signoffRole: record.signoffRole,
          action: record.action,
          createdAt: createdAt.toISOString(),
        }),
        record.signature,
      )
    )
      return false;
    previous = record.recordHash;
  }
  return true;
}

export function verifyCertificateEvidence(certificate: {
  status: string;
  signature: string;
  artifactHash: string;
  signerMembershipId: string;
  signoffRole: string;
  signedAt: Date | string;
}): boolean {
  if (certificate.status !== "issued") return false;
  const signedAt =
    certificate.signedAt instanceof Date
      ? certificate.signedAt
      : new Date(certificate.signedAt);
  return verifyEvidence(
    canonicalEvidence({
      artifactHash: certificate.artifactHash,
      signerMembershipId: certificate.signerMembershipId,
      signoffRole: certificate.signoffRole,
      action: "issued",
      createdAt: signedAt.toISOString(),
    }),
    certificate.signature,
  );
}
