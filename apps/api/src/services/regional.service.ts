import {
  db,
  globalCountries,
  tenantRegionalSettings,
  eq,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class RegionalService {
  static async getGlobalCountries() {
    return db
      .select()
      .from(globalCountries)
      .where(eq(globalCountries.isActive, true))
      .orderBy(globalCountries.name);
  }

  static async getTenantRegionalSettings(tenantId: string) {
    const [settings] = await db
      .select()
      .from(tenantRegionalSettings)
      .where(eq(tenantRegionalSettings.tenantId, tenantId));

    return settings || null;
  }

  static async setTenantRegionalSettings(
    tenantId: string,
    data: {
      countryCode: string;
      currencyCode: string;
      timezone?: string;
      dateFormat?: string;
      financialYearStartMonth?: number;
    },
  ) {
    // Verify country exists
    const [country] = await db
      .select()
      .from(globalCountries)
      .where(eq(globalCountries.code, data.countryCode));

    if (!country || !country.isActive) {
      throw new ApiError(400, "Invalid country code", "INVALID_COUNTRY_CODE");
    }

    const [existing] = await db
      .select()
      .from(tenantRegionalSettings)
      .where(eq(tenantRegionalSettings.tenantId, tenantId));

    if (existing) {
      const [updated] = await db
        .update(tenantRegionalSettings)
        .set({
          countryCode: data.countryCode,
          currencyCode: data.currencyCode,
          timezone: data.timezone || existing.timezone,
          dateFormat: data.dateFormat || existing.dateFormat,
          financialYearStartMonth:
            data.financialYearStartMonth || existing.financialYearStartMonth,
        })
        .where(eq(tenantRegionalSettings.tenantId, tenantId))
        .returning();
      return updated;
    } else {
      const [inserted] = await db
        .insert(tenantRegionalSettings)
        .values({
          tenantId,
          countryCode: data.countryCode,
          currencyCode: data.currencyCode,
          timezone: data.timezone || "UTC",
          dateFormat: data.dateFormat || "YYYY-MM-DD",
          financialYearStartMonth: data.financialYearStartMonth || 1,
        })
        .returning();
      return inserted;
    }
  }
}
