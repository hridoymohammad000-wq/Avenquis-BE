import crypto from "crypto";
import { env } from "../config/env.js";

export class SecretService {
  private static getKey(): Buffer {
    const rawKey = env.MFA_ENCRYPTION_KEY || "default_avenquis_secret_key_32_bytes!!";
    return crypto.createHash("sha256").update(rawKey).digest();
  }

  static encryptSecret(plainText: string): string {
    if (!plainText) return plainText;
    // Prevent double encryption
    if (plainText.startsWith("enc_v1:")) return plainText;

    const iv = crypto.randomBytes(12);
    const key = this.getKey();
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plainText, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    const encryptedBase64 = Buffer.concat([iv, tag, ciphertext]).toString(
      "base64",
    );
    return `enc_v1:${encryptedBase64}`;
  }

  static decryptSecret(cipherText: string): string {
    if (!cipherText || !cipherText.startsWith("enc_v1:")) return cipherText;

    const raw = cipherText.replace("enc_v1:", "");
    const buffer = Buffer.from(raw, "base64");
    const iv = buffer.subarray(0, 12);
    const tag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);

    const key = this.getKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  }
}
