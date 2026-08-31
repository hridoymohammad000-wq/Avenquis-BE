import { createHash, randomBytes } from "crypto";
import {
  db,
  digitalCertificates,
  signoffAuditLogs,
  engagements,
  clients,
  memberships,
  userProfiles,
  eq,
  and,
  desc,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class CertificateService {
  static async signoffEngagement(
    tenantId: string,
    engagementId: string,
    signerMembershipId: string,
    data: {
      signoffRole:
        "audit_senior" | "engagement_manager" | "eqcr_partner" | "lead_partner";
      action: "approved" | "rejected" | "signed_and_sealed";
      comments?: string;
    },
  ) {
    const engagement = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.tenantId, tenantId),
        eq(engagements.id, engagementId),
      ),
    });

    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }

    const payload = `${tenantId}:${engagementId}:${signerMembershipId}:${data.signoffRole}:${data.action}:${Date.now()}`;
    const signedHash = createHash("sha256").update(payload).digest("hex");

    const [log] = await db
      .insert(signoffAuditLogs)
      .values({
        tenantId,
        engagementId,
        signerMembershipId,
        signoffRole: data.signoffRole,
        action: data.action,
        comments: data.comments,
        signedHash,
      })
      .returning();

    // If Lead Partner approves/signs, update engagement status to completed
    if (data.signoffRole === "lead_partner" && data.action === "approved") {
      await db
        .update(engagements)
        .set({
          status: "completed",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(engagements.tenantId, tenantId),
            eq(engagements.id, engagementId),
          ),
        );
    }

    return log;
  }

  static async issueCertificate(
    tenantId: string,
    data: {
      engagementId: string;
      certificateNumber: string;
      certificateType: string;
      title: string;
      auditOpinion: "unmodified" | "qualified" | "adverse" | "disclaimer";
      summaryOpinionText: string;
      signedByMembershipId: string;
    },
  ) {
    const engagement = await db.query.engagements.findFirst({
      where: and(
        eq(engagements.tenantId, tenantId),
        eq(engagements.id, data.engagementId),
      ),
    });

    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }

    // Verify unique certificate number per tenant
    const existing = await db.query.digitalCertificates.findFirst({
      where: and(
        eq(digitalCertificates.tenantId, tenantId),
        eq(digitalCertificates.certificateNumber, data.certificateNumber),
      ),
    });

    if (existing) {
      throw new ApiError(
        409,
        `Certificate number '${data.certificateNumber}' already exists in this tenant`,
        "CERTIFICATE_NUMBER_EXISTS",
      );
    }

    const signedAt = new Date();
    const verificationToken = `AVQ-CERT-${randomBytes(16).toString("hex")}`;
    const rawSealPayload = `${tenantId}:${engagement.id}:${data.certificateNumber}:${data.auditOpinion}:${signedAt.toISOString()}:${data.signedByMembershipId}`;
    const digitalSealHash = createHash("sha256")
      .update(rawSealPayload)
      .digest("hex");

    const [certificate] = await db
      .insert(digitalCertificates)
      .values({
        tenantId,
        engagementId: data.engagementId,
        certificateNumber: data.certificateNumber,
        certificateType: data.certificateType,
        title: data.title,
        auditOpinion: data.auditOpinion,
        summaryOpinionText: data.summaryOpinionText,
        digitalSealHash,
        signedByMembershipId: data.signedByMembershipId,
        signedAt,
        verificationToken,
        status: "issued",
      })
      .returning();

    return certificate;
  }

  static async getCertificateById(tenantId: string, certificateId: string) {
    const cert = await db.query.digitalCertificates.findFirst({
      where: and(
        eq(digitalCertificates.tenantId, tenantId),
        eq(digitalCertificates.id, certificateId),
      ),
    });

    if (!cert) {
      throw new ApiError(404, "Certificate not found", "CERTIFICATE_NOT_FOUND");
    }

    // Fetch engagement & client summary
    const engagement = await db.query.engagements.findFirst({
      where: eq(engagements.id, cert.engagementId),
    });

    const client = engagement
      ? await db.query.clients.findFirst({
          where: eq(clients.id, engagement.clientId),
        })
      : null;

    // Fetch signer details
    const [signer] = await db
      .select({
        membershipId: memberships.id,
        fullName: userProfiles.fullName,
        email: userProfiles.email,
      })
      .from(memberships)
      .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
      .where(eq(memberships.id, cert.signedByMembershipId));

    // Fetch audit sign-off logs
    const auditLogs = await db
      .select()
      .from(signoffAuditLogs)
      .where(
        and(
          eq(signoffAuditLogs.tenantId, tenantId),
          eq(signoffAuditLogs.engagementId, cert.engagementId),
        ),
      )
      .orderBy(desc(signoffAuditLogs.createdAt));

    return {
      ...cert,
      engagementTitle: engagement?.title,
      clientName: client?.name,
      signer: signer ?? null,
      auditLogs,
    };
  }

  static async verifyCertificatePublic(verificationToken: string) {
    const cert = await db.query.digitalCertificates.findFirst({
      where: eq(digitalCertificates.verificationToken, verificationToken),
    });

    if (!cert) {
      throw new ApiError(
        404,
        "Invalid or expired certificate verification token",
        "INVALID_VERIFICATION_TOKEN",
      );
    }

    const engagement = await db.query.engagements.findFirst({
      where: eq(engagements.id, cert.engagementId),
    });

    const client = engagement
      ? await db.query.clients.findFirst({
          where: eq(clients.id, engagement.clientId),
        })
      : null;

    const [signer] = await db
      .select({
        fullName: userProfiles.fullName,
      })
      .from(memberships)
      .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
      .where(eq(memberships.id, cert.signedByMembershipId));

    return {
      verified: cert.status === "issued",
      status: cert.status,
      certificateNumber: cert.certificateNumber,
      certificateType: cert.certificateType,
      title: cert.title,
      auditOpinion: cert.auditOpinion,
      summaryOpinionText: cert.summaryOpinionText,
      digitalSealHash: cert.digitalSealHash,
      signedAt: cert.signedAt,
      signedBy: signer?.fullName ?? "Authorized Partner",
      clientName: client?.name ?? "N/A",
      financialYear: engagement?.financialYear ?? "N/A",
      revocationReason: cert.revocationReason ?? undefined,
    };
  }

  static async revokeCertificate(
    tenantId: string,
    certificateId: string,
    reason: string,
  ) {
    const cert = await db.query.digitalCertificates.findFirst({
      where: and(
        eq(digitalCertificates.tenantId, tenantId),
        eq(digitalCertificates.id, certificateId),
      ),
    });

    if (!cert) {
      throw new ApiError(404, "Certificate not found", "CERTIFICATE_NOT_FOUND");
    }

    const [updated] = await db
      .update(digitalCertificates)
      .set({
        status: "revoked",
        revokedAt: new Date(),
        revocationReason: reason,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(digitalCertificates.tenantId, tenantId),
          eq(digitalCertificates.id, certificateId),
        ),
      )
      .returning();

    return updated;
  }
}
