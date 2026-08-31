import { describe, expect, it, vi } from "vitest";
import { parseEnv } from "../config/env.js";
import { parseDatabaseEnv } from "@avenquis/database";
import { requirePermission } from "../http/middlewares/rbac.js";

describe("security remediation", () => {
  it("fails production API startup when secrets or database URL are missing", () => {
    expect(() => parseEnv({ NODE_ENV: "production" })).toThrow(/Invalid production configuration/);
    expect(() => parseEnv({
      NODE_ENV: "production",
      JWT_SECRET: "short",
      REFRESH_TOKEN_SECRET: "short",
      DATABASE_URL: "postgresql://user:pass@localhost/db",
    })).toThrow(/Invalid production configuration/);
  });

  it("fails production database configuration without DATABASE_URL", () => {
    expect(() => parseDatabaseEnv({ NODE_ENV: "production" })).toThrow(/Invalid database configuration/);
  });

  it("rejects AAL1 for an AAL2-protected permission", () => {
    const next = vi.fn();
    const req = { user: { id: "u", email: "u@example.com", aal: "aal1" }, permissions: ["*"] } as never;
    requirePermission("admin:manage", { requireAal2: true })(req, {} as never, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: "MFA_REQUIRED" }));
  });
});
