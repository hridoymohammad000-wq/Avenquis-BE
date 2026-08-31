import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 25 Tax & VAT API", () => {
  const app = createApp();

  let adminToken: string;
  let tenantAId: string;
  let clientId: string;
  let workflowId: string;

  beforeAll(async () => {
    // 1. Admin User & Tenant A
    const adminEmail = `admin_phase25_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase25 Tax Partner",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Karim & Partners CA Firm",
        slug: `karim-tax-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;

    // 2. Client
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-TAX-${Date.now()}`,
        name: "Echo Manufacturing",
        clientType: "corporate",
      });
    clientId = clientRes.body.data.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  it("should create a new Corporate Tax workflow", async () => {
    const res = await request(app)
      .post("/api/v1/compliance/tax-vat")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientId,
        workflowType: "corporate_tax",
        period: "FY 2024-2025",
        dueDate: "2026-01-15T00:00:00.000Z",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    workflowId = res.body.data.id;
    expect(workflowId).toBeDefined();
    expect(res.body.data.status).toBe("data_collection");
  });

  it("should update tax workflow status", async () => {
    const res = await request(app)
      .patch(`/api/v1/compliance/tax-vat/${workflowId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        status: "computation",
        notes: "Started tax depreciation computation.",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("computation");
    expect(res.body.data.notes).toBe("Started tax depreciation computation.");
  });

  it("should retrieve tax workflows for the client", async () => {
    const res = await request(app)
      .get(`/api/v1/compliance/tax-vat?clientId=${clientId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].workflowType).toBe("corporate_tax");
  });
});
