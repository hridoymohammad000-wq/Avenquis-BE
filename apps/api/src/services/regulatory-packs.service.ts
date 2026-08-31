import {
  db,
  globalRegulatoryBodies,
  regulatoryRulePacks,
  tenantRegulatoryPacks,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class RegulatoryPacksService {
  static async getAvailablePacks(countryCode?: string) {
    let query = db
      .select({
        packId: regulatoryRulePacks.id,
        packName: regulatoryRulePacks.name,
        version: regulatoryRulePacks.version,
        description: regulatoryRulePacks.description,
        bodyName: globalRegulatoryBodies.name,
        bodyCode: globalRegulatoryBodies.code,
        countryCode: globalRegulatoryBodies.countryCode,
      })
      .from(regulatoryRulePacks)
      .innerJoin(
        globalRegulatoryBodies,
        eq(regulatoryRulePacks.bodyId, globalRegulatoryBodies.id)
      )
      .where(eq(regulatoryRulePacks.isActive, true));

    return await query;
  }

  static async getTenantPacks(tenantId: string) {
    return db
      .select({
        id: tenantRegulatoryPacks.id,
        tenantId: tenantRegulatoryPacks.tenantId,
        packId: tenantRegulatoryPacks.packId,
        isActive: tenantRegulatoryPacks.isActive,
        activatedAt: tenantRegulatoryPacks.activatedAt,
        packName: regulatoryRulePacks.name,
        version: regulatoryRulePacks.version,
        bodyCode: globalRegulatoryBodies.code,
      })
      .from(tenantRegulatoryPacks)
      .innerJoin(
        regulatoryRulePacks,
        eq(tenantRegulatoryPacks.packId, regulatoryRulePacks.id)
      )
      .innerJoin(
        globalRegulatoryBodies,
        eq(regulatoryRulePacks.bodyId, globalRegulatoryBodies.id)
      )
      .where(eq(tenantRegulatoryPacks.tenantId, tenantId));
  }

  static async activatePackForTenant(tenantId: string, packId: string) {
    // Verify pack exists and is active
    const [pack] = await db
      .select()
      .from(regulatoryRulePacks)
      .where(eq(regulatoryRulePacks.id, packId));

    if (!pack || !pack.isActive) {
      throw new ApiError(400, "Regulatory pack not found or inactive", "PACK_NOT_FOUND");
    }

    // Check if already activated
    const [existing] = await db
      .select()
      .from(tenantRegulatoryPacks)
      .where(
        and(
          eq(tenantRegulatoryPacks.tenantId, tenantId),
          eq(tenantRegulatoryPacks.packId, packId)
        )
      );

    if (existing) {
      if (!existing.isActive) {
        // Reactivate
        const [updated] = await db
          .update(tenantRegulatoryPacks)
          .set({ isActive: true })
          .where(eq(tenantRegulatoryPacks.id, existing.id))
          .returning();
        return updated;
      }
      return existing; // Already active
    }

    const [activated] = await db
      .insert(tenantRegulatoryPacks)
      .values({
        tenantId,
        packId,
        isActive: true,
      })
      .returning();

    return activated;
  }
}
