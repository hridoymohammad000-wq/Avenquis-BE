import { db, apiKeys, eq, and, desc } from "@avenquis/database";
import crypto from "crypto";
import { ApiError } from "../errors/api-error.js";

export class ApiKeyService {
  /**
   * Create a new tenant API key. The raw API key is returned ONLY ONCE upon creation.
   */
  static async createApiKey(
    tenantId: string,
    data: {
      name: string;
      scopes: string[];
      expiresInDays?: number;
      createdByMembershipId?: string;
    },
  ) {
    const randomHex = crypto.randomBytes(24).toString("hex");
    const rawKey = `avq_live_${randomHex}`;
    const keyPrefix = rawKey.substring(0, 16);
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const [keyRecord] = await db
      .insert(apiKeys)
      .values({
        tenantId,
        name: data.name,
        keyHash,
        keyPrefix,
        scopes: data.scopes,
        status: "active",
        expiresAt,
        createdByMembershipId: data.createdByMembershipId,
      })
      .returning();

    const safeRecord = { ...keyRecord } as Record<string, unknown>;
    delete safeRecord.keyHash;

    return {
      apiKey: safeRecord,
      rawKey,
    };
  }

  /**
   * Validate an incoming raw API key.
   */
  static async validateApiKey(rawKey: string) {
    if (!rawKey || !rawKey.startsWith("avq_")) {
      throw new ApiError(401, "Invalid API key format", "INVALID_API_KEY");
    }

    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const [keyRecord] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash));

    if (!keyRecord || keyRecord.status !== "active") {
      throw new ApiError(401, "API key is invalid or revoked", "UNAUTHORIZED_KEY");
    }

    if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
      await db
        .update(apiKeys)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(apiKeys.id, keyRecord.id));

      throw new ApiError(401, "API key has expired", "EXPIRED_API_KEY");
    }

    // Touch lastUsedAt asynchronously
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, keyRecord.id));

    return {
      tenantId: keyRecord.tenantId,
      scopes: keyRecord.scopes as string[],
      keyId: keyRecord.id,
      name: keyRecord.name,
    };
  }

  /**
   * Revoke an API key.
   */
  static async revokeApiKey(tenantId: string, apiKeyId: string) {
    const [revoked] = await db
      .update(apiKeys)
      .set({
        status: "revoked",
        updatedAt: new Date(),
      })
      .where(and(eq(apiKeys.tenantId, tenantId), eq(apiKeys.id, apiKeyId)))
      .returning();

    if (!revoked) {
      throw new ApiError(404, "API key not found", "NOT_FOUND");
    }

    const safeRecord = { ...revoked } as Record<string, unknown>;
    delete safeRecord.keyHash;
    return safeRecord;
  }

  /**
   * List API keys for a tenant.
   */
  static async getApiKeys(tenantId: string) {
    const records = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.tenantId, tenantId))
      .orderBy(desc(apiKeys.createdAt));

    return records.map((r) => {
      const copy = { ...r } as Record<string, unknown>;
      delete copy.keyHash;
      return copy;
    });
  }
}
