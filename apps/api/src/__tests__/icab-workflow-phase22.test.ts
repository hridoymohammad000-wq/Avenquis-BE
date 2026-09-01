import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 22 ICAB Workflows API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let studentMembershipId: string;
  let studentProfileId: string;
  let formId: string;
  let examRegId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase22_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase22 Audit Partner",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-icab-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Student User & Membership
    const studentEmail = `student_phase22_${Date.now()}@avenquis.local`;
    const studentRegRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: studentEmail,
        password: "StudentPassword123!",
        fullName: "Phase22 Articled Student",
      });
    expect(studentRegRes.status).toBe(201);

    // Invite student to tenant A
    const inviteRes = await request(app)
      .post("/api/v1/admin/members")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        email: studentEmail,
        roles: ["student"],
      });
    studentMembershipId = inviteRes.body.data.id;

    // 3. Create Student Profile
    const profileRes = await request(app)
      .post("/api/v1/students")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        membershipId: studentMembershipId,
        registrationNumber: `REG-ICAB-${Date.now()}`,
        courseLevel: "knowledge",
      });
    studentProfileId = profileRes.body.data.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. ICAB Forms (Form 104, 108, etc.)", () => {
    it("should submit an ICAB Form 104 draft", async () => {
      const res = await request(app)
        .post("/api/v1/compliance/icab/forms")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          studentId: studentProfileId,
          formType: "form_104",
          documentUrl: "https://avenquis-storage.local/form104.pdf",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      formId = res.body.data.id;
      expect(res.body.data.status).toBe("draft");
    });

    it("should allow principal to sign the form", async () => {
      const res = await request(app)
        .patch(`/api/v1/compliance/icab/forms/${formId}/sign`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("pending_principal_signature");
      expect(res.body.data.signedByPrincipalId).not.toBeNull();
    });

    it("should list ICAB forms for the student", async () => {
      const res = await request(app)
        .get(`/api/v1/compliance/icab/forms?studentId=${studentProfileId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].formType).toBe("form_104");
    });
  });

  describe("2. ICAB Exam Registrations", () => {
    it("should submit an exam registration request", async () => {
      const res = await request(app)
        .post("/api/v1/compliance/icab/exams/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          studentId: studentProfileId,
          examSession: "May-June 2026",
          level: "certificate",
          leaveRequestedDays: 14,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      examRegId = res.body.data.id;
      expect(res.body.data.status).toBe("applied");
    });

    it("should allow principal to approve study leave for exam", async () => {
      const res = await request(app)
        .patch(`/api/v1/compliance/icab/exams/${examRegId}/approve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          leaveApproved: true,
          comments: "Approved 14 days study leave for Certificate Level exams.",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("principal_approved");
      expect(res.body.data.leaveApproved).toBe(true);
    });

    it("should list exam registrations for the student", async () => {
      const res = await request(app)
        .get(`/api/v1/compliance/icab/exams?studentId=${studentProfileId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].examSession).toBe("May-June 2026");
    });
  });
});
