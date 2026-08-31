import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";
import { closeDatabaseConnection } from "@avenquis/database";

describe("Phase 11 Real-time Communication & Notifications API", () => {
  const app = createApp();

  let adminToken: string;
  let adminMembershipId: string;
  let tenantAId: string;
  let tenantBToken: string;
  let tenantBId: string;
  let notificationId: string;
  let sampleEntityId: string;

  beforeAll(async () => {
    // 1. Create Admin User & Tenant A
    const adminEmail = `admin_phase11_${Date.now()}@avenquis.local`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "AdminPassword123!",
      fullName: "Phase11 Audit Partner",
    });
    adminToken = regRes.body.data.tokens.accessToken;

    const tenantARes = await request(app)
      .post("/api/v1/tenants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Rahman & Co Chartered Accountants",
        slug: `rahman-notif-${Date.now()}`,
      });
    tenantAId = tenantARes.body.data.tenant.id;
    adminMembershipId = tenantARes.body.data.membership.id;

    // 2. Create sample client in Tenant A to use as entityId
    const clientRes = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-tenant-id", tenantAId)
      .send({
        clientCode: `CLI-NOTIF-${Date.now()}`,
        name: "Square Pharmaceuticals PLC",
        clientType: "corporate",
      });
    sampleEntityId = clientRes.body.data.id;

    // 3. Create Tenant B & Admin for multi-tenant isolation testing
    const tenantBEmail = `tenantb_phase11_${Date.now()}@avenquis.local`;
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
        slug: `haq-notif-${Date.now()}`,
      });
    tenantBId = tenantBRes.body.data.tenant.id;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("1. In-App Notifications & Unread Counter", () => {
    it("should dispatch a new notification", async () => {
      const res = await request(app)
        .post("/api/v1/notifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          recipientMembershipId: adminMembershipId,
          title: "New Engagement Task Assigned",
          message:
            "You have been assigned to Perform Inventory Physical Stock Count for Beximco",
          type: "task_assignment",
          link: "/workspace/tasks/123",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("New Engagement Task Assigned");
      expect(res.body.data.isRead).toBe(false);
      notificationId = res.body.data.id;
    });

    it("should return accurate unread notification count", async () => {
      const res = await request(app)
        .get("/api/v1/notifications/unread-count")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unreadCount).toBe(1);
    });

    it("should list notifications for user", async () => {
      const res = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].id).toBe(notificationId);
    });
  });

  describe("2. Mark-As-Read Workflows", () => {
    it("should mark individual notification as read", async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);

      // Verify unread count is now 0
      const countRes = await request(app)
        .get("/api/v1/notifications/unread-count")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(countRes.body.data.unreadCount).toBe(0);
    });

    it("should mark all user notifications as read in bulk", async () => {
      // Dispatch 2 new unread notifications
      await request(app)
        .post("/api/v1/notifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          recipientMembershipId: adminMembershipId,
          title: "System Alert 1",
          message: "First notification",
          type: "system_alert",
        });

      await request(app)
        .post("/api/v1/notifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          recipientMembershipId: adminMembershipId,
          title: "System Alert 2",
          message: "Second notification",
          type: "system_alert",
        });

      const res = await request(app)
        .patch("/api/v1/notifications/read-all")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify unread count is 0
      const countRes = await request(app)
        .get("/api/v1/notifications/unread-count")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(countRes.body.data.unreadCount).toBe(0);
    });
  });

  describe("3. Firm Audit Activity Feed", () => {
    it("should log audit activity event", async () => {
      const res = await request(app)
        .post("/api/v1/notifications/activity")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId)
        .send({
          entityType: "client",
          entityId: sampleEntityId,
          action: "created",
          description:
            "New corporate client Square Pharmaceuticals PLC onboarded",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.entityType).toBe("client");
      expect(res.body.data.action).toBe("created");
    });

    it("should query firm activity feed", async () => {
      const res = await request(app)
        .get("/api/v1/notifications/activity")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-tenant-id", tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].actorFullName).toBeTruthy();
    });
  });

  describe("4. Multi-Tenant Isolation", () => {
    it("should isolate Tenant B from Tenant A notifications", async () => {
      const res = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("should isolate Tenant B from Tenant A activity feed", async () => {
      const res = await request(app)
        .get("/api/v1/notifications/activity")
        .set("Authorization", `Bearer ${tenantBToken}`)
        .set("x-tenant-id", tenantBId);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});
