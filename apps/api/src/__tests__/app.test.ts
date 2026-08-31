import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../http/app.js";

import { Router } from "express";

describe("API Core Functionality", () => {
  const testRouter = Router();
  testRouter.get("/error", () => {
    throw new Error("Secret internal failure!");
  });
  const app = createApp(testRouter);

  describe("GET /health", () => {
    it("should return expected status and body", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: "ok" });

      // Verify security headers (helmet)
      expect(response.headers["x-powered-by"]).toBeUndefined();
    });
  });

  describe("Request Correlation ID", () => {
    it("should include a request ID in the response", async () => {
      const response = await request(app).get("/health");
      expect(response.headers["x-request-id"]).toBeDefined();
    });

    it("should accept a valid client-provided request ID", async () => {
      const customId = "custom-id-123";
      const response = await request(app)
        .get("/health")
        .set("X-Request-Id", customId);

      expect(response.headers["x-request-id"]).toBe(customId);
    });

    it("should ignore invalid client-provided request IDs and generate a new one", async () => {
      const invalidId = "invalid_id_!@#";
      const response = await request(app)
        .get("/health")
        .set("X-Request-Id", invalidId);

      expect(response.headers["x-request-id"]).toBeDefined();
      expect(response.headers["x-request-id"]).not.toBe(invalidId);
    });
  });

  describe("Error Handling", () => {
    it("should return a controlled 404 response for unknown routes", async () => {
      const response = await request(app).get("/unknown-route");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: {
          code: "NOT_FOUND",
          message: "Resource not found",
        },
      });
      // Ensure request ID is present on error responses
      expect(response.headers["x-request-id"]).toBeDefined();
    });

    it("should return a sanitized 500 response for unexpected errors", async () => {
      // Vitest sets NODE_ENV=test. In test/prod, stack traces should NOT be leaked.
      // Wait, the env configuration sets NODE_ENV=development by default unless specified.
      // Let's check the response.
      const response = await request(app).get("/test/error");

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe("INTERNAL_ERROR");
      expect(response.body.error.message).toBe("An unexpected error occurred");

      // Ensure secret error message is NOT exposed
      expect(response.body.error.message).not.toContain(
        "Secret internal failure!",
      );
      // Ensure stack trace is NOT leaked in test/production environment by verifying NODE_ENV
      expect(response.body.error.stack).toBeUndefined();

      // Request ID must be present
      expect(response.headers["x-request-id"]).toBeDefined();
    });

    it("should return 400 for malformed JSON", async () => {
      const response = await request(app)
        .post("/health")
        .set("Content-Type", "application/json")
        .send("{bad json");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("BAD_REQUEST");
      expect(response.body.error.message).toBe("Malformed JSON payload");
    });

    it("should return 413 for oversized body", async () => {
      const bigPayload = { data: "x".repeat(200000) }; // > 100kb
      const response = await request(app)
        .post("/health")
        .set("Content-Type", "application/json")
        .send(bigPayload);

      expect(response.status).toBe(413);
      expect(response.body.error.code).toBe("PAYLOAD_TOO_LARGE");
      expect(response.body.error.message).toBe(
        "Request body exceeds size limit",
      );
    });
  });
});
