// scripts/failure-cases.js
const { execSync } = require("child_process");
const path = require("path");

function run(command, env = {}) {
  try {
    execSync(command, {
      stdio: "ignore",
      cwd: path.resolve(__dirname, ".."),
      env: { ...process.env, ...env },
    });
    return { success: true };
  } catch (e) {
    return {
      success: false,
      code: e.status || 1,
      output: e.stderr?.toString() || "",
    };
  }
}

function assertFailure(result, name) {
  if (result.success) {
    console.error(`FAIL: ${name} unexpectedly succeeded`);
    process.exit(1);
  }
  console.log(`PASS: ${name} failed as expected (exit code ${result.code})`);
}

function main() {
  console.log("Running failure case tests");

  // 1. Invalid API env (PORT not a number)
  const invalidEnv = run("pnpm dev", { PORT: "not-a-number" });
  assertFailure(invalidEnv, "Invalid API env (PORT)");

  // 2. Invalid DATABASE_URL for DB verification
  const invalidDb = run("pnpm -F @avenquis/database db:verify", {
    DATABASE_URL: "postgres://invalid:wrong@localhost:5432/bad_db",
  });
  assertFailure(invalidDb, "Invalid DATABASE_URL");

  // 3. PostgreSQL unreachable (stop container then run verify)
  console.log("Stopping PostgreSQL container for unreachable test");
  try {
    execSync("docker compose down db", {
      cwd: path.resolve(__dirname, ".."),
      stdio: "ignore",
    });
  } catch (_) {}
  const unreachable = run("pnpm -F @avenquis/database db:verify");
  assertFailure(unreachable, "PostgreSQL unreachable");

  console.log("All failure cases passed");
  process.exit(0);
}

main();
