// scripts/integration-tests.ts
import { execSync, spawn } from "child_process";
// Native fetch used (Node 24+)
import * as fs from "fs";
import * as path from "path";

function log(msg: string) {
  console.log(`[integration-tests] ${msg}`);
}

function runCommand(
  command: string,
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
): { stdout: string; stderr: string; status: number } {
  try {
    const output = execSync(command, {
      stdio: "pipe",
      cwd: options.cwd,
      env: options.env,
      encoding: "utf-8",
    });
    return { stdout: output, stderr: "", status: 0 };
  } catch (e: any) {
    return {
      stdout: e.stdout?.toString() || "",
      stderr: e.stderr?.toString() || "",
      status: e.status ?? 1,
    };
  }
}

function waitForHealth(url: string, timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(url);
        if (res.ok) {
          clearInterval(interval);
          resolve();
        }
      } catch (_) {}
      if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error(`Health check timed out for ${url}`));
      }
    }, 500);
  });
}

async function main() {
  const root = path.resolve(__dirname, "..");
  // Ensure .env exists (copy from example if missing)
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) {
    const example = path.join(root, ".env.example");
    if (fs.existsSync(example)) {
      fs.copyFileSync(example, envPath);
      log("Copied .env.example to .env");
    } else {
      throw new Error("No .env or .env.example found");
    }
  }

  // Start PostgreSQL via Docker Compose (db service only)
  log("Starting PostgreSQL container");
  runCommand("docker compose up -d db", { cwd: root });

  // Wait for DB to be ready
  log("Waiting 5s for DB startup");
  await new Promise((r) => setTimeout(r, 5000));

  // Run migrations
  log("Running initial migrations");
  const mig1 = runCommand("pnpm -F @avenquis/database db:migrate", {
    cwd: root,
    env: { ...process.env, NODE_ENV: "development" },
  });
  if (mig1.status !== 0) throw new Error(`Migration failed: ${mig1.stderr}`);
  log("Migrations applied");

  // Re‑run migrations (should be no‑op)
  log("Re‑running migrations (no‑op expected)");
  const mig2 = runCommand("pnpm -F @avenquis/database db:migrate", {
    cwd: root,
  });
  if (mig2.status !== 0) throw new Error(`Re‑migration failed: ${mig2.stderr}`);

  // Development server test
  log("Starting dev server");
  const devProc = spawn("pnpm", ["dev"], {
    cwd: root,
    shell: true,
    env: { ...process.env, PORT: "3000" },
  });
  devProc.stdout?.on("data", (d) => process.stdout.write(`[dev] ${d}`));
  devProc.stderr?.on("data", (d) => process.stderr.write(`[dev] ${d}`));

  try {
    await waitForHealth("http://localhost:3000/health");
    log("Dev server health OK");
    // 404 test
    const notFound = await fetch("http://localhost:3000/unknown");
    if (notFound.status !== 404) throw new Error("Expected 404");
    const notFoundBody = await notFound.json();
    if (notFoundBody.error?.code !== "NOT_FOUND")
      throw new Error("Incorrect 404 body");
    if (!notFound.headers.get("x-request-id"))
      throw new Error("Missing request id on 404");
    log("404 test passed");
    // Health request ID header test
    const healthResp = await fetch("http://localhost:3000/health");
    if (!healthResp.headers.get("x-request-id"))
      throw new Error("Missing request id on health");
    log("Request‑ID header present");
    // Security header test (X‑Powered‑By should be absent)
    if (healthResp.headers.get("x-powered-by"))
      throw new Error("Server header leaked");
    log("Security headers OK");
  } finally {
    devProc.kill("SIGINT");
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Production build & start
  log("Building production bundle");
  const build = runCommand("pnpm build", { cwd: root });
  if (build.status !== 0) throw new Error(`Build failed: ${build.stderr}`);

  log("Starting production server");
  const prodEnv = { ...process.env, NODE_ENV: "production", PORT: "3001" };
  const prodProc = spawn("pnpm", ["start"], {
    cwd: root,
    shell: true,
    env: prodEnv,
  });
  prodProc.stdout?.on("data", (d) => process.stdout.write(`[prod] ${d}`));
  prodProc.stderr?.on("data", (d) => process.stderr.write(`[prod] ${d}`));
  try {
    await waitForHealth("http://localhost:3001/health");
    log("Prod server health OK");
    const healthProd = await fetch("http://localhost:3001/health");
    if (!healthProd.headers.get("x-request-id"))
      throw new Error("Missing request id on prod health");
    log("Prod request‑ID header present");
    if (healthProd.headers.get("x-powered-by"))
      throw new Error("Prod server header leaked");
    log("Prod security headers OK");
  } finally {
    prodProc.kill("SIGINT");
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Clean up Docker container
  log("Stopping PostgreSQL container");
  runCommand("docker compose down db", { cwd: root });

  log("Integration tests completed successfully");
}

main().catch((err) => {
  console.error("Integration test failed:", err);
  process.exit(1);
});
