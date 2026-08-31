import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import {
  db,
  userProfiles,
  tenants,
  memberships,
  closeDatabaseConnection,
  eq,
} from "@avenquis/database";

describe("Phase 4 People & Staff Management API", () => {
  const app = createApp();

  let adminUser: { id: string } | undefined;
  let adminToken: string;
  let tenantAId: string;
  let tenantBId: string;
  let tenantBToken: string;
  let deptAuditId: string;
  let deptTaxId: string;
  let desigSeniorId: string;
  let desigPartnerId: string;
  let staffUserA: { id: string } | undefined;
  let staffAId: string;
  let staffAMembershipId: string;

  beforeAll(async () => {
    // 1. Create Admin User
    const adminEmail = `admin_phase4_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase4 Admin User",
    });
    adminUser = regRes.body.data.user;
    adminToken = regRes.body.data.tokens.accessToken;

    // 2. Create Tenant A
    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Apex Chartered Accountants",
        slug: `apex-ca-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 3. Create Second User & Tenant B for cross-tenant isolation testing
    const tenantBEmail = `tenantb_${Date.now()}@avenquis.local`;
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
        name: "Beta Audit Partners",
        slug: `beta-audit-${Date.now()}`,
      });
    tenantBId = tenantBRes.body.data.tenant.id;
  });

  afterAll(async () => {
    if (tenantAId) {
      await db.delete(tenants).where(eq(tenants.id, tenantAId));
    }
    if (tenantBId) {
      await db.delete(tenants).where(eq(tenants.id, tenantBId));
    }
    if (adminUser?.id) {
      await db.delete(userProfiles).where(eq(userProfiles.id, adminUser.id));
    }
    if (staffUserA?.id) {
      await db.delete(userProfiles).where(eq(userProfiles.id, staffUserA.id));
    }
    await closeDatabaseConnection();
  });

  describe("1. Department Management", () => {
    it("should create departments in Tenant A", async () => {
      const res = await request(app)
        .post("/api/v1/departments")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          name: "Audit & Assurance",
          code: "AUD",
          description: "Statutory and internal audit practice",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe("AUD");
      deptAuditId = res.body.data.id;

      const taxRes = await request(app)
        .post("/api/v1/departments")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          name: "Taxation & Legal",
          code: "TAX",
          description: "Direct and indirect taxation advisory",
        });

      expect(taxRes.status).toBe(201);
      deptTaxId = taxRes.body.data.id;
    });

    it("should reject duplicate department code in same tenant", async () => {
      const res = await request(app)
        .post("/api/v1/departments")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          name: "Duplicate Audit",
          code: "AUD",
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("DEPARTMENT_EXISTS");
    });

    it("should list departments for Tenant A", async () => {
      const res = await request(app)
        .get("/api/v1/departments")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(
        res.body.data.some((d: { code: string }) => d.code === "AUD"),
      ).toBe(true);
    });
  });

  describe("2. Designation & Hierarchy Management", () => {
    it("should create designations with ranking levels", async () => {
      const partnerRes = await request(app)
        .post("/api/v1/designations")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          name: "Partner",
          code: "PTR",
          level: 10,
          description: "Engagement Partner",
        });

      expect(partnerRes.status).toBe(201);
      desigPartnerId = partnerRes.body.data.id;

      const seniorRes = await request(app)
        .post("/api/v1/designations")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          name: "Senior Audit Associate",
          code: "SR_ASSOC",
          level: 4,
          description: "Field team leader",
        });

      expect(seniorRes.status).toBe(201);
      desigSeniorId = seniorRes.body.data.id;
    });

    it("should reject duplicate designation code in same tenant", async () => {
      const res = await request(app)
        .post("/api/v1/designations")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          name: "Duplicate Partner",
          code: "PTR",
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("DESIGNATION_EXISTS");
    });

    it("should list designations in descending order of ranking level", async () => {
      const res = await request(app)
        .get("/api/v1/designations")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0].code).toBe("PTR"); // level 10 first
    });
  });

  describe("3. Staff Profiles & Directory", () => {
    it("should register a new staff member and create their profile", async () => {
      // 1. Register staff user
      const email = `staff_${Date.now()}@avenquis.local`;
      const regRes = await request(app).post("/api/v1/auth/register").send({
        email,
        password: "StaffPassword123!",
        fullName: "Tariqul Islam",
      });
      staffUserA = regRes.body.data.user;

      // 2. Add membership in Tenant A
      const [membership] = await db
        .insert(memberships)
        .values({
          tenantId: tenantAId,
          userId: staffUserA!.id,
          status: "active",
        })
        .returning();
      staffAMembershipId = membership.id;

      // 3. Create staff profile
      const staffRes = await request(app)
        .post("/api/v1/staff")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          membershipId: staffAMembershipId,
          employeeCode: "EMP-1001",
          departmentId: deptAuditId,
          designationId: desigSeniorId,
          employmentType: "full_time",
          status: "active",
          phone: "+8801700000000",
          emergencyContact: {
            name: "Fatima Islam",
            relation: "Spouse",
            phone: "+8801800000000",
          },
          bio: "Senior Auditor specialized in Financial Institutions",
        });

      expect(staffRes.status).toBe(201);
      expect(staffRes.body.success).toBe(true);
      expect(staffRes.body.data.employeeCode).toBe("EMP-1001");
      staffAId = staffRes.body.data.id;
    });

    it("should reject duplicate employee code in same tenant", async () => {
      const res = await request(app)
        .post("/api/v1/staff")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          membershipId: staffAMembershipId,
          employeeCode: "EMP-1001",
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("EMPLOYEE_CODE_EXISTS");
    });

    it("should list staff with search and department filtering", async () => {
      // Search by employee code
      const codeRes = await request(app)
        .get("/api/v1/staff?search=EMP-1001")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(codeRes.status).toBe(200);
      expect(codeRes.body.data.length).toBe(1);
      expect(codeRes.body.data[0].fullName).toBe("Tariqul Islam");
      expect(codeRes.body.data[0].departmentName).toBe("Audit & Assurance");

      // Filter by department
      const deptRes = await request(app)
        .get(`/api/v1/staff?departmentId=${deptAuditId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(deptRes.status).toBe(200);
      expect(deptRes.body.data.length).toBe(1);

      // Filter by mismatched department
      const emptyRes = await request(app)
        .get(`/api/v1/staff?departmentId=${deptTaxId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(emptyRes.status).toBe(200);
      expect(emptyRes.body.data.length).toBe(0);
    });

    it("should get staff profile by ID with full details & initial lifecycle", async () => {
      const res = await request(app)
        .get(`/api/v1/staff/${staffAId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(staffAId);
      expect(res.body.data.fullName).toBe("Tariqul Islam");
      expect(res.body.data.departmentName).toBe("Audit & Assurance");
      expect(res.body.data.designationName).toBe("Senior Audit Associate");
      expect(res.body.data.lifecycleHistory.length).toBe(1);
      expect(res.body.data.lifecycleHistory[0].eventType).toBe("joined");
    });

    it("should update staff profile information", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/${staffAId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          bio: "Senior Auditor & Certified Information Systems Auditor",
          phone: "+8801711112222",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.bio).toContain(
        "Certified Information Systems Auditor",
      );
      expect(res.body.data.phone).toBe("+8801711112222");
    });
  });

  describe("4. Join/Exit Lifecycle Transitions", () => {
    it("should record a promotion lifecycle event and update designation", async () => {
      const res = await request(app)
        .post(`/api/v1/staff/${staffAId}/lifecycle`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          eventType: "promoted",
          newDesignationId: desigPartnerId,
          remarks: "Promoted to Partner following annual review",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.eventType).toBe("promoted");

      // Verify updated profile has partner designation
      const profileRes = await request(app)
        .get(`/api/v1/staff/${staffAId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(profileRes.body.data.designationId).toBe(desigPartnerId);
      expect(profileRes.body.data.designationName).toBe("Partner");
      expect(profileRes.body.data.lifecycleHistory.length).toBe(2);
    });

    it("should record exit / resignation and set exitDate", async () => {
      const res = await request(app)
        .post(`/api/v1/staff/${staffAId}/lifecycle`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          eventType: "resigned",
          newStatus: "exited",
          remarks: "Pursuing opportunities abroad",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.eventType).toBe("resigned");

      const profileRes = await request(app)
        .get(`/api/v1/staff/${staffAId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(profileRes.body.data.status).toBe("exited");
      expect(profileRes.body.data.exitDate).toBeDefined();
    });
  });

  describe("5. Multi-Tenant Isolation & Security Boundary", () => {
    it("Tenant B should NOT see Tenant A departments", async () => {
      const res = await request(app)
        .get("/api/v1/departments")
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it("Tenant B should NOT see Tenant A staff directory", async () => {
      const res = await request(app)
        .get("/api/v1/staff")
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it("Tenant B should NOT be able to access Tenant A staff profile by ID", async () => {
      const res = await request(app)
        .get(`/api/v1/staff/${staffAId}`)
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("STAFF_NOT_FOUND");
    });
  });
});
