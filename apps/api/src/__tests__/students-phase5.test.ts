import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { db, memberships, closeDatabaseConnection } from "@avenquis/database";

describe("Phase 5 CA Student / Articleship Management API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let tenantBToken: string;
  let tenantBId: string;
  let studentMembershipId: string;
  let studentMembershipId2: string;
  let studentId: string;
  let leaveId: string;

  beforeAll(async () => {
    // 1. Create Admin User
    const adminEmail = `admin_phase5_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase5 Admin User",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    // 2. Create Tenant A
    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Rahman & Co Chartered Accountants",
        slug: `rahman-ca-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 3. Create Tenant B & Admin for multi-tenant isolation testing
    const tenantBEmail = `tenantb_phase5_${Date.now()}@avenquis.local`;
    const regBRes = await request(app).post("/api/v1/auth/register").send({
      email: tenantBEmail,
      password: "AdminPassword123!",
      fullName: "Tenant B Admin",
    });
    tenantBToken = regBRes.body.data.tokens.accessToken;

    const tenantBRes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${tenantBToken}`)
      .send({
        name: "Haq & Associates",
        slug: `haq-ca-${Date.now()}`,
      });
    tenantBId = tenantBRes.body.data.tenant.id;

    // 4. Create Student User & Membership in Tenant A
    const studentEmail = `student_${Date.now()}@avenquis.local`;
    const studentUserRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: studentEmail,
        password: "StudentPassword123!",
        fullName: "Tariqul Islam",
      });
    const studentUser = studentUserRes.body.data.user;

    const [membership] = await db
      .insert(memberships)
      .values({
        tenantId: tenantAId,
        userId: studentUser.id,
        status: "active",
      })
      .returning();
    studentMembershipId = membership.id;

    // 5. Create Student User 2 & Membership in Tenant A for testing duplicate registration numbers
    const studentEmail2 = `student2_${Date.now()}@avenquis.local`;
    const studentUserRes2 = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: studentEmail2,
        password: "StudentPassword123!",
        fullName: "Kazi Arif",
      });
    const [membership2] = await db
      .insert(memberships)
      .values({
        tenantId: tenantAId,
        userId: studentUserRes2.body.data.user.id,
        status: "active",
      })
      .returning();
    studentMembershipId2 = membership2.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Student Onboarding & Profiles", () => {
    it("should create a CA student profile", async () => {
      const regNum = `ICAB-${Date.now()}`;
      const res = await request(app)
        .post("/api/v1/students")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          membershipId: studentMembershipId,
          registrationNumber: regNum,
          courseLevel: "knowledge",
          articleshipStartDate: "2026-01-01T00:00:00.000Z",
          articleshipEndDate: "2029-01-01T00:00:00.000Z",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.registrationNumber).toBe(regNum);
      expect(res.body.data.courseLevel).toBe("knowledge");
      studentId = res.body.data.id;
    });

    it("should reject duplicate registration number in same tenant", async () => {
      const res = await request(app)
        .post("/api/v1/students")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          membershipId: studentMembershipId2,
          registrationNumber: "ICAB-12345",
          courseLevel: "knowledge",
        });

      expect(res.status).toBe(201);

      const dupRes = await request(app)
        .post("/api/v1/students")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          membershipId: studentMembershipId,
          registrationNumber: "ICAB-12345",
          courseLevel: "knowledge",
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe("REGISTRATION_NUMBER_EXISTS");
    });

    it("should list students in Tenant A", async () => {
      const res = await request(app)
        .get("/api/v1/students")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it("should get full student details by ID", async () => {
      const res = await request(app)
        .get(`/api/v1/students/${studentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(studentId);
      expect(res.body.data.fullName).toBe("Tariqul Islam");
      expect(res.body.data.trainingRecords).toEqual([]);
    });
  });

  describe("2. Training Records & Leave Management", () => {
    it("should log training hours for student", async () => {
      const res = await request(app)
        .post(`/api/v1/students/${studentId}/training`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          topic: "Statutory Audit & Inventory Verification",
          hoursCompleted: 40,
          remarks: "Completed Q1 stock take",
          verifyNow: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hoursCompleted).toBe(40);
      expect(res.body.data.verifiedAt).not.toBeNull();
    });

    it("should apply for student leave", async () => {
      const res = await request(app)
        .post(`/api/v1/students/${studentId}/leaves`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          leaveType: "study",
          startDate: "2026-05-01T00:00:00.000Z",
          endDate: "2026-05-15T00:00:00.000Z",
          totalDays: 14,
          remarks: "Leave for ICAB exam preparation",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("pending");
      expect(res.body.data.totalDays).toBe(14);
      leaveId = res.body.data.id;
    });

    it("should approve student leave application", async () => {
      const res = await request(app)
        .patch(`/api/v1/students/leaves/${leaveId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          status: "approved",
          remarks: "Approved by Partner",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("approved");
    });
  });

  describe("3. Exam Records & Client Assignments", () => {
    it("should record exam result and auto-promote course level", async () => {
      const res = await request(app)
        .post(`/api/v1/students/${studentId}/exams`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          session: "Summer 2026",
          level: "knowledge",
          subject: "Assurance & Accounting",
          resultStatus: "passed",
          marks: 78,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resultStatus).toBe("passed");

      // Check updated course level
      const studentRes = await request(app)
        .get(`/api/v1/students/${studentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(studentRes.body.data.courseLevel).toBe("application");
    });

    it("should log client audit assignment", async () => {
      const res = await request(app)
        .post(`/api/v1/students/${studentId}/assignments`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientName: "Standard Bank PLC",
          role: "Junior Auditor",
          startDate: "2026-02-01T00:00:00.000Z",
          endDate: "2026-03-31T00:00:00.000Z",
          hoursLogged: 160,
          remarks: "Worked on loan portfolio audit",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.clientName).toBe("Standard Bank PLC");
    });
  });

  describe("4. Dashboard & Multi-Tenant Isolation", () => {
    it("should return articleship dashboard summary", async () => {
      const res = await request(app)
        .get(`/api/v1/students/${studentId}/dashboard`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.training.verifiedHours).toBe(40);
      expect(res.body.data.leaves.approvedDays).toBe(14);
      expect(res.body.data.exams.passed).toBe(1);
    });

    it("should isolate Tenant B from Tenant A student data", async () => {
      const res = await request(app)
        .get(`/api/v1/students/${studentId}`)
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("STUDENT_NOT_FOUND");
    });
  });
});
