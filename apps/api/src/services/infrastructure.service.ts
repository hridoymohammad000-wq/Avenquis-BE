import {
  db,
  dedicatedTenantConfigs,
  saasReadinessSignoffs,
  eq,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class InfrastructureService {
  static async getTenantConfig(tenantId: string) {
    const [config] = await db
      .select()
      .from(dedicatedTenantConfigs)
      .where(eq(dedicatedTenantConfigs.tenantId, tenantId));
    return config || null;
  }

  static async configureDedicatedTenant(
    tenantId: string,
    data: {
      databaseUrlSecret: string;
      storageBucketName: string;
      kmsKeyId?: string;
    }
  ) {
    const [existing] = await db
      .select()
      .from(dedicatedTenantConfigs)
      .where(eq(dedicatedTenantConfigs.tenantId, tenantId));

    if (existing) {
      const [updated] = await db
        .update(dedicatedTenantConfigs)
        .set({
          ...data,
          isProvisioned: true,
          provisionedAt: new Date(),
        })
        .where(eq(dedicatedTenantConfigs.id, existing.id))
        .returning();
      return updated;
    }

    const [inserted] = await db
      .insert(dedicatedTenantConfigs)
      .values({
        tenantId,
        ...data,
        isProvisioned: true,
        provisionedAt: new Date(),
      })
      .returning();

    return inserted;
  }

  // PLATFORM LEVEL: Final QA Sign-offs
  static async getReadinessSignoffs() {
    return db.select().from(saasReadinessSignoffs);
  }

  static async addSignoff(
    moduleName: string,
    status: string,
    userId: string,
    notes?: string
  ) {
    const [signoff] = await db
      .insert(saasReadinessSignoffs)
      .values({
        moduleName,
        status,
        approvedBy: userId,
        notes,
        approvedAt: status === 'APPROVED' ? new Date() : null,
      })
      .returning();
    return signoff;
  }
}
