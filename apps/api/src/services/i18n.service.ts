import { db, supportedLocales, tenantLocales, eq } from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class I18nService {
  static async getSupportedLocales() {
    return db
      .select()
      .from(supportedLocales)
      .where(eq(supportedLocales.isActive, true));
  }

  static async getTenantLocales(tenantId: string) {
    return db
      .select({
        id: tenantLocales.id,
        tenantId: tenantLocales.tenantId,
        localeCode: tenantLocales.localeCode,
        isDefault: tenantLocales.isDefault,
        name: supportedLocales.name,
        nativeName: supportedLocales.nativeName,
        isRtl: supportedLocales.isRtl,
      })
      .from(tenantLocales)
      .innerJoin(
        supportedLocales,
        eq(tenantLocales.localeCode, supportedLocales.code),
      )
      .where(eq(tenantLocales.tenantId, tenantId));
  }

  static async setTenantLocale(
    tenantId: string,
    localeCode: string,
    isDefault: boolean = false,
  ) {
    // Check if locale exists
    const [locale] = await db
      .select()
      .from(supportedLocales)
      .where(eq(supportedLocales.code, localeCode));

    if (!locale || !locale.isActive) {
      throw new ApiError(400, "Locale not supported", "LOCALE_NOT_SUPPORTED");
    }

    // If this is set as default, we should unset others
    if (isDefault) {
      await db
        .update(tenantLocales)
        .set({ isDefault: false })
        .where(eq(tenantLocales.tenantId, tenantId));
    }

    // Upsert tenant locale (if we had a unique constraint, we could use onConflictDoUpdate)
    const match = await db
      .select()
      .from(tenantLocales)
      .where(eq(tenantLocales.localeCode, localeCode));

    const exactMatch = match.find((m) => m.tenantId === tenantId);

    if (exactMatch) {
      const [updated] = await db
        .update(tenantLocales)
        .set({ isDefault })
        .where(eq(tenantLocales.id, exactMatch.id))
        .returning();
      return updated;
    }

    const [inserted] = await db
      .insert(tenantLocales)
      .values({
        tenantId,
        localeCode,
        isDefault,
      })
      .returning();

    return inserted;
  }
}
