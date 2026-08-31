import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 6 Client CRM API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let tenantBToken: string;
  let tenantBId: string;
  let clientId: string;
  let documentId: string;

  beforeAll(async () => {
    // 1. Create Admin User & Tenant A
    const adminEmail = `admin_phase6_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase6 Admin User",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Rahman & Co Chartered Accountants",
        slug: `rahman-crm-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Create Tenant B & Admin for multi-tenant isolation testing
    const tenantBEmail = `tenantb_phase6_${Date.now()}@avenquis.local`;
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
        slug: `haq-crm-${Date.now()}`,
      });
    tenantBId = tenantBRes.body.data.tenant.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. Client Onboarding & Directory", () => {
    it("should create a new corporate client", async () => {
      const code = `CLI-${Date.now()}`;
      const res = await request(app)
        .post("/api/v1/clients")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientCode: code,
          name: "Apex Footwear Bangladesh Ltd",
          clientType: "corporate",
          industry: "Manufacturing & Retail",
          taxIdentificationNumber: "TIN-123456789",
          businessRegistrationNumber: "BIN-987654321",
          primaryEmail: "info@apexfootwear.com",
          primaryPhone: "+8801700000000",
          address: {
            street: "10 Gulshan Avenue",
            city: "Dhaka",
            country: "Bangladesh",
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.clientCode).toBe(code);
      expect(res.body.data.name).toBe("Apex Footwear Bangladesh Ltd");
      expect(res.body.data.kycStatus).toBe("pending");
      expect(res.body.data.riskRating).toBe("unassessed");
      clientId = res.body.data.id;
    });

    it("should reject duplicate client code in same tenant", async () => {
      const res = await request(app)
        .post("/api/v1/clients")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientCode: "CLI-DUP-001",
          name: "Original Client",
          clientType: "corporate",
        });

      expect(res.status).toBe(201);

      const dupRes = await request(app)
        .post("/api/v1/clients")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          clientCode: "CLI-DUP-001",
          name: "Duplicate Client",
          clientType: "corporate",
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe("CLIENT_CODE_EXISTS");
    });

    it("should list clients with search filter", async () => {
      const res = await request(app)
        .get("/api/v1/clients?search=Apex")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].name).toContain("Apex");
    });

    it("should get client details by ID", async () => {
      const res = await request(app)
        .get(`/api/v1/clients/${clientId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(clientId);
      expect(res.body.data.contacts).toEqual([]);
      expect(res.body.data.kycDocuments).toEqual([]);
    });

    it("should update client information", async () => {
      const res = await request(app)
        .patch(`/api/v1/clients/${clientId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          industry: "Footwear & Leather Exports",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.industry).toBe("Footwear & Leather Exports");
    });
  });

  describe("2. Contact Persons Management", () => {
    it("should add a primary contact person to client", async () => {
      const res = await request(app)
        .post(`/api/v1/clients/${clientId}/contacts`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          fullName: "Tanvir Hossain",
          designation: "Chief Financial Officer",
          email: "tanvir@apexfootwear.com",
          phone: "+8801811111111",
          isPrimary: true,
          notes: "Primary key stakeholder for audit engagements",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe("Tanvir Hossain");
      expect(res.body.data.isPrimary).toBe(true);
    });

    it("should add a secondary contact person", async () => {
      const res = await request(app)
        .post(`/api/v1/clients/${clientId}/contacts`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          fullName: "Nusrat Jahan",
          designation: "Head of Finance & Tax",
          email: "nusrat@apexfootwear.com",
          phone: "+8801822222222",
          isPrimary: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isPrimary).toBe(false);
    });

    it("should return sorted contacts inside client details", async () => {
      const res = await request(app)
        .get(`/api/v1/clients/${clientId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.data.contacts.length).toBe(2);
      expect(res.body.data.contacts[0].isPrimary).toBe(true);
    });
  });

  describe("3. KYC/AML Compliance & Risk Assessment", () => {
    it("should upload a KYC document record", async () => {
      const res = await request(app)
        .post(`/api/v1/clients/${clientId}/kyc`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          documentType: "trade_license",
          documentNumber: "TL-2026-9988",
          fileUrl: "https://vault.avenquis.local/docs/tl-2026.pdf",
          expiryDate: "2027-06-30T00:00:00.000Z",
          remarks: "Uploaded current year trade license",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.documentType).toBe("trade_license");
      expect(res.body.data.verificationStatus).toBe("pending");
      documentId = res.body.data.id;
    });

    it("should verify KYC document and update client overall kycStatus", async () => {
      const res = await request(app)
        .patch(`/api/v1/clients/kyc/${documentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          verificationStatus: "verified",
          remarks: "Verified against City Corporation database",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationStatus).toBe("verified");

      // Verify updated client overall kycStatus
      const clientRes = await request(app)
        .get(`/api/v1/clients/${clientId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(clientRes.body.data.kycStatus).toBe("verified");
    });

    it("should update client risk rating", async () => {
      const res = await request(app)
        .patch(`/api/v1/clients/${clientId}/risk`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          riskRating: "medium",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.riskRating).toBe("medium");
    });
  });

  describe("4. Multi-Tenant Isolation", () => {
    it("should prevent Tenant B from accessing Tenant A client profile", async () => {
      const res = await request(app)
        .get(`/api/v1/clients/${clientId}`)
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("CLIENT_NOT_FOUND");
    });
  });
});
