import { describe, it, expect } from "vitest";
import { env } from "../config/env.js";

describe("Database Environment Validation", () => {
  it("should have a valid DATABASE_URL", () => {
    // Proves that Zod validation ran successfully on process.env
    expect(env.DATABASE_URL).toBeDefined();
    expect(env.DATABASE_URL.startsWith("postgres")).toBe(true);
  });
});
