import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticator } from "otplib";
import crypto from "crypto";
import { and, db, revokedAuthTokens, eq, gt } from "@avenquis/database";
import { env } from "../config/env.js";

export interface TokenPayload {
  userId: string;
  email: string;
  aal: "aal1" | "aal2";
}

export class AuthService {
  private static tokenHash(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateTokens(payload: TokenPayload) {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
    const refreshToken = jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
    return { accessToken, refreshToken };
  }

  static async verifyAccessToken(token: string): Promise<TokenPayload> {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    const revoked = await db.query.revokedAuthTokens.findFirst({
      where: and(eq(revokedAuthTokens.tokenHash, this.tokenHash(token)), gt(revokedAuthTokens.expiresAt, new Date())),
    });
    if (revoked) throw new Error("Token revoked");
    return payload;
  }

  static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as TokenPayload;
  }

  static generateMfaSecret(email: string): {
    secret: string;
    otpauthUrl: string;
  } {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, "Avenquis OS", secret);
    return { secret, otpauthUrl };
  }

  static encryptMfaSecret(secret: string): string {
    const iv = crypto.randomBytes(12);
    const key = crypto.createHash("sha256").update(env.MFA_ENCRYPTION_KEY).digest();
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
    return `v1:${iv.toString("base64url")}:${cipher.getAuthTag().toString("base64url")}:${ciphertext.toString("base64url")}`;
  }

  static decryptMfaSecret(value: string): string {
    if (!value.startsWith("v1:")) throw new Error("Unencrypted MFA secret rejected");
    const [, iv, tag, ciphertext] = value.split(":");
    const key = crypto.createHash("sha256").update(env.MFA_ENCRYPTION_KEY).digest();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  }

  static async hashBackupCode(code: string): Promise<string> {
    return bcrypt.hash(code, 12);
  }

  static async verifyBackupCode(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
  }

  static async revokeToken(token: string): Promise<void> {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded?.exp) return;
    await db.insert(revokedAuthTokens).values({
      tokenHash: this.tokenHash(token),
      expiresAt: new Date(decoded.exp * 1000),
    }).onConflictDoNothing();
  }

  static verifyMfaToken(token: string, secret: string): boolean {
    return authenticator.check(token, secret);
  }

  static generateBackupCodes(count = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
    }
    return codes;
  }
}
