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
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Artifact URL must use HTTPS");
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error("Unable to retrieve artifact bytes");
  return sha256Bytes(new Uint8Array(await response.arrayBuffer()));
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
