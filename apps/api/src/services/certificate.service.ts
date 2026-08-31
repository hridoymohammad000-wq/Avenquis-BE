import { createHash, randomBytes } from "crypto";
import {
  db,
  digitalCertificates,
  signoffAuditLogs,
  engagements,
  clients,
  memberships,
  engagementTeamMembers,
  workingPapers,
  reviewNotes,
  count,
  ne,
  userProfiles,
  eq,
  and,
  desc,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";
import {
  canonicalEvidence,
  hashArtifactUrl,
  hashAuditRecord,
  sha256Bytes,
  signEvidence,
  verifyCertificateEvidence,
} from "./crypto-evidence.service.js";

export function deriveEngagementSignoffRole(
  requestedRole: "audit_senior" | "engagement_manager" | "eqcr_partner" | "lead_partner",
  assignedTeamRole: string | undefined,
  engagementAssignmentMembershipId: string | null | undefined,
  signerMembershipId: string,
) {
  const requiredTeamRole: Record<string, string> = {
    lead_partner: "lead_partner",
    engagement_manager: "engagement_manager",
    eqcr_partner: "eqcr_partner",
    audit_senior: "senior_auditor",
  };
  if (assignedTeamRole === requiredTeamRole[requestedRole]) return requestedRole;
  if (engagementAssignmentMembershipId === signerMembershipId) return requestedRole;
  return null;
}

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
    return db.transaction(async (tx) => {
      const engagement = await tx.query.engagements.findFirst({
        where: and(eq(engagements.tenantId, tenantId), eq(engagements.id, engagementId)),
      });
      if (!engagement) throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
      const assignment = await tx.query.engagementTeamMembers.findFirst({
        where: and(
          eq(engagementTeamMembers.tenantId, tenantId),
          eq(engagementTeamMembers.engagementId, engagementId),
          eq(engagementTeamMembers.membershipId, signerMembershipId),
        ),
      });
      const assignmentMembershipId = data.signoffRole === "lead_partner"
        ? engagement.engagementPartnerMembershipId
        : data.signoffRole === "engagement_manager"
          ? engagement.engagementManagerMembershipId
          : data.signoffRole === "eqcr_partner"
            ? engagement.auditQualityReviewerMembershipId
            : null;
      const assignedRole = deriveEngagementSignoffRole(data.signoffRole, assignment?.role, assignmentMembershipId, signerMembershipId);
      if (!assignedRole) throw new ApiError(403, "Signer is not assigned to this engagement for the requested role", "SIGNOFF_ROLE_NOT_AUTHORIZED");
      const [openNotes] = await tx.select({ total: count() })
        .from(reviewNotes)
        .innerJoin(workingPapers, eq(reviewNotes.workingPaperId, workingPapers.id))
        .where(and(
          eq(reviewNotes.tenantId, tenantId),
          eq(workingPapers.tenantId, tenantId),
          eq(workingPapers.engagementId, engagementId),
          ne(reviewNotes.status, "cleared"),
        ));
      if (data.action === "approved" && Number(openNotes.total) > 0) {
        throw new ApiError(409, "Unresolved review notes block sign-off", "UNRESOLVED_REVIEW_NOTES");
      }
      const artifacts = await tx.select({ fileUrl: workingPapers.fileUrl })
        .from(workingPapers)
        .where(and(
          eq(workingPapers.tenantId, tenantId),
          eq(workingPapers.engagementId, engagementId),
        ));
      if (artifacts.length === 0 || artifacts.some((artifact) => !artifact.fileUrl)) {
        throw new ApiError(409, "All working papers must have retrievable file artifacts before sign-off", "ARTIFACT_REQUIRED");
      }
      const artifactHashes = await Promise.all(artifacts.map((artifact) => hashArtifactUrl(artifact.fileUrl!)));
      const artifactHash = sha256Bytes(canonicalEvidence(artifactHashes));
      const createdAt = new Date();
      const signaturePayload = canonicalEvidence({
        artifactHash,
        signerMembershipId,
        signoffRole: assignedRole,
        action: data.action,
        createdAt: createdAt.toISOString(),
      });
      const evidenceSignature = signEvidence(signaturePayload);
      const previous = await tx.query.signoffAuditLogs.findFirst({
        where: and(eq(signoffAuditLogs.tenantId, tenantId), eq(signoffAuditLogs.engagementId, engagementId)),
        orderBy: [desc(signoffAuditLogs.createdAt)],
      });
      const previousRecordHash = previous?.recordHash ?? null;
      const recordHash = hashAuditRecord({
        previousRecordHash,
        artifactHash,
        signerMembershipId,
        signoffRole: assignedRole,
        action: data.action,
        createdAt,
        signature: evidenceSignature.signature,
      });
      const [log] = await tx.insert(signoffAuditLogs).values({
        tenantId,
        engagementId,
        signerMembershipId,
        signoffRole: assignedRole,
        action: data.action,
        comments: data.comments,
        signedHash: recordHash,
        artifactHash,
        signature: evidenceSignature.signature,
        signatureAlgorithm: evidenceSignature.algorithm,
        signingKeyId: evidenceSignature.keyId,
        previousRecordHash,
        recordHash,
        createdAt,
      }).returning();
      if (assignedRole === "lead_partner" && data.action === "approved") {
        await tx.update(engagements).set({ status: "completed", updatedAt: new Date() }).where(
          and(eq(engagements.tenantId, tenantId), eq(engagements.id, engagementId)),
        );
      }
      return log;
    });
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
    const artifacts = await db
      .select({ fileUrl: workingPapers.fileUrl })
      .from(workingPapers)
      .where(and(
        eq(workingPapers.tenantId, tenantId),
        eq(workingPapers.engagementId, data.engagementId),
      ));
    if (artifacts.length === 0 || artifacts.some((artifact) => !artifact.fileUrl)) {
      throw new ApiError(409, "All working papers must have retrievable file artifacts before certificate issuance", "ARTIFACT_REQUIRED");
    }
    const artifactHashes = await Promise.all(artifacts.map((artifact) => hashArtifactUrl(artifact.fileUrl!)));
    const artifactHash = sha256Bytes(canonicalEvidence(artifactHashes));
    const evidenceSignature = signEvidence(canonicalEvidence({
      artifactHash,
      signerMembershipId: data.signedByMembershipId,
      signoffRole: "lead_partner",
      action: "issued",
      createdAt: signedAt.toISOString(),
    }));

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
        artifactHash,
        signature: evidenceSignature.signature,
        signatureAlgorithm: evidenceSignature.algorithm,
        signingKeyId: evidenceSignature.keyId,
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
      verified: cert.status === "issued" && !!cert.signature && !!cert.artifactHash &&
        verifyCertificateEvidence({
          status: cert.status,
          signature: cert.signature,
          artifactHash: cert.artifactHash,
          signerMembershipId: cert.signedByMembershipId,
          signoffRole: "lead_partner",
          signedAt: cert.signedAt,
        }),
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
