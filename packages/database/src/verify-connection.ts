import { db, closeDatabaseConnection } from "./client.js";
import { sql } from "drizzle-orm";

async function verify() {
  try {
    const result = await db.execute(
      sql`SELECT current_database(), current_user, version()`,
    );
    console.log("✅ Database connection verified successfully.");
    console.log("Details:", result[0]);
    process.exit(0);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
}

verify();
