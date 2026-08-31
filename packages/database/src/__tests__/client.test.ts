import { describe, it, expect, afterAll } from "vitest";
import { db, closeDatabaseConnection } from "../client.js";
import { sql } from "drizzle-orm";

describe("Database Client Integration", () => {
  afterAll(async () => {
    await closeDatabaseConnection();
  });

  it("should connect to the database and execute a basic query", async () => {
    // This is a safe network test that proves the DB connection is healthy
    const result = await db.execute(sql`SELECT 1 as healthy`);
    expect(result).toBeDefined();
    expect(result[0].healthy).toBe(1);
  });
});
