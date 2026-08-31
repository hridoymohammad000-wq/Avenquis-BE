// apps/api/src/http/app.ts
import express2 from "express";

// apps/api/src/http/middlewares/request-id.ts
import { randomUUID } from "node:crypto";
function requestIdMiddleware(req, res, next) {
  const reqId = req.get("X-Request-Id");
  const id = reqId && /^[a-zA-Z0-9-]+$/.test(reqId) ? reqId : randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}

// apps/api/src/http/middlewares/logging.ts
import { pinoHttp } from "pino-http";

// apps/api/src/logging/logger.ts
import pino from "pino";

// apps/api/src/config/env.ts
import { z } from "zod";
var envSchema = z.object({
  PORT: z.coerce.number().default(3e3),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  JWT_SECRET: z.string().default("avenquis_jwt_super_secret_key_production_grade_32_chars"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  REFRESH_TOKEN_SECRET: z.string().default("avenquis_refresh_super_secret_key_production_grade_32"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/postgres")
});
var _env = envSchema.safeParse(process.env);
if (!_env.success) {
  console.error("\u274C Invalid environment variables:", _env.error.format());
  process.exit(1);
}
var env = _env.data;

// apps/api/src/logging/logger.ts
var logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : env.NODE_ENV === "development" ? "debug" : "info",
  transport: env.NODE_ENV === "development" ? {
    target: "pino-pretty",
    options: { colorize: true }
  } : void 0,
  redact: [
    "authorization",
    "cookie",
    "set-cookie",
    "password",
    "token",
    "accessToken",
    "refreshToken",
    "secret",
    "apiKey",
    "DATABASE_URL",
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']"
  ]
});

// apps/api/src/http/middlewares/logging.ts
var loggingMiddleware = pinoHttp({
  logger,
  genReqId: (req) => req.id,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  autoLogging: {
    ignore: (req) => req.url === "/health"
  }
});

// apps/api/src/http/middlewares/security.ts
import helmet from "helmet";
import express from "express";
import cookieParser from "cookie-parser";
var securityMiddlewares = [
  helmet(),
  // Adds secure HTTP headers and disables X-Powered-By
  cookieParser(),
  express.json({ limit: "100kb" }),
  // Safe body parsing limit
  express.urlencoded({ extended: true, limit: "100kb" })
];

// apps/api/src/errors/api-error.ts
var ApiError = class extends Error {
  statusCode;
  code;
  details;
  constructor(statusCode, arg2, arg3, details) {
    let message = arg2;
    let code = arg3 || "ERROR";
    if (arg3) {
      if (/^[A-Z0-9_]+$/.test(arg2) && !/^[A-Z0-9_]+$/.test(arg3)) {
        code = arg2;
        message = arg3;
      } else {
        message = arg2;
        code = arg3;
      }
    }
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
};

// apps/api/src/http/middlewares/error-handler.ts
function notFoundHandler(req, res, next) {
  next(new ApiError(404, "NOT_FOUND", "Resource not found"));
}
function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred";
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    statusCode = 400;
    code = "BAD_REQUEST";
    message = "Malformed JSON payload";
  } else if (err.type === "entity.too.large") {
    statusCode = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "Request body exceeds size limit";
  } else {
    logger.error({ err, reqId: req.id }, "Unhandled error");
  }
  res.status(statusCode).json({
    error: {
      code,
      message,
      ...env.NODE_ENV === "development" && { stack: err.stack }
    }
  });
}

// apps/api/src/http/routes/health.ts
import { Router } from "express";
var healthRouter = Router();
healthRouter.get("/", (req, res) => {
  res.status(200).json({
    status: "ok"
  });
});

// apps/api/src/http/routes/auth.ts
import { Router as Router2 } from "express";
import { z as z2 } from "zod";
import { db as db2, userProfiles } from "@avenquis/database";
import { eq } from "drizzle-orm";

// apps/api/src/services/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticator } from "otplib";
import crypto from "crypto";
var AuthService = class {
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }
  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
  static generateTokens(payload) {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    });
    const refreshToken = jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN
    });
    return { accessToken, refreshToken };
  }
  static verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
  }
  static verifyRefreshToken(token) {
    return jwt.verify(token, env.REFRESH_TOKEN_SECRET);
  }
  static generateMfaSecret(email) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, "Avenquis OS", secret);
    return { secret, otpauthUrl };
  }
  static verifyMfaToken(token, secret) {
    return authenticator.check(token, secret);
  }
  static generateBackupCodes(count3 = 8) {
    const codes = [];
    for (let i = 0; i < count3; i++) {
      codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
    }
    return codes;
  }
};

// apps/api/src/services/audit.service.ts
import { db, activityEvents, securityEvents } from "@avenquis/database";
var AuditService = class {
  static async logActivity(params) {
    try {
      await db.insert(activityEvents).values({
        tenantId: params.tenantId,
        membershipId: params.membershipId ?? null,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId ?? null,
        metadata: params.metadata ?? {},
        ipAddress: params.ipAddress ?? null
      });
    } catch (err) {
      logger.error({ err, params }, "Failed to record activity event");
    }
  }
  static async logSecurityEvent(params) {
    try {
      await db.insert(securityEvents).values({
        eventType: params.eventType,
        severity: params.severity ?? "info",
        details: params.details,
        tenantId: params.tenantId ?? null,
        membershipId: params.membershipId ?? null,
        ipAddress: params.ipAddress ?? null
      });
    } catch (err) {
      logger.error({ err, params }, "Failed to record security event");
    }
  }
};

// apps/api/src/http/middlewares/auth.ts
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : req.cookies?.accessToken;
  if (!token) {
    return next(new ApiError(401, "Authentication required", "UNAUTHORIZED"));
  }
  try {
    const payload = AuthService.verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
      aal: payload.aal
    };
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}

// apps/api/src/http/routes/auth.ts
var authRouter = Router2();
var registerSchema = z2.object({
  email: z2.string().email(),
  password: z2.string().min(8, "Password must be at least 8 characters long"),
  fullName: z2.string().min(2, "Full name must be at least 2 characters long")
});
var loginSchema = z2.object({
  email: z2.string().email(),
  password: z2.string().min(1, "Password is required")
});
authRouter.post("/register", async (req, res, next) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(
        400,
        "Validation failed",
        "VALIDATION_ERROR",
        parseResult.error.format()
      );
    }
    const { email, password, fullName } = parseResult.data;
    const existing = await db2.query.userProfiles.findFirst({
      where: eq(userProfiles.email, email)
    });
    if (existing) {
      throw new ApiError(
        409,
        "User with this email already exists",
        "EMAIL_EXISTS"
      );
    }
    const passwordHash = await AuthService.hashPassword(password);
    const [newUser] = await db2.insert(userProfiles).values({
      email,
      fullName,
      passwordHash,
      status: "active"
    }).returning();
    const tokens = AuthService.generateTokens({
      userId: newUser.id,
      email: newUser.email,
      aal: "aal1"
    });
    await AuditService.logSecurityEvent({
      eventType: "USER_REGISTERED",
      severity: "info",
      details: { userId: newUser.id, email: newUser.email },
      ipAddress: req.ip
    });
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          status: newUser.status,
          mfaEnabled: newUser.mfaEnabled
        },
        tokens
      }
    });
  } catch (err) {
    next(err);
  }
});
authRouter.post("/login", async (req, res, next) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(
        400,
        "Validation failed",
        "VALIDATION_ERROR",
        parseResult.error.format()
      );
    }
    const { email, password } = parseResult.data;
    const user = await db2.query.userProfiles.findFirst({
      where: eq(userProfiles.email, email)
    });
    if (!user || !user.passwordHash) {
      throw new ApiError(
        401,
        "Invalid email or password",
        "INVALID_CREDENTIALS"
      );
    }
    if (user.status !== "active") {
      throw new ApiError(
        403,
        `User account is ${user.status}`,
        "USER_INACTIVE"
      );
    }
    const isMatch = await AuthService.comparePassword(
      password,
      user.passwordHash
    );
    if (!isMatch) {
      await AuditService.logSecurityEvent({
        eventType: "FAILED_LOGIN_ATTEMPT",
        severity: "warning",
        details: { email, ipAddress: req.ip },
        ipAddress: req.ip
      });
      throw new ApiError(
        401,
        "Invalid email or password",
        "INVALID_CREDENTIALS"
      );
    }
    const aal = user.mfaEnabled ? "aal1" : "aal2";
    const tokens = AuthService.generateTokens({
      userId: user.id,
      email: user.email,
      aal
    });
    await AuditService.logSecurityEvent({
      eventType: "SUCCESSFUL_LOGIN",
      severity: "info",
      details: {
        userId: user.id,
        email: user.email,
        mfaEnabled: user.mfaEnabled,
        aal
      },
      ipAddress: req.ip
    });
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          status: user.status,
          mfaEnabled: user.mfaEnabled
        },
        requireMfa: user.mfaEnabled,
        tokens
      }
    });
  } catch (err) {
    next(err);
  }
});
authRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await db2.query.userProfiles.findFirst({
      where: eq(userProfiles.id, req.user.id)
    });
    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          status: user.status,
          mfaEnabled: user.mfaEnabled,
          avatarUrl: user.avatarUrl
        },
        aal: req.user.aal
      }
    });
  } catch (err) {
    next(err);
  }
});
authRouter.post("/logout", authenticate, (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully"
  });
});

// apps/api/src/http/routes/mfa.ts
import { Router as Router3 } from "express";
import { z as z3 } from "zod";
import qrcode from "qrcode";
import { db as db3, userProfiles as userProfiles2 } from "@avenquis/database";
import { eq as eq2 } from "drizzle-orm";
var mfaRouter = Router3();
mfaRouter.post("/setup", authenticate, async (req, res, next) => {
  try {
    const user = await db3.query.userProfiles.findFirst({
      where: eq2(userProfiles2.id, req.user.id)
    });
    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }
    const { secret, otpauthUrl } = AuthService.generateMfaSecret(user.email);
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
    await db3.update(userProfiles2).set({ mfaSecret: secret, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(userProfiles2.id, user.id));
    res.json({
      success: true,
      data: {
        secret,
        qrCode: qrCodeDataUrl
      }
    });
  } catch (err) {
    next(err);
  }
});
mfaRouter.post("/verify", authenticate, async (req, res, next) => {
  try {
    const verifySchema = z3.object({
      token: z3.string().min(6).max(6)
    });
    const parseResult = verifySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(400, "Invalid MFA token", "VALIDATION_ERROR");
    }
    const user = await db3.query.userProfiles.findFirst({
      where: eq2(userProfiles2.id, req.user.id)
    });
    if (!user || !user.mfaSecret) {
      throw new ApiError(
        400,
        "MFA setup has not been initiated",
        "MFA_NOT_INITIATED"
      );
    }
    const isValid = AuthService.verifyMfaToken(
      parseResult.data.token,
      user.mfaSecret
    );
    if (!isValid) {
      throw new ApiError(
        400,
        "Invalid TOTP verification code",
        "INVALID_MFA_CODE"
      );
    }
    const backupCodes = AuthService.generateBackupCodes(8);
    await db3.update(userProfiles2).set({
      mfaEnabled: true,
      mfaBackupCodes: backupCodes,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(userProfiles2.id, user.id));
    const tokens = AuthService.generateTokens({
      userId: user.id,
      email: user.email,
      aal: "aal2"
    });
    await AuditService.logSecurityEvent({
      eventType: "MFA_ENROLLED",
      severity: "info",
      details: { userId: user.id },
      ipAddress: req.ip
    });
    res.json({
      success: true,
      data: {
        message: "MFA successfully enabled",
        backupCodes,
        tokens
      }
    });
  } catch (err) {
    next(err);
  }
});
mfaRouter.post("/challenge", authenticate, async (req, res, next) => {
  try {
    const challengeSchema = z3.object({
      token: z3.string().min(6)
    });
    const parseResult = challengeSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(400, "Invalid MFA token format", "VALIDATION_ERROR");
    }
    const user = await db3.query.userProfiles.findFirst({
      where: eq2(userProfiles2.id, req.user.id)
    });
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new ApiError(
        400,
        "MFA is not enabled for this account",
        "MFA_NOT_ENABLED"
      );
    }
    let isValid = AuthService.verifyMfaToken(
      parseResult.data.token,
      user.mfaSecret
    );
    if (!isValid && Array.isArray(user.mfaBackupCodes)) {
      const backupIndex = user.mfaBackupCodes.indexOf(
        parseResult.data.token.toUpperCase()
      );
      if (backupIndex !== -1) {
        isValid = true;
        const updatedBackupCodes = [...user.mfaBackupCodes];
        updatedBackupCodes.splice(backupIndex, 1);
        await db3.update(userProfiles2).set({ mfaBackupCodes: updatedBackupCodes }).where(eq2(userProfiles2.id, user.id));
      }
    }
    if (!isValid) {
      await AuditService.logSecurityEvent({
        eventType: "FAILED_MFA_CHALLENGE",
        severity: "warning",
        details: { userId: user.id, ipAddress: req.ip },
        ipAddress: req.ip
      });
      throw new ApiError(
        401,
        "Invalid MFA code or backup code",
        "INVALID_MFA_CODE"
      );
    }
    const tokens = AuthService.generateTokens({
      userId: user.id,
      email: user.email,
      aal: "aal2"
    });
    await AuditService.logSecurityEvent({
      eventType: "SUCCESSFUL_MFA_CHALLENGE",
      severity: "info",
      details: { userId: user.id, aal: "aal2" },
      ipAddress: req.ip
    });
    res.json({
      success: true,
      data: {
        message: "MFA challenge verified successfully",
        tokens
      }
    });
  } catch (err) {
    next(err);
  }
});

// apps/api/src/http/routes/tenants.ts
import { Router as Router4 } from "express";
import { z as z4 } from "zod";

// apps/api/src/services/tenant.service.ts
import {
  db as db4,
  tenants,
  memberships,
  roles,
  membershipRoles
} from "@avenquis/database";
import { eq as eq3, and, lte, or, isNull, gt } from "drizzle-orm";
var TenantService = class {
  static async getUserMemberships(userId) {
    return db4.select({
      membershipId: memberships.id,
      tenantId: memberships.tenantId,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
      status: memberships.status,
      startAt: memberships.startAt,
      expiresAt: memberships.expiresAt
    }).from(memberships).innerJoin(tenants, eq3(memberships.tenantId, tenants.id)).where(
      and(
        eq3(memberships.userId, userId),
        eq3(memberships.status, "active"),
        eq3(tenants.status, "active"),
        lte(memberships.startAt, /* @__PURE__ */ new Date()),
        or(
          isNull(memberships.expiresAt),
          gt(memberships.expiresAt, /* @__PURE__ */ new Date())
        )
      )
    );
  }
  static async validateTenantMembership(userId, tenantId) {
    const membership = await db4.query.memberships.findFirst({
      where: and(
        eq3(memberships.userId, userId),
        eq3(memberships.tenantId, tenantId)
      )
    });
    if (!membership) {
      throw new ApiError(
        403,
        "Access denied: Not a member of this tenant",
        "TENANT_MEMBERSHIP_NOT_FOUND"
      );
    }
    if (membership.status !== "active") {
      throw new ApiError(
        403,
        `Access denied: Membership status is ${membership.status}`,
        "MEMBERSHIP_INACTIVE"
      );
    }
    const now = /* @__PURE__ */ new Date();
    if (membership.startAt && new Date(membership.startAt) > now) {
      throw new ApiError(
        403,
        "Access denied: Membership has not started yet",
        "MEMBERSHIP_NOT_STARTED"
      );
    }
    if (membership.expiresAt && new Date(membership.expiresAt) <= now) {
      throw new ApiError(
        403,
        "Access denied: Membership has expired",
        "MEMBERSHIP_EXPIRED"
      );
    }
    const tenant = await db4.query.tenants.findFirst({
      where: eq3(tenants.id, tenantId)
    });
    if (!tenant || tenant.status !== "active") {
      throw new ApiError(
        403,
        "Access denied: Tenant is disabled or suspended",
        "TENANT_INACTIVE"
      );
    }
    return { membership, tenant };
  }
  static async createTenant(params) {
    return db4.transaction(async (tx) => {
      const [newTenant] = await tx.insert(tenants).values({
        name: params.name,
        slug: params.slug,
        status: "active"
      }).returning();
      const [membership] = await tx.insert(memberships).values({
        tenantId: newTenant.id,
        userId: params.ownerUserId,
        status: "active"
      }).returning();
      let adminRole = await tx.query.roles.findFirst({
        where: and(eq3(roles.tenantId, newTenant.id), eq3(roles.code, "admin"))
      });
      if (!adminRole) {
        const [createdRole] = await tx.insert(roles).values({
          tenantId: newTenant.id,
          code: "admin",
          name: "Tenant Administrator",
          description: "Full administrative access to the tenant",
          isSystem: true
        }).returning();
        adminRole = createdRole;
      }
      await tx.insert(membershipRoles).values({
        membershipId: membership.id,
        roleId: adminRole.id
      });
      return { tenant: newTenant, membership };
    });
  }
};

// apps/api/src/services/permission.service.ts
import {
  db as db5,
  membershipRoles as membershipRoles2,
  rolePermissions,
  permissions,
  roles as roles2
} from "@avenquis/database";
import { eq as eq4, inArray } from "drizzle-orm";
var PermissionService = class {
  static async getMembershipPermissions(membershipId) {
    const assignedRoles = await db5.select({ roleId: membershipRoles2.roleId }).from(membershipRoles2).where(eq4(membershipRoles2.membershipId, membershipId));
    if (assignedRoles.length === 0) {
      return [];
    }
    const roleIds = assignedRoles.map((r) => r.roleId);
    const roleDetails = await db5.select({ code: roles2.code }).from(roles2).where(inArray(roles2.id, roleIds));
    if (roleDetails.some(
      (r) => r.code === "admin" || r.code === "owner" || r.code === "system_admin"
    )) {
      return ["*"];
    }
    const perms = await db5.select({ code: permissions.code }).from(rolePermissions).innerJoin(permissions, eq4(rolePermissions.permissionId, permissions.id)).where(inArray(rolePermissions.roleId, roleIds));
    return Array.from(new Set(perms.map((p) => p.code)));
  }
  static hasPermission(userPermissions, requiredPermission) {
    if (userPermissions.includes("*")) {
      return true;
    }
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }
    const [scope] = requiredPermission.split(":");
    if (scope && userPermissions.includes(`${scope}:*`)) {
      return true;
    }
    return false;
  }
};

// apps/api/src/http/middlewares/tenant-context.ts
async function requireTenantContext(req, res, next) {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required", "UNAUTHORIZED"));
  }
  const tenantId = req.headers["x-tenant-id"] || req.params.tenantId || req.query.tenantId;
  if (!tenantId) {
    return next(
      new ApiError(
        400,
        "Tenant context required: missing x-tenant-id header",
        "TENANT_HEADER_REQUIRED"
      )
    );
  }
  try {
    const { membership, tenant } = await TenantService.validateTenantMembership(
      req.user.id,
      tenantId
    );
    req.tenantId = tenant.id;
    req.tenant = tenant;
    req.membership = membership;
    req.permissions = await PermissionService.getMembershipPermissions(
      membership.id
    );
    return next();
  } catch (err) {
    AuditService.logSecurityEvent({
      eventType: "UNAUTHORIZED_TENANT_ACCESS_ATTEMPT",
      severity: "warning",
      details: {
        userId: req.user.id,
        targetTenantId: tenantId,
        ipAddress: req.ip
      },
      tenantId,
      ipAddress: req.ip
    });
    return next(err);
  }
}

// apps/api/src/http/middlewares/rbac.ts
function requirePermission(requiredPermission, options) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required", "UNAUTHORIZED"));
    }
    if (options?.requireAal2 && req.user.aal !== "aal2") {
      return next(
        new ApiError(
          403,
          "Multi-Factor Authentication (AAL2) required for this action",
          "MFA_REQUIRED"
        )
      );
    }
    const userPermissions = req.permissions || [];
    const allowed = PermissionService.hasPermission(
      userPermissions,
      requiredPermission
    );
    if (!allowed) {
      return next(
        new ApiError(
          403,
          `Forbidden: Missing required permission '${requiredPermission}'`,
          "FORBIDDEN"
        )
      );
    }
    return next();
  };
}

// apps/api/src/http/routes/tenants.ts
var tenantRouter = Router4();
var createTenantSchema = z4.object({
  name: z4.string().min(2, "Name must be at least 2 characters"),
  slug: z4.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
});
tenantRouter.get("/", authenticate, async (req, res, next) => {
  try {
    const list = await TenantService.getUserMemberships(req.user.id);
    res.json({
      success: true,
      data: list
    });
  } catch (err) {
    next(err);
  }
});
tenantRouter.post("/", authenticate, async (req, res, next) => {
  try {
    const parseResult = createTenantSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(
        400,
        "Validation failed",
        "VALIDATION_ERROR",
        parseResult.error.format()
      );
    }
    const { name, slug } = parseResult.data;
    const result = await TenantService.createTenant({
      name,
      slug,
      ownerUserId: req.user.id
    });
    await AuditService.logActivity({
      tenantId: result.tenant.id,
      membershipId: result.membership.id,
      action: "CREATE_TENANT",
      resourceType: "tenant",
      resourceId: result.tenant.id,
      metadata: { name, slug },
      ipAddress: req.ip
    });
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});
tenantRouter.post("/switch", authenticate, async (req, res, next) => {
  try {
    const switchSchema = z4.object({
      tenantId: z4.string().uuid("Invalid tenant ID format")
    });
    const parseResult = switchSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(
        400,
        "Validation failed",
        "VALIDATION_ERROR",
        parseResult.error.format()
      );
    }
    const { tenantId } = parseResult.data;
    const { membership, tenant } = await TenantService.validateTenantMembership(
      req.user.id,
      tenantId
    );
    await AuditService.logActivity({
      tenantId: tenant.id,
      membershipId: membership.id,
      action: "TENANT_SWITCH",
      resourceType: "tenant",
      resourceId: tenant.id,
      ipAddress: req.ip
    });
    res.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status
        },
        membership: {
          id: membership.id,
          status: membership.status
        }
      }
    });
  } catch (err) {
    next(err);
  }
});
tenantRouter.get(
  "/current",
  authenticate,
  requireTenantContext,
  async (req, res) => {
    res.json({
      success: true,
      data: {
        tenant: req.tenant,
        membership: req.membership,
        permissions: req.permissions
      }
    });
  }
);
tenantRouter.get(
  "/admin-test",
  authenticate,
  requireTenantContext,
  requirePermission("admin:manage", { requireAal2: true }),
  async (req, res) => {
    res.json({
      success: true,
      message: "Admin access granted with MFA verified",
      tenantId: req.tenantId
    });
  }
);

// apps/api/src/http/routes/departments.ts
import { Router as Router5 } from "express";
import { z as z5 } from "zod";

// apps/api/src/services/staff.service.ts
import {
  db as db6,
  departments,
  designations,
  staffProfiles,
  staffLifecycleEvents,
  memberships as memberships2,
  userProfiles as userProfiles3
} from "@avenquis/database";
import { eq as eq5, and as and2, desc, ilike, or as or2 } from "drizzle-orm";
var StaffService = class {
  // --- Departments ---
  static async listDepartments(tenantId) {
    return db6.select().from(departments).where(eq5(departments.tenantId, tenantId)).orderBy(departments.name);
  }
  static async createDepartment(tenantId, data) {
    const existing = await db6.query.departments.findFirst({
      where: and2(
        eq5(departments.tenantId, tenantId),
        eq5(departments.code, data.code.toUpperCase())
      )
    });
    if (existing) {
      throw new ApiError(
        409,
        "Department with this code already exists in this tenant",
        "DEPARTMENT_EXISTS"
      );
    }
    const [dept] = await db6.insert(departments).values({
      tenantId,
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description,
      headMembershipId: data.headMembershipId
    }).returning();
    return dept;
  }
  // --- Designations ---
  static async listDesignations(tenantId) {
    return db6.select().from(designations).where(eq5(designations.tenantId, tenantId)).orderBy(desc(designations.level), designations.name);
  }
  static async createDesignation(tenantId, data) {
    const existing = await db6.query.designations.findFirst({
      where: and2(
        eq5(designations.tenantId, tenantId),
        eq5(designations.code, data.code.toUpperCase())
      )
    });
    if (existing) {
      throw new ApiError(
        409,
        "Designation with this code already exists in this tenant",
        "DESIGNATION_EXISTS"
      );
    }
    const [desig] = await db6.insert(designations).values({
      tenantId,
      name: data.name,
      code: data.code.toUpperCase(),
      level: data.level ?? 1,
      description: data.description
    }).returning();
    return desig;
  }
  // --- Staff Profiles ---
  static async listStaff(tenantId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [eq5(staffProfiles.tenantId, tenantId)];
    if (options?.departmentId) {
      conditions.push(eq5(staffProfiles.departmentId, options.departmentId));
    }
    if (options?.designationId) {
      conditions.push(eq5(staffProfiles.designationId, options.designationId));
    }
    if (options?.status) {
      conditions.push(eq5(staffProfiles.status, options.status));
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      conditions.push(
        or2(
          ilike(staffProfiles.employeeCode, searchPattern),
          ilike(userProfiles3.fullName, searchPattern),
          ilike(userProfiles3.email, searchPattern)
        )
      );
    }
    const rows = await db6.select({
      id: staffProfiles.id,
      tenantId: staffProfiles.tenantId,
      membershipId: staffProfiles.membershipId,
      employeeCode: staffProfiles.employeeCode,
      departmentId: staffProfiles.departmentId,
      departmentName: departments.name,
      designationId: staffProfiles.designationId,
      designationName: designations.name,
      employmentType: staffProfiles.employmentType,
      status: staffProfiles.status,
      joiningDate: staffProfiles.joiningDate,
      exitDate: staffProfiles.exitDate,
      phone: staffProfiles.phone,
      emergencyContact: staffProfiles.emergencyContact,
      bio: staffProfiles.bio,
      fullName: userProfiles3.fullName,
      email: userProfiles3.email,
      avatarUrl: userProfiles3.avatarUrl,
      createdAt: staffProfiles.createdAt
    }).from(staffProfiles).innerJoin(memberships2, eq5(staffProfiles.membershipId, memberships2.id)).innerJoin(userProfiles3, eq5(memberships2.userId, userProfiles3.id)).leftJoin(departments, eq5(staffProfiles.departmentId, departments.id)).leftJoin(designations, eq5(staffProfiles.designationId, designations.id)).where(and2(...conditions)).limit(limit).offset(offset).orderBy(staffProfiles.employeeCode);
    return rows;
  }
  static async getStaffById(tenantId, staffId) {
    const [staff] = await db6.select({
      id: staffProfiles.id,
      tenantId: staffProfiles.tenantId,
      membershipId: staffProfiles.membershipId,
      employeeCode: staffProfiles.employeeCode,
      departmentId: staffProfiles.departmentId,
      departmentName: departments.name,
      designationId: staffProfiles.designationId,
      designationName: designations.name,
      employmentType: staffProfiles.employmentType,
      status: staffProfiles.status,
      joiningDate: staffProfiles.joiningDate,
      exitDate: staffProfiles.exitDate,
      phone: staffProfiles.phone,
      emergencyContact: staffProfiles.emergencyContact,
      address: staffProfiles.address,
      bio: staffProfiles.bio,
      fullName: userProfiles3.fullName,
      email: userProfiles3.email,
      avatarUrl: userProfiles3.avatarUrl,
      createdAt: staffProfiles.createdAt,
      updatedAt: staffProfiles.updatedAt
    }).from(staffProfiles).innerJoin(memberships2, eq5(staffProfiles.membershipId, memberships2.id)).innerJoin(userProfiles3, eq5(memberships2.userId, userProfiles3.id)).leftJoin(departments, eq5(staffProfiles.departmentId, departments.id)).leftJoin(designations, eq5(staffProfiles.designationId, designations.id)).where(
      and2(
        eq5(staffProfiles.tenantId, tenantId),
        eq5(staffProfiles.id, staffId)
      )
    );
    if (!staff) {
      throw new ApiError(404, "Staff profile not found", "STAFF_NOT_FOUND");
    }
    const history = await db6.select().from(staffLifecycleEvents).where(
      and2(
        eq5(staffLifecycleEvents.tenantId, tenantId),
        eq5(staffLifecycleEvents.staffId, staffId)
      )
    ).orderBy(desc(staffLifecycleEvents.effectiveDate));
    return { ...staff, lifecycleHistory: history };
  }
  static async createStaff(tenantId, data) {
    return db6.transaction(async (tx) => {
      const existingCode = await tx.query.staffProfiles.findFirst({
        where: and2(
          eq5(staffProfiles.tenantId, tenantId),
          eq5(staffProfiles.employeeCode, data.employeeCode)
        )
      });
      if (existingCode) {
        throw new ApiError(
          409,
          `Employee code '${data.employeeCode}' is already in use in this tenant`,
          "EMPLOYEE_CODE_EXISTS"
        );
      }
      const [newStaff] = await tx.insert(staffProfiles).values({
        tenantId,
        membershipId: data.membershipId,
        employeeCode: data.employeeCode,
        departmentId: data.departmentId,
        designationId: data.designationId,
        employmentType: data.employmentType ?? "full_time",
        status: data.status ?? "active",
        joiningDate: data.joiningDate ?? /* @__PURE__ */ new Date(),
        phone: data.phone,
        emergencyContact: data.emergencyContact,
        bio: data.bio,
        address: data.address
      }).returning();
      await tx.insert(staffLifecycleEvents).values({
        tenantId,
        staffId: newStaff.id,
        eventType: "joined",
        effectiveDate: newStaff.joiningDate,
        remarks: "Initial staff onboarding and profile creation",
        performedByMembershipId: data.performedByMembershipId
      });
      return newStaff;
    });
  }
  static async updateStaff(tenantId, staffId, data) {
    const existing = await db6.query.staffProfiles.findFirst({
      where: and2(
        eq5(staffProfiles.tenantId, tenantId),
        eq5(staffProfiles.id, staffId)
      )
    });
    if (!existing) {
      throw new ApiError(404, "Staff profile not found", "STAFF_NOT_FOUND");
    }
    const [updated] = await db6.update(staffProfiles).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and2(
        eq5(staffProfiles.tenantId, tenantId),
        eq5(staffProfiles.id, staffId)
      )
    ).returning();
    return updated;
  }
  static async recordLifecycleEvent(tenantId, staffId, data) {
    return db6.transaction(async (tx) => {
      const staff = await tx.query.staffProfiles.findFirst({
        where: and2(
          eq5(staffProfiles.tenantId, tenantId),
          eq5(staffProfiles.id, staffId)
        )
      });
      if (!staff) {
        throw new ApiError(404, "Staff profile not found", "STAFF_NOT_FOUND");
      }
      const effectiveDate = data.effectiveDate ?? /* @__PURE__ */ new Date();
      const [event] = await tx.insert(staffLifecycleEvents).values({
        tenantId,
        staffId,
        eventType: data.eventType,
        effectiveDate,
        remarks: data.remarks,
        metadata: {
          ...data.metadata,
          previousStatus: staff.status,
          previousDepartmentId: staff.departmentId,
          previousDesignationId: staff.designationId
        },
        performedByMembershipId: data.performedByMembershipId
      }).returning();
      const updates = { updatedAt: /* @__PURE__ */ new Date() };
      if (data.newStatus) {
        updates.status = data.newStatus;
        if (data.newStatus === "exited" || data.eventType === "resigned" || data.eventType === "terminated") {
          updates.exitDate = effectiveDate;
        }
      }
      if (data.newDepartmentId !== void 0) {
        updates.departmentId = data.newDepartmentId;
      }
      if (data.newDesignationId !== void 0) {
        updates.designationId = data.newDesignationId;
      }
      await tx.update(staffProfiles).set(updates).where(
        and2(
          eq5(staffProfiles.tenantId, tenantId),
          eq5(staffProfiles.id, staffId)
        )
      );
      return event;
    });
  }
};

// apps/api/src/http/routes/departments.ts
var departmentRouter = Router5();
var createDeptSchema = z5.object({
  name: z5.string().min(2, "Department name must be at least 2 characters"),
  code: z5.string().min(2, "Department code must be at least 2 characters").regex(/^[a-zA-Z0-9_-]+$/, "Department code must be alphanumeric"),
  description: z5.string().optional(),
  headMembershipId: z5.string().uuid().optional()
});
departmentRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("staff:read"),
  async (req, res, next) => {
    try {
      const depts = await StaffService.listDepartments(req.tenantId);
      res.json({
        success: true,
        data: depts
      });
    } catch (err) {
      next(err);
    }
  }
);
departmentRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("departments:manage"),
  async (req, res, next) => {
    try {
      const parseResult = createDeptSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Validation failed",
          "VALIDATION_ERROR",
          parseResult.error.format()
        );
      }
      const dept = await StaffService.createDepartment(
        req.tenantId,
        parseResult.data
      );
      await AuditService.logActivity({
        tenantId: req.tenantId,
        membershipId: req.membership.id,
        action: "CREATE_DEPARTMENT",
        resourceType: "department",
        resourceId: dept.id,
        metadata: { name: dept.name, code: dept.code },
        ipAddress: req.ip
      });
      res.status(201).json({
        success: true,
        data: dept
      });
    } catch (err) {
      next(err);
    }
  }
);

// apps/api/src/http/routes/designations.ts
import { Router as Router6 } from "express";
import { z as z6 } from "zod";
var designationRouter = Router6();
var createDesigSchema = z6.object({
  name: z6.string().min(2, "Designation name must be at least 2 characters"),
  code: z6.string().min(2, "Designation code must be at least 2 characters").regex(/^[a-zA-Z0-9_-]+$/, "Designation code must be alphanumeric"),
  level: z6.number().int().min(1).default(1),
  description: z6.string().optional()
});
designationRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("staff:read"),
  async (req, res, next) => {
    try {
      const desigs = await StaffService.listDesignations(req.tenantId);
      res.json({
        success: true,
        data: desigs
      });
    } catch (err) {
      next(err);
    }
  }
);
designationRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("designations:manage"),
  async (req, res, next) => {
    try {
      const parseResult = createDesigSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Validation failed",
          "VALIDATION_ERROR",
          parseResult.error.format()
        );
      }
      const desig = await StaffService.createDesignation(
        req.tenantId,
        parseResult.data
      );
      await AuditService.logActivity({
        tenantId: req.tenantId,
        membershipId: req.membership.id,
        action: "CREATE_DESIGNATION",
        resourceType: "designation",
        resourceId: desig.id,
        metadata: { name: desig.name, code: desig.code, level: desig.level },
        ipAddress: req.ip
      });
      res.status(201).json({
        success: true,
        data: desig
      });
    } catch (err) {
      next(err);
    }
  }
);

// apps/api/src/http/routes/staff.ts
import { Router as Router7 } from "express";
import { z as z7 } from "zod";
var staffRouter = Router7();
var createStaffSchema = z7.object({
  membershipId: z7.string().uuid("Invalid membership ID"),
  employeeCode: z7.string().min(1, "Employee code is required").regex(/^[a-zA-Z0-9_-]+$/, "Employee code must be alphanumeric"),
  departmentId: z7.string().uuid().optional(),
  designationId: z7.string().uuid().optional(),
  employmentType: z7.enum(["full_time", "part_time", "contract", "intern"]).default("full_time"),
  status: z7.enum(["active", "probation", "notice_period", "exited", "suspended"]).default("active"),
  joiningDate: z7.string().datetime().or(z7.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().transform((val) => val ? new Date(val) : void 0),
  phone: z7.string().optional(),
  emergencyContact: z7.record(z7.string(), z7.unknown()).optional(),
  bio: z7.string().optional(),
  address: z7.record(z7.string(), z7.unknown()).optional()
});
var updateStaffSchema = z7.object({
  departmentId: z7.string().uuid().nullable().optional(),
  designationId: z7.string().uuid().nullable().optional(),
  employmentType: z7.enum(["full_time", "part_time", "contract", "intern"]).optional(),
  status: z7.enum(["active", "probation", "notice_period", "exited", "suspended"]).optional(),
  phone: z7.string().optional(),
  emergencyContact: z7.record(z7.string(), z7.unknown()).optional(),
  bio: z7.string().optional(),
  address: z7.record(z7.string(), z7.unknown()).optional()
});
var lifecycleEventSchema = z7.object({
  eventType: z7.enum([
    "joined",
    "probation_cleared",
    "promoted",
    "transferred",
    "resigned",
    "terminated",
    "suspended",
    "reinstated"
  ]),
  effectiveDate: z7.string().datetime().or(z7.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().transform((val) => val ? new Date(val) : void 0),
  remarks: z7.string().optional(),
  metadata: z7.record(z7.string(), z7.unknown()).optional(),
  newStatus: z7.enum(["active", "probation", "notice_period", "exited", "suspended"]).optional(),
  newDepartmentId: z7.string().uuid().optional(),
  newDesignationId: z7.string().uuid().optional()
});
staffRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("staff:read"),
  async (req, res, next) => {
    try {
      const { departmentId, designationId, status, search, limit, offset } = req.query;
      const staffList = await StaffService.listStaff(req.tenantId, {
        departmentId,
        designationId,
        status,
        search,
        limit: limit ? parseInt(limit, 10) : void 0,
        offset: offset ? parseInt(offset, 10) : void 0
      });
      res.json({
        success: true,
        data: staffList
      });
    } catch (err) {
      next(err);
    }
  }
);
staffRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("staff:create"),
  async (req, res, next) => {
    try {
      const parseResult = createStaffSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "VALIDATION_ERROR",
          parseResult.error.format()
        );
      }
      const staff = await StaffService.createStaff(req.tenantId, {
        ...parseResult.data,
        performedByMembershipId: req.membership.id
      });
      await AuditService.logActivity({
        tenantId: req.tenantId,
        membershipId: req.membership.id,
        action: "CREATE_STAFF_PROFILE",
        resourceType: "staff_profile",
        resourceId: staff.id,
        metadata: {
          employeeCode: staff.employeeCode,
          membershipId: staff.membershipId
        },
        ipAddress: req.ip
      });
      res.status(201).json({
        success: true,
        data: staff
      });
    } catch (err) {
      next(err);
    }
  }
);
staffRouter.get(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("staff:read"),
  async (req, res, next) => {
    try {
      const staff = await StaffService.getStaffById(
        req.tenantId,
        req.params.id
      );
      res.json({
        success: true,
        data: staff
      });
    } catch (err) {
      next(err);
    }
  }
);
staffRouter.patch(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("staff:update"),
  async (req, res, next) => {
    try {
      const parseResult = updateStaffSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "VALIDATION_ERROR",
          parseResult.error.format()
        );
      }
      const updated = await StaffService.updateStaff(
        req.tenantId,
        req.params.id,
        parseResult.data
      );
      await AuditService.logActivity({
        tenantId: req.tenantId,
        membershipId: req.membership.id,
        action: "UPDATE_STAFF_PROFILE",
        resourceType: "staff_profile",
        resourceId: updated.id,
        ipAddress: req.ip
      });
      res.json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
);
staffRouter.post(
  "/:id/lifecycle",
  authenticate,
  requireTenantContext,
  requirePermission("staff:manage_lifecycle"),
  async (req, res, next) => {
    try {
      const parseResult = lifecycleEventSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Validation failed",
          "VALIDATION_ERROR",
          parseResult.error.format()
        );
      }
      const event = await StaffService.recordLifecycleEvent(
        req.tenantId,
        req.params.id,
        {
          ...parseResult.data,
          performedByMembershipId: req.membership.id
        }
      );
      await AuditService.logActivity({
        tenantId: req.tenantId,
        membershipId: req.membership.id,
        action: `STAFF_LIFECYCLE_${parseResult.data.eventType.toUpperCase()}`,
        resourceType: "staff_lifecycle_event",
        resourceId: event.id,
        metadata: {
          staffId: req.params.id,
          eventType: parseResult.data.eventType,
          remarks: parseResult.data.remarks
        },
        ipAddress: req.ip
      });
      res.status(201).json({
        success: true,
        data: event
      });
    } catch (err) {
      next(err);
    }
  }
);

// apps/api/src/http/routes/students.ts
import { Router as Router8 } from "express";
import { z as z8 } from "zod";

// apps/api/src/services/student.service.ts
import {
  db as db7,
  studentProfiles,
  studentTrainingRecords,
  studentLeaveRecords,
  studentExamRecords,
  studentAssignmentHistory,
  memberships as memberships3,
  userProfiles as userProfiles4
} from "@avenquis/database";
import { eq as eq6, and as and3, desc as desc2, ilike as ilike2, or as or3 } from "drizzle-orm";
var StudentService = class {
  static async listStudents(tenantId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [eq6(studentProfiles.tenantId, tenantId)];
    if (options?.status) {
      conditions.push(eq6(studentProfiles.status, options.status));
    }
    if (options?.courseLevel) {
      conditions.push(eq6(studentProfiles.courseLevel, options.courseLevel));
    }
    if (options?.principalMembershipId) {
      conditions.push(
        eq6(
          studentProfiles.principalMembershipId,
          options.principalMembershipId
        )
      );
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      conditions.push(
        or3(
          ilike2(studentProfiles.registrationNumber, searchPattern),
          ilike2(userProfiles4.fullName, searchPattern),
          ilike2(userProfiles4.email, searchPattern)
        )
      );
    }
    const rows = await db7.select({
      id: studentProfiles.id,
      tenantId: studentProfiles.tenantId,
      membershipId: studentProfiles.membershipId,
      registrationNumber: studentProfiles.registrationNumber,
      principalMembershipId: studentProfiles.principalMembershipId,
      courseLevel: studentProfiles.courseLevel,
      articleshipStartDate: studentProfiles.articleshipStartDate,
      articleshipEndDate: studentProfiles.articleshipEndDate,
      status: studentProfiles.status,
      fullName: userProfiles4.fullName,
      email: userProfiles4.email,
      avatarUrl: userProfiles4.avatarUrl,
      createdAt: studentProfiles.createdAt
    }).from(studentProfiles).innerJoin(memberships3, eq6(studentProfiles.membershipId, memberships3.id)).innerJoin(userProfiles4, eq6(memberships3.userId, userProfiles4.id)).where(and3(...conditions)).limit(limit).offset(offset).orderBy(studentProfiles.registrationNumber);
    return rows;
  }
  static async getStudentById(tenantId, studentId) {
    const [student] = await db7.select({
      id: studentProfiles.id,
      tenantId: studentProfiles.tenantId,
      membershipId: studentProfiles.membershipId,
      registrationNumber: studentProfiles.registrationNumber,
      principalMembershipId: studentProfiles.principalMembershipId,
      courseLevel: studentProfiles.courseLevel,
      articleshipStartDate: studentProfiles.articleshipStartDate,
      articleshipEndDate: studentProfiles.articleshipEndDate,
      status: studentProfiles.status,
      emergencyContact: studentProfiles.emergencyContact,
      address: studentProfiles.address,
      fullName: userProfiles4.fullName,
      email: userProfiles4.email,
      avatarUrl: userProfiles4.avatarUrl,
      createdAt: studentProfiles.createdAt,
      updatedAt: studentProfiles.updatedAt
    }).from(studentProfiles).innerJoin(memberships3, eq6(studentProfiles.membershipId, memberships3.id)).innerJoin(userProfiles4, eq6(memberships3.userId, userProfiles4.id)).where(
      and3(
        eq6(studentProfiles.tenantId, tenantId),
        eq6(studentProfiles.id, studentId)
      )
    );
    if (!student) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }
    const trainingRecords = await db7.select().from(studentTrainingRecords).where(
      and3(
        eq6(studentTrainingRecords.tenantId, tenantId),
        eq6(studentTrainingRecords.studentId, studentId)
      )
    ).orderBy(desc2(studentTrainingRecords.createdAt));
    const leaveRecords = await db7.select().from(studentLeaveRecords).where(
      and3(
        eq6(studentLeaveRecords.tenantId, tenantId),
        eq6(studentLeaveRecords.studentId, studentId)
      )
    ).orderBy(desc2(studentLeaveRecords.startDate));
    const examRecords = await db7.select().from(studentExamRecords).where(
      and3(
        eq6(studentExamRecords.tenantId, tenantId),
        eq6(studentExamRecords.studentId, studentId)
      )
    ).orderBy(desc2(studentExamRecords.createdAt));
    const assignmentHistory = await db7.select().from(studentAssignmentHistory).where(
      and3(
        eq6(studentAssignmentHistory.tenantId, tenantId),
        eq6(studentAssignmentHistory.studentId, studentId)
      )
    ).orderBy(desc2(studentAssignmentHistory.startDate));
    return {
      ...student,
      trainingRecords,
      leaveRecords,
      examRecords,
      assignmentHistory
    };
  }
  static async getStudentDashboard(tenantId, studentId) {
    const student = await this.getStudentById(tenantId, studentId);
    const now = /* @__PURE__ */ new Date();
    const startDate = new Date(student.articleshipStartDate);
    const endDate = student.articleshipEndDate ? new Date(student.articleshipEndDate) : new Date(startDate.getTime() + 3 * 365 * 24 * 60 * 60 * 1e3);
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24)
    );
    const completedDays = Math.max(
      0,
      Math.ceil((now.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24))
    );
    const remainingDays = Math.max(0, totalDays - completedDays);
    const totalTrainingHours = student.trainingRecords.reduce(
      (sum2, r) => sum2 + r.hoursCompleted,
      0
    );
    const verifiedTrainingHours = student.trainingRecords.filter((r) => r.verifiedAt !== null).reduce((sum2, r) => sum2 + r.hoursCompleted, 0);
    const approvedLeaveDays = student.leaveRecords.filter((r) => r.status === "approved").reduce((sum2, r) => sum2 + r.totalDays, 0);
    const pendingLeaveDays = student.leaveRecords.filter((r) => r.status === "pending").reduce((sum2, r) => sum2 + r.totalDays, 0);
    const examsPassed = student.examRecords.filter(
      (r) => r.resultStatus === "passed"
    ).length;
    const examsFailed = student.examRecords.filter(
      (r) => r.resultStatus === "jailed"
    ).length;
    return {
      studentId: student.id,
      registrationNumber: student.registrationNumber,
      courseLevel: student.courseLevel,
      status: student.status,
      articleship: {
        startDate,
        endDate,
        totalDays,
        completedDays,
        remainingDays
      },
      training: {
        totalHours: totalTrainingHours,
        verifiedHours: verifiedTrainingHours
      },
      leaves: {
        approvedDays: approvedLeaveDays,
        pendingDays: pendingLeaveDays
      },
      exams: {
        passed: examsPassed,
        failed: examsFailed,
        totalAppeared: student.examRecords.length
      }
    };
  }
  static async createStudent(tenantId, data) {
    const existing = await db7.query.studentProfiles.findFirst({
      where: and3(
        eq6(studentProfiles.tenantId, tenantId),
        eq6(studentProfiles.registrationNumber, data.registrationNumber)
      )
    });
    if (existing) {
      throw new ApiError(
        409,
        `Student registration number '${data.registrationNumber}' already exists in this tenant`,
        "REGISTRATION_NUMBER_EXISTS"
      );
    }
    const [newStudent] = await db7.insert(studentProfiles).values({
      tenantId,
      membershipId: data.membershipId,
      registrationNumber: data.registrationNumber,
      principalMembershipId: data.principalMembershipId,
      courseLevel: data.courseLevel ?? "knowledge",
      articleshipStartDate: data.articleshipStartDate ?? /* @__PURE__ */ new Date(),
      articleshipEndDate: data.articleshipEndDate,
      status: data.status ?? "active",
      emergencyContact: data.emergencyContact,
      address: data.address
    }).returning();
    return newStudent;
  }
  static async updateStudent(tenantId, studentId, data) {
    const existing = await db7.query.studentProfiles.findFirst({
      where: and3(
        eq6(studentProfiles.tenantId, tenantId),
        eq6(studentProfiles.id, studentId)
      )
    });
    if (!existing) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }
    const [updated] = await db7.update(studentProfiles).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and3(
        eq6(studentProfiles.tenantId, tenantId),
        eq6(studentProfiles.id, studentId)
      )
    ).returning();
    return updated;
  }
  static async logTraining(tenantId, studentId, data) {
    const student = await db7.query.studentProfiles.findFirst({
      where: and3(
        eq6(studentProfiles.tenantId, tenantId),
        eq6(studentProfiles.id, studentId)
      )
    });
    if (!student) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }
    const [record] = await db7.insert(studentTrainingRecords).values({
      tenantId,
      studentId,
      topic: data.topic,
      hoursCompleted: data.hoursCompleted,
      supervisorMembershipId: data.supervisorMembershipId,
      remarks: data.remarks,
      verifiedAt: data.verifyNow ? /* @__PURE__ */ new Date() : null
    }).returning();
    return record;
  }
  static async applyLeave(tenantId, studentId, data) {
    const student = await db7.query.studentProfiles.findFirst({
      where: and3(
        eq6(studentProfiles.tenantId, tenantId),
        eq6(studentProfiles.id, studentId)
      )
    });
    if (!student) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }
    const [leave] = await db7.insert(studentLeaveRecords).values({
      tenantId,
      studentId,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays: data.totalDays,
      status: "pending",
      remarks: data.remarks
    }).returning();
    return leave;
  }
  static async updateLeaveStatus(tenantId, leaveId, data) {
    const existing = await db7.query.studentLeaveRecords.findFirst({
      where: and3(
        eq6(studentLeaveRecords.tenantId, tenantId),
        eq6(studentLeaveRecords.id, leaveId)
      )
    });
    if (!existing) {
      throw new ApiError(404, "Leave record not found", "LEAVE_NOT_FOUND");
    }
    const [updated] = await db7.update(studentLeaveRecords).set({
      status: data.status,
      approvedByMembershipId: data.approvedByMembershipId,
      remarks: data.remarks ?? existing.remarks,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and3(
        eq6(studentLeaveRecords.tenantId, tenantId),
        eq6(studentLeaveRecords.id, leaveId)
      )
    ).returning();
    return updated;
  }
  static async recordExamResult(tenantId, studentId, data) {
    const student = await db7.query.studentProfiles.findFirst({
      where: and3(
        eq6(studentProfiles.tenantId, tenantId),
        eq6(studentProfiles.id, studentId)
      )
    });
    if (!student) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }
    const [exam] = await db7.insert(studentExamRecords).values({
      tenantId,
      studentId,
      session: data.session,
      level: data.level,
      subject: data.subject,
      resultStatus: data.resultStatus,
      marks: data.marks,
      examDate: data.examDate
    }).returning();
    if (data.resultStatus === "passed" && data.level === "knowledge") {
      await db7.update(studentProfiles).set({ courseLevel: "application", updatedAt: /* @__PURE__ */ new Date() }).where(eq6(studentProfiles.id, studentId));
    }
    return exam;
  }
  static async logAssignment(tenantId, studentId, data) {
    const student = await db7.query.studentProfiles.findFirst({
      where: and3(
        eq6(studentProfiles.tenantId, tenantId),
        eq6(studentProfiles.id, studentId)
      )
    });
    if (!student) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }
    const [assignment] = await db7.insert(studentAssignmentHistory).values({
      tenantId,
      studentId,
      clientName: data.clientName,
      role: data.role,
      startDate: data.startDate,
      endDate: data.endDate,
      hoursLogged: data.hoursLogged ?? 0,
      remarks: data.remarks
    }).returning();
    return assignment;
  }
};

// apps/api/src/http/routes/students.ts
var studentRouter = Router8();
var createStudentSchema = z8.object({
  membershipId: z8.string().uuid(),
  registrationNumber: z8.string().min(2).max(100),
  principalMembershipId: z8.string().uuid().optional(),
  courseLevel: z8.enum(["knowledge", "application", "advanced"]).default("knowledge"),
  articleshipStartDate: z8.string().transform((val) => new Date(val)).optional(),
  articleshipEndDate: z8.string().transform((val) => new Date(val)).optional(),
  status: z8.enum(["active", "completed", "transferred", "suspended"]).default("active"),
  emergencyContact: z8.record(z8.string(), z8.unknown()).optional(),
  address: z8.record(z8.string(), z8.unknown()).optional()
});
var updateStudentSchema = z8.object({
  courseLevel: z8.enum(["knowledge", "application", "advanced"]).optional(),
  principalMembershipId: z8.string().uuid().nullable().optional(),
  articleshipEndDate: z8.string().transform((val) => new Date(val)).nullable().optional(),
  status: z8.enum(["active", "completed", "transferred", "suspended"]).optional(),
  emergencyContact: z8.record(z8.string(), z8.unknown()).optional(),
  address: z8.record(z8.string(), z8.unknown()).optional()
});
var logTrainingSchema = z8.object({
  topic: z8.string().min(2).max(255),
  hoursCompleted: z8.number().int().min(1),
  supervisorMembershipId: z8.string().uuid().optional(),
  remarks: z8.string().optional(),
  verifyNow: z8.boolean().optional()
});
var applyLeaveSchema = z8.object({
  leaveType: z8.enum(["study", "exam", "sick", "casual"]),
  startDate: z8.string().transform((val) => new Date(val)),
  endDate: z8.string().transform((val) => new Date(val)),
  totalDays: z8.number().int().min(1),
  remarks: z8.string().optional()
});
var updateLeaveStatusSchema = z8.object({
  status: z8.enum(["approved", "rejected"]),
  remarks: z8.string().optional()
});
var recordExamSchema = z8.object({
  session: z8.string().min(2).max(100),
  level: z8.enum(["knowledge", "application", "advanced"]),
  subject: z8.string().min(2).max(255),
  resultStatus: z8.enum(["passed", "failed", "appeared"]),
  marks: z8.number().int().min(0).max(100).optional(),
  examDate: z8.string().transform((val) => new Date(val)).optional()
});
var logAssignmentSchema = z8.object({
  clientName: z8.string().min(2).max(255),
  role: z8.string().min(2).max(100),
  startDate: z8.string().transform((val) => new Date(val)),
  endDate: z8.string().transform((val) => new Date(val)).optional(),
  hoursLogged: z8.number().int().min(0).optional(),
  remarks: z8.string().optional()
});
studentRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("students:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const {
        status,
        courseLevel,
        principalMembershipId,
        search,
        limit,
        offset
      } = req.query;
      const students = await StudentService.listStudents(tenantId, {
        status,
        courseLevel,
        principalMembershipId,
        search,
        limit: limit ? parseInt(limit, 10) : void 0,
        offset: offset ? parseInt(offset, 10) : void 0
      });
      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      next(error);
    }
  }
);
studentRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("students:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const parseResult = createStudentSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid student profile payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const student = await StudentService.createStudent(
        tenantId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: student
      });
    } catch (error) {
      next(error);
    }
  }
);
studentRouter.patch(
  "/leaves/:leaveId",
  authenticate,
  requireTenantContext,
  requirePermission("students:manage_leaves"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const leaveId = req.params.leaveId;
      const membershipId = req.membership.id;
      const parseResult = updateLeaveStatusSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid leave update payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const updated = await StudentService.updateLeaveStatus(
        tenantId,
        leaveId,
        {
          ...parseResult.data,
          approvedByMembershipId: membershipId
        }
      );
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
);
studentRouter.get(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("students:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const studentId = req.params.id;
      const student = await StudentService.getStudentById(tenantId, studentId);
      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      next(error);
    }
  }
);
studentRouter.get(
  "/:id/dashboard",
  authenticate,
  requireTenantContext,
  requirePermission("students:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const studentId = req.params.id;
      const dashboard = await StudentService.getStudentDashboard(
        tenantId,
        studentId
      );
      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      next(error);
    }
  }
);
studentRouter.patch(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("students:update"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const studentId = req.params.id;
      const parseResult = updateStudentSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid student update payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const updated = await StudentService.updateStudent(
        tenantId,
        studentId,
        parseResult.data
      );
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
);
studentRouter.post(
  "/:id/training",
  authenticate,
  requireTenantContext,
  requirePermission("students:update"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const studentId = req.params.id;
      const parseResult = logTrainingSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid training record payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const record = await StudentService.logTraining(
        tenantId,
        studentId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: record
      });
    } catch (error) {
      next(error);
    }
  }
);
studentRouter.post(
  "/:id/leaves",
  authenticate,
  requireTenantContext,
  requirePermission("students:update"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const studentId = req.params.id;
      const parseResult = applyLeaveSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid leave application payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const leave = await StudentService.applyLeave(
        tenantId,
        studentId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: leave
      });
    } catch (error) {
      next(error);
    }
  }
);
studentRouter.post(
  "/:id/exams",
  authenticate,
  requireTenantContext,
  requirePermission("students:update"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const studentId = req.params.id;
      const parseResult = recordExamSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid exam result payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const exam = await StudentService.recordExamResult(
        tenantId,
        studentId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: exam
      });
    } catch (error) {
      next(error);
    }
  }
);
studentRouter.post(
  "/:id/assignments",
  authenticate,
  requireTenantContext,
  requirePermission("students:update"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const studentId = req.params.id;
      const parseResult = logAssignmentSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid assignment payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const assignment = await StudentService.logAssignment(
        tenantId,
        studentId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: assignment
      });
    } catch (error) {
      next(error);
    }
  }
);

// apps/api/src/http/routes/clients.ts
import { Router as Router9 } from "express";
import { z as z9 } from "zod";

// apps/api/src/services/client.service.ts
import {
  db as db8,
  clients,
  clientContacts,
  clientKycDocuments,
  memberships as memberships4,
  userProfiles as userProfiles5
} from "@avenquis/database";
import { eq as eq7, and as and4, desc as desc3, ilike as ilike3, or as or4 } from "drizzle-orm";
var ClientService = class {
  static async listClients(tenantId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [eq7(clients.tenantId, tenantId)];
    if (options?.status) {
      conditions.push(eq7(clients.status, options.status));
    }
    if (options?.clientType) {
      conditions.push(eq7(clients.clientType, options.clientType));
    }
    if (options?.riskRating) {
      conditions.push(eq7(clients.riskRating, options.riskRating));
    }
    if (options?.kycStatus) {
      conditions.push(eq7(clients.kycStatus, options.kycStatus));
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      const condOr = or4(
        ilike3(clients.name, searchPattern),
        ilike3(clients.clientCode, searchPattern),
        ilike3(clients.primaryEmail, searchPattern)
      );
      if (condOr) conditions.push(condOr);
    }
    const rows = await db8.select().from(clients).where(and4(...conditions)).limit(limit).offset(offset).orderBy(desc3(clients.createdAt));
    return rows;
  }
  static async createClient(tenantId, data) {
    const existing = await db8.query.clients.findFirst({
      where: and4(
        eq7(clients.tenantId, tenantId),
        eq7(clients.clientCode, data.clientCode)
      )
    });
    if (existing) {
      throw new ApiError(
        409,
        `Client code '${data.clientCode}' already exists in this tenant`,
        "CLIENT_CODE_EXISTS"
      );
    }
    const [client] = await db8.insert(clients).values({
      tenantId,
      clientCode: data.clientCode,
      name: data.name,
      clientType: data.clientType,
      industry: data.industry,
      taxIdentificationNumber: data.taxIdentificationNumber,
      businessRegistrationNumber: data.businessRegistrationNumber,
      primaryEmail: data.primaryEmail,
      primaryPhone: data.primaryPhone,
      address: data.address,
      riskRating: data.riskRating ?? "unassessed",
      kycStatus: data.kycStatus ?? "pending",
      status: data.status ?? "active",
      leadPartnerMembershipId: data.leadPartnerMembershipId
    }).returning();
    return client;
  }
  static async getClientById(tenantId, clientId) {
    const client = await db8.query.clients.findFirst({
      where: and4(eq7(clients.tenantId, tenantId), eq7(clients.id, clientId))
    });
    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }
    const contacts = await db8.select().from(clientContacts).where(
      and4(
        eq7(clientContacts.tenantId, tenantId),
        eq7(clientContacts.clientId, clientId)
      )
    ).orderBy(desc3(clientContacts.isPrimary), clientContacts.fullName);
    const kycDocuments = await db8.select().from(clientKycDocuments).where(
      and4(
        eq7(clientKycDocuments.tenantId, tenantId),
        eq7(clientKycDocuments.clientId, clientId)
      )
    ).orderBy(desc3(clientKycDocuments.createdAt));
    let leadPartner = null;
    if (client.leadPartnerMembershipId) {
      const [partnerRow] = await db8.select({
        membershipId: memberships4.id,
        fullName: userProfiles5.fullName,
        email: userProfiles5.email
      }).from(memberships4).innerJoin(userProfiles5, eq7(memberships4.userId, userProfiles5.id)).where(eq7(memberships4.id, client.leadPartnerMembershipId));
      leadPartner = partnerRow ?? null;
    }
    return {
      ...client,
      contacts,
      kycDocuments,
      leadPartner
    };
  }
  static async updateClient(tenantId, clientId, data) {
    const client = await db8.query.clients.findFirst({
      where: and4(eq7(clients.tenantId, tenantId), eq7(clients.id, clientId))
    });
    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }
    const [updated] = await db8.update(clients).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and4(eq7(clients.tenantId, tenantId), eq7(clients.id, clientId))).returning();
    return updated;
  }
  static async addContact(tenantId, clientId, data) {
    const client = await db8.query.clients.findFirst({
      where: and4(eq7(clients.tenantId, tenantId), eq7(clients.id, clientId))
    });
    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }
    if (data.isPrimary) {
      await db8.update(clientContacts).set({ isPrimary: false }).where(
        and4(
          eq7(clientContacts.tenantId, tenantId),
          eq7(clientContacts.clientId, clientId)
        )
      );
    }
    const [contact] = await db8.insert(clientContacts).values({
      tenantId,
      clientId,
      fullName: data.fullName,
      designation: data.designation,
      email: data.email,
      phone: data.phone,
      isPrimary: data.isPrimary ?? false,
      notes: data.notes
    }).returning();
    return contact;
  }
  static async uploadKycDocument(tenantId, clientId, data) {
    const client = await db8.query.clients.findFirst({
      where: and4(eq7(clients.tenantId, tenantId), eq7(clients.id, clientId))
    });
    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }
    const [document] = await db8.insert(clientKycDocuments).values({
      tenantId,
      clientId,
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      fileUrl: data.fileUrl,
      verificationStatus: "pending",
      expiryDate: data.expiryDate,
      remarks: data.remarks
    }).returning();
    return document;
  }
  static async verifyKycDocument(tenantId, documentId, data) {
    const doc = await db8.query.clientKycDocuments.findFirst({
      where: and4(
        eq7(clientKycDocuments.tenantId, tenantId),
        eq7(clientKycDocuments.id, documentId)
      )
    });
    if (!doc) {
      throw new ApiError(
        404,
        "KYC document record not found",
        "KYC_DOCUMENT_NOT_FOUND"
      );
    }
    const [updatedDoc] = await db8.update(clientKycDocuments).set({
      verificationStatus: data.verificationStatus,
      verifiedByMembershipId: data.verifierMembershipId,
      verifiedAt: /* @__PURE__ */ new Date(),
      remarks: data.remarks ?? doc.remarks,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and4(
        eq7(clientKycDocuments.tenantId, tenantId),
        eq7(clientKycDocuments.id, documentId)
      )
    ).returning();
    const allDocs = await db8.select().from(clientKycDocuments).where(
      and4(
        eq7(clientKycDocuments.tenantId, tenantId),
        eq7(clientKycDocuments.clientId, doc.clientId)
      )
    );
    const hasVerified = allDocs.some(
      (d) => d.verificationStatus === "verified"
    );
    const hasRejected = allDocs.some(
      (d) => d.verificationStatus === "rejected"
    );
    let newKycStatus = "pending";
    if (hasVerified && !hasRejected) {
      newKycStatus = "verified";
    } else if (hasRejected) {
      newKycStatus = "rejected";
    }
    await db8.update(clients).set({ kycStatus: newKycStatus, updatedAt: /* @__PURE__ */ new Date() }).where(and4(eq7(clients.tenantId, tenantId), eq7(clients.id, doc.clientId)));
    return updatedDoc;
  }
  static async updateRiskRating(tenantId, clientId, riskRating) {
    const client = await db8.query.clients.findFirst({
      where: and4(eq7(clients.tenantId, tenantId), eq7(clients.id, clientId))
    });
    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }
    const [updated] = await db8.update(clients).set({
      riskRating,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and4(eq7(clients.tenantId, tenantId), eq7(clients.id, clientId))).returning();
    return updated;
  }
};

// apps/api/src/http/routes/clients.ts
var clientRouter = Router9();
var createClientSchema = z9.object({
  clientCode: z9.string().min(2).max(50),
  name: z9.string().min(2).max(255),
  clientType: z9.enum([
    "corporate",
    "individual",
    "government",
    "non_profit",
    "partnership"
  ]),
  industry: z9.string().max(100).optional(),
  taxIdentificationNumber: z9.string().max(100).optional(),
  businessRegistrationNumber: z9.string().max(100).optional(),
  primaryEmail: z9.string().email().optional(),
  primaryPhone: z9.string().max(50).optional(),
  address: z9.record(z9.string(), z9.unknown()).optional(),
  riskRating: z9.enum(["low", "medium", "high", "unassessed"]).default("unassessed"),
  kycStatus: z9.enum(["pending", "verified", "expired", "rejected"]).default("pending"),
  status: z9.enum(["active", "onboarding", "inactive", "blacklisted"]).default("active"),
  leadPartnerMembershipId: z9.string().uuid().optional()
});
var updateClientSchema = createClientSchema.partial().omit({
  clientCode: true
});
var addContactSchema = z9.object({
  fullName: z9.string().min(2).max(255),
  designation: z9.string().max(100).optional(),
  email: z9.string().email().optional(),
  phone: z9.string().max(50).optional(),
  isPrimary: z9.boolean().default(false),
  notes: z9.string().optional()
});
var uploadKycSchema = z9.object({
  documentType: z9.enum([
    "trade_license",
    "tin_certificate",
    "vat_certificate",
    "incorporation_cert",
    "nid_passport",
    "utility_bill"
  ]),
  documentNumber: z9.string().max(100).optional(),
  fileUrl: z9.string().url().optional(),
  expiryDate: z9.string().transform((val) => new Date(val)).optional(),
  remarks: z9.string().optional()
});
var verifyKycSchema = z9.object({
  verificationStatus: z9.enum(["verified", "rejected"]),
  remarks: z9.string().optional()
});
var updateRiskSchema = z9.object({
  riskRating: z9.enum(["low", "medium", "high", "unassessed"])
});
clientRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("clients:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const status = req.query.status;
      const clientType = req.query.clientType;
      const riskRating = req.query.riskRating;
      const kycStatus = req.query.kycStatus;
      const search = req.query.search;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : void 0;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : void 0;
      const clients6 = await ClientService.listClients(tenantId, {
        status,
        clientType,
        riskRating,
        kycStatus,
        search,
        limit,
        offset
      });
      res.json({
        success: true,
        data: clients6
      });
    } catch (error) {
      next(error);
    }
  }
);
clientRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("clients:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const parseResult = createClientSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid client creation payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const client = await ClientService.createClient(
        tenantId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: client
      });
    } catch (error) {
      next(error);
    }
  }
);
clientRouter.get(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("clients:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const clientId = req.params.id;
      const client = await ClientService.getClientById(tenantId, clientId);
      res.json({
        success: true,
        data: client
      });
    } catch (error) {
      next(error);
    }
  }
);
clientRouter.patch(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("clients:update"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const clientId = req.params.id;
      const parseResult = updateClientSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid client update payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const updated = await ClientService.updateClient(
        tenantId,
        clientId,
        parseResult.data
      );
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
);
clientRouter.post(
  "/:id/contacts",
  authenticate,
  requireTenantContext,
  requirePermission("clients:manage_contacts"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const clientId = req.params.id;
      const parseResult = addContactSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid contact payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const contact = await ClientService.addContact(
        tenantId,
        clientId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: contact
      });
    } catch (error) {
      next(error);
    }
  }
);
clientRouter.post(
  "/:id/kyc",
  authenticate,
  requireTenantContext,
  requirePermission("clients:manage_kyc"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const clientId = req.params.id;
      const parseResult = uploadKycSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid KYC document payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const document = await ClientService.uploadKycDocument(
        tenantId,
        clientId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: document
      });
    } catch (error) {
      next(error);
    }
  }
);
clientRouter.patch(
  "/kyc/:documentId",
  authenticate,
  requireTenantContext,
  requirePermission("clients:verify_kyc"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const documentId = req.params.documentId;
      const membershipId = req.membership.id;
      const parseResult = verifyKycSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid KYC verification payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const verified = await ClientService.verifyKycDocument(
        tenantId,
        documentId,
        {
          ...parseResult.data,
          verifierMembershipId: membershipId
        }
      );
      res.json({
        success: true,
        data: verified
      });
    } catch (error) {
      next(error);
    }
  }
);
clientRouter.patch(
  "/:id/risk",
  authenticate,
  requireTenantContext,
  requirePermission("clients:manage_kyc"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const clientId = req.params.id;
      const parseResult = updateRiskSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid risk rating payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const updated = await ClientService.updateRiskRating(
        tenantId,
        clientId,
        parseResult.data.riskRating
      );
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
);

// apps/api/src/http/routes/engagements.ts
import { Router as Router10 } from "express";
import { z as z10 } from "zod";

// apps/api/src/services/engagement.service.ts
import {
  db as db9,
  engagements,
  engagementTeamMembers,
  engagementIndependenceDeclarations,
  clients as clients2,
  memberships as memberships5,
  userProfiles as userProfiles6
} from "@avenquis/database";
import { eq as eq8, and as and5, desc as desc4, ilike as ilike4, or as or5 } from "drizzle-orm";
var EngagementService = class {
  static async listEngagements(tenantId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [eq8(engagements.tenantId, tenantId)];
    if (options?.clientId) {
      conditions.push(eq8(engagements.clientId, options.clientId));
    }
    if (options?.status) {
      conditions.push(eq8(engagements.status, options.status));
    }
    if (options?.engagementType) {
      conditions.push(eq8(engagements.engagementType, options.engagementType));
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      const condOr = or5(
        ilike4(engagements.title, searchPattern),
        ilike4(engagements.engagementCode, searchPattern),
        ilike4(engagements.financialYear, searchPattern)
      );
      if (condOr) conditions.push(condOr);
    }
    const rows = await db9.select({
      id: engagements.id,
      tenantId: engagements.tenantId,
      clientId: engagements.clientId,
      clientName: clients2.name,
      clientCode: clients2.clientCode,
      engagementCode: engagements.engagementCode,
      title: engagements.title,
      engagementType: engagements.engagementType,
      financialYear: engagements.financialYear,
      startDate: engagements.startDate,
      endDate: engagements.endDate,
      budgetedHours: engagements.budgetedHours,
      budgetedFee: engagements.budgetedFee,
      currency: engagements.currency,
      status: engagements.status,
      independenceCleared: engagements.independenceCleared,
      createdAt: engagements.createdAt
    }).from(engagements).innerJoin(clients2, eq8(engagements.clientId, clients2.id)).where(and5(...conditions)).limit(limit).offset(offset).orderBy(desc4(engagements.createdAt));
    return rows;
  }
  static async createEngagement(tenantId, data) {
    const client = await db9.query.clients.findFirst({
      where: and5(eq8(clients2.tenantId, tenantId), eq8(clients2.id, data.clientId))
    });
    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }
    const existing = await db9.query.engagements.findFirst({
      where: and5(
        eq8(engagements.tenantId, tenantId),
        eq8(engagements.engagementCode, data.engagementCode)
      )
    });
    if (existing) {
      throw new ApiError(
        409,
        `Engagement code '${data.engagementCode}' already exists in this tenant`,
        "ENGAGEMENT_CODE_EXISTS"
      );
    }
    const [engagement] = await db9.insert(engagements).values({
      tenantId,
      clientId: data.clientId,
      engagementCode: data.engagementCode,
      title: data.title,
      engagementType: data.engagementType,
      financialYear: data.financialYear,
      startDate: data.startDate,
      endDate: data.endDate,
      budgetedHours: data.budgetedHours ?? 0,
      budgetedFee: data.budgetedFee ?? 0,
      currency: data.currency ?? "BDT",
      status: "planning",
      engagementPartnerMembershipId: data.engagementPartnerMembershipId,
      engagementManagerMembershipId: data.engagementManagerMembershipId,
      auditQualityReviewerMembershipId: data.auditQualityReviewerMembershipId,
      independenceCleared: false
    }).returning();
    return engagement;
  }
  static async getEngagementById(tenantId, engagementId) {
    const engagement = await db9.query.engagements.findFirst({
      where: and5(
        eq8(engagements.tenantId, tenantId),
        eq8(engagements.id, engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const client = await db9.query.clients.findFirst({
      where: eq8(clients2.id, engagement.clientId)
    });
    const teamMembers = await db9.select({
      id: engagementTeamMembers.id,
      membershipId: engagementTeamMembers.membershipId,
      role: engagementTeamMembers.role,
      allocatedHours: engagementTeamMembers.allocatedHours,
      startDate: engagementTeamMembers.startDate,
      endDate: engagementTeamMembers.endDate,
      fullName: userProfiles6.fullName,
      email: userProfiles6.email
    }).from(engagementTeamMembers).innerJoin(
      memberships5,
      eq8(engagementTeamMembers.membershipId, memberships5.id)
    ).innerJoin(userProfiles6, eq8(memberships5.userId, userProfiles6.id)).where(
      and5(
        eq8(engagementTeamMembers.tenantId, tenantId),
        eq8(engagementTeamMembers.engagementId, engagementId)
      )
    );
    const independenceDeclarations = await db9.select({
      id: engagementIndependenceDeclarations.id,
      membershipId: engagementIndependenceDeclarations.membershipId,
      declarationStatus: engagementIndependenceDeclarations.declarationStatus,
      hasFinancialInterest: engagementIndependenceDeclarations.hasFinancialInterest,
      hasPersonalRelationship: engagementIndependenceDeclarations.hasPersonalRelationship,
      remarks: engagementIndependenceDeclarations.remarks,
      clearedAt: engagementIndependenceDeclarations.clearedAt,
      fullName: userProfiles6.fullName
    }).from(engagementIndependenceDeclarations).innerJoin(
      memberships5,
      eq8(engagementIndependenceDeclarations.membershipId, memberships5.id)
    ).innerJoin(userProfiles6, eq8(memberships5.userId, userProfiles6.id)).where(
      and5(
        eq8(engagementIndependenceDeclarations.tenantId, tenantId),
        eq8(engagementIndependenceDeclarations.engagementId, engagementId)
      )
    );
    return {
      ...engagement,
      client,
      teamMembers,
      independenceDeclarations
    };
  }
  static async updateEngagementStatus(tenantId, engagementId, status) {
    const engagement = await db9.query.engagements.findFirst({
      where: and5(
        eq8(engagements.tenantId, tenantId),
        eq8(engagements.id, engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const [updated] = await db9.update(engagements).set({
      status,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and5(
        eq8(engagements.tenantId, tenantId),
        eq8(engagements.id, engagementId)
      )
    ).returning();
    return updated;
  }
  static async assignTeamMember(tenantId, engagementId, data) {
    const engagement = await db9.query.engagements.findFirst({
      where: and5(
        eq8(engagements.tenantId, tenantId),
        eq8(engagements.id, engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const existing = await db9.query.engagementTeamMembers.findFirst({
      where: and5(
        eq8(engagementTeamMembers.tenantId, tenantId),
        eq8(engagementTeamMembers.engagementId, engagementId),
        eq8(engagementTeamMembers.membershipId, data.membershipId)
      )
    });
    let member;
    if (existing) {
      [member] = await db9.update(engagementTeamMembers).set({
        role: data.role,
        allocatedHours: data.allocatedHours ?? existing.allocatedHours,
        startDate: data.startDate ?? existing.startDate,
        endDate: data.endDate ?? existing.endDate,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq8(engagementTeamMembers.id, existing.id)).returning();
    } else {
      [member] = await db9.insert(engagementTeamMembers).values({
        tenantId,
        engagementId,
        membershipId: data.membershipId,
        role: data.role,
        allocatedHours: data.allocatedHours ?? 0,
        startDate: data.startDate,
        endDate: data.endDate
      }).returning();
    }
    return member;
  }
  static async removeTeamMember(tenantId, engagementId, membershipId) {
    const existing = await db9.query.engagementTeamMembers.findFirst({
      where: and5(
        eq8(engagementTeamMembers.tenantId, tenantId),
        eq8(engagementTeamMembers.engagementId, engagementId),
        eq8(engagementTeamMembers.membershipId, membershipId)
      )
    });
    if (!existing) {
      throw new ApiError(
        404,
        "Team member assignment not found",
        "TEAM_MEMBER_NOT_FOUND"
      );
    }
    await db9.delete(engagementTeamMembers).where(eq8(engagementTeamMembers.id, existing.id));
    return { success: true };
  }
  static async submitIndependenceDeclaration(tenantId, engagementId, membershipId, data) {
    const engagement = await db9.query.engagements.findFirst({
      where: and5(
        eq8(engagements.tenantId, tenantId),
        eq8(engagements.id, engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const hasConflict = data.hasFinancialInterest || data.hasPersonalRelationship;
    const declarationStatus = hasConflict ? "conflict_flagged" : "cleared";
    const existing = await db9.query.engagementIndependenceDeclarations.findFirst({
      where: and5(
        eq8(engagementIndependenceDeclarations.tenantId, tenantId),
        eq8(engagementIndependenceDeclarations.engagementId, engagementId),
        eq8(engagementIndependenceDeclarations.membershipId, membershipId)
      )
    });
    let declaration;
    if (existing) {
      [declaration] = await db9.update(engagementIndependenceDeclarations).set({
        declarationStatus,
        hasFinancialInterest: data.hasFinancialInterest,
        hasPersonalRelationship: data.hasPersonalRelationship,
        remarks: data.remarks,
        clearedAt: hasConflict ? null : /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq8(engagementIndependenceDeclarations.id, existing.id)).returning();
    } else {
      [declaration] = await db9.insert(engagementIndependenceDeclarations).values({
        tenantId,
        engagementId,
        membershipId,
        declarationStatus,
        hasFinancialInterest: data.hasFinancialInterest,
        hasPersonalRelationship: data.hasPersonalRelationship,
        remarks: data.remarks,
        clearedAt: hasConflict ? null : /* @__PURE__ */ new Date()
      }).returning();
    }
    const allDeclarations = await db9.select().from(engagementIndependenceDeclarations).where(
      and5(
        eq8(engagementIndependenceDeclarations.tenantId, tenantId),
        eq8(engagementIndependenceDeclarations.engagementId, engagementId)
      )
    );
    const hasDeclarations = allDeclarations.length > 0;
    const allCleared = hasDeclarations && allDeclarations.every((d) => d.declarationStatus === "cleared");
    await db9.update(engagements).set({
      independenceCleared: allCleared,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and5(
        eq8(engagements.tenantId, tenantId),
        eq8(engagements.id, engagementId)
      )
    );
    return declaration;
  }
};

// apps/api/src/http/routes/engagements.ts
var engagementRouter = Router10();
var createEngagementSchema = z10.object({
  clientId: z10.string().uuid(),
  engagementCode: z10.string().min(2).max(50),
  title: z10.string().min(2).max(255),
  engagementType: z10.enum([
    "statutory_audit",
    "tax_advisory",
    "accounting_services",
    "special_audit",
    "vat_consulting",
    "valuation_advisory"
  ]),
  financialYear: z10.string().min(2).max(50),
  startDate: z10.string().transform((val) => new Date(val)),
  endDate: z10.string().transform((val) => new Date(val)).optional(),
  budgetedHours: z10.number().int().min(0).optional(),
  budgetedFee: z10.number().int().min(0).optional(),
  currency: z10.string().max(10).default("BDT"),
  engagementPartnerMembershipId: z10.string().uuid().optional(),
  engagementManagerMembershipId: z10.string().uuid().optional(),
  auditQualityReviewerMembershipId: z10.string().uuid().optional()
});
var updateStatusSchema = z10.object({
  status: z10.enum([
    "planning",
    "fieldwork",
    "review",
    "partner_signoff",
    "completed",
    "archived"
  ])
});
var assignTeamMemberSchema = z10.object({
  membershipId: z10.string().uuid(),
  role: z10.enum([
    "lead_partner",
    "engagement_manager",
    "senior_auditor",
    "staff_auditor",
    "article_student",
    "eqcr_partner"
  ]),
  allocatedHours: z10.number().int().min(0).optional(),
  startDate: z10.string().transform((val) => new Date(val)).optional(),
  endDate: z10.string().transform((val) => new Date(val)).optional()
});
var submitIndependenceSchema = z10.object({
  hasFinancialInterest: z10.boolean(),
  hasPersonalRelationship: z10.boolean(),
  remarks: z10.string().optional()
});
engagementRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("engagements:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const clientId = req.query.clientId;
      const status = req.query.status;
      const engagementType = req.query.engagementType;
      const search = req.query.search;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : void 0;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : void 0;
      const list = await EngagementService.listEngagements(tenantId, {
        clientId,
        status,
        engagementType,
        search,
        limit,
        offset
      });
      res.json({
        success: true,
        data: list
      });
    } catch (error) {
      next(error);
    }
  }
);
engagementRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("engagements:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const parseResult = createEngagementSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid engagement creation payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const engagement = await EngagementService.createEngagement(
        tenantId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: engagement
      });
    } catch (error) {
      next(error);
    }
  }
);
engagementRouter.get(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("engagements:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const engagementId = req.params.id;
      const engagement = await EngagementService.getEngagementById(
        tenantId,
        engagementId
      );
      res.json({
        success: true,
        data: engagement
      });
    } catch (error) {
      next(error);
    }
  }
);
engagementRouter.patch(
  "/:id/status",
  authenticate,
  requireTenantContext,
  requirePermission("engagements:update"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const engagementId = req.params.id;
      const parseResult = updateStatusSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid status payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const updated = await EngagementService.updateEngagementStatus(
        tenantId,
        engagementId,
        parseResult.data.status
      );
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
);
engagementRouter.post(
  "/:id/team",
  authenticate,
  requireTenantContext,
  requirePermission("engagements:manage_team"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const engagementId = req.params.id;
      const parseResult = assignTeamMemberSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid team assignment payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const member = await EngagementService.assignTeamMember(
        tenantId,
        engagementId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: member
      });
    } catch (error) {
      next(error);
    }
  }
);
engagementRouter.delete(
  "/:id/team/:membershipId",
  authenticate,
  requireTenantContext,
  requirePermission("engagements:manage_team"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const engagementId = req.params.id;
      const membershipId = req.params.membershipId;
      const result = await EngagementService.removeTeamMember(
        tenantId,
        engagementId,
        membershipId
      );
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);
engagementRouter.post(
  "/:id/independence",
  authenticate,
  requireTenantContext,
  requirePermission("engagements:manage_independence"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const engagementId = req.params.id;
      const membershipId = req.membership.id;
      const parseResult = submitIndependenceSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid independence declaration payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const declaration = await EngagementService.submitIndependenceDeclaration(
        tenantId,
        engagementId,
        membershipId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: declaration
      });
    } catch (error) {
      next(error);
    }
  }
);

// apps/api/src/http/routes/working-papers.ts
import { Router as Router11 } from "express";
import { z as z11 } from "zod";

// apps/api/src/services/working-paper.service.ts
import {
  db as db10,
  workingPapers,
  reviewNotes,
  clientDocumentRequests,
  engagements as engagements2,
  memberships as memberships6,
  userProfiles as userProfiles7
} from "@avenquis/database";
import { eq as eq9, and as and6, desc as desc5, ilike as ilike5, or as or6 } from "drizzle-orm";
var WorkingPaperService = class {
  static async listWorkingPapers(tenantId, engagementId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [
      eq9(workingPapers.tenantId, tenantId),
      eq9(workingPapers.engagementId, engagementId)
    ];
    if (options?.section) {
      conditions.push(eq9(workingPapers.section, options.section));
    }
    if (options?.status) {
      conditions.push(eq9(workingPapers.status, options.status));
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      const condOr = or6(
        ilike5(workingPapers.title, searchPattern),
        ilike5(workingPapers.wpCode, searchPattern)
      );
      if (condOr) conditions.push(condOr);
    }
    const rows = await db10.select().from(workingPapers).where(and6(...conditions)).limit(limit).offset(offset).orderBy(desc5(workingPapers.createdAt));
    return rows;
  }
  static async createWorkingPaper(tenantId, data) {
    const engagement = await db10.query.engagements.findFirst({
      where: and6(
        eq9(engagements2.tenantId, tenantId),
        eq9(engagements2.id, data.engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const existing = await db10.query.workingPapers.findFirst({
      where: and6(
        eq9(workingPapers.tenantId, tenantId),
        eq9(workingPapers.engagementId, data.engagementId),
        eq9(workingPapers.wpCode, data.wpCode)
      )
    });
    if (existing) {
      throw new ApiError(
        409,
        `Working paper code '${data.wpCode}' already exists in this engagement`,
        "WP_CODE_EXISTS"
      );
    }
    const [wp] = await db10.insert(workingPapers).values({
      tenantId,
      engagementId: data.engagementId,
      wpCode: data.wpCode,
      title: data.title,
      section: data.section,
      fileUrl: data.fileUrl,
      remarks: data.remarks,
      status: "draft",
      version: 1
    }).returning();
    return wp;
  }
  static async getWorkingPaperById(tenantId, wpId) {
    const wp = await db10.query.workingPapers.findFirst({
      where: and6(
        eq9(workingPapers.tenantId, tenantId),
        eq9(workingPapers.id, wpId)
      )
    });
    if (!wp) {
      throw new ApiError(
        404,
        "Working paper not found",
        "WORKING_PAPER_NOT_FOUND"
      );
    }
    const notes = await db10.select({
      id: reviewNotes.id,
      content: reviewNotes.content,
      status: reviewNotes.status,
      authorMembershipId: reviewNotes.authorMembershipId,
      authorFullName: userProfiles7.fullName,
      addressedAt: reviewNotes.addressedAt,
      clearedAt: reviewNotes.clearedAt,
      createdAt: reviewNotes.createdAt
    }).from(reviewNotes).innerJoin(
      memberships6,
      eq9(reviewNotes.authorMembershipId, memberships6.id)
    ).innerJoin(userProfiles7, eq9(memberships6.userId, userProfiles7.id)).where(
      and6(
        eq9(reviewNotes.tenantId, tenantId),
        eq9(reviewNotes.workingPaperId, wpId)
      )
    ).orderBy(desc5(reviewNotes.createdAt));
    let preparer = null;
    if (wp.preparedByMembershipId) {
      const [p] = await db10.select({
        membershipId: memberships6.id,
        fullName: userProfiles7.fullName,
        email: userProfiles7.email
      }).from(memberships6).innerJoin(userProfiles7, eq9(memberships6.userId, userProfiles7.id)).where(eq9(memberships6.id, wp.preparedByMembershipId));
      preparer = p ?? null;
    }
    let reviewer = null;
    if (wp.reviewedByMembershipId) {
      const [r] = await db10.select({
        membershipId: memberships6.id,
        fullName: userProfiles7.fullName,
        email: userProfiles7.email
      }).from(memberships6).innerJoin(userProfiles7, eq9(memberships6.userId, userProfiles7.id)).where(eq9(memberships6.id, wp.reviewedByMembershipId));
      reviewer = r ?? null;
    }
    return {
      ...wp,
      preparer,
      reviewer,
      reviewNotes: notes
    };
  }
  static async signoffWorkingPaper(tenantId, wpId, action, membershipId, remarks) {
    const wp = await db10.query.workingPapers.findFirst({
      where: and6(
        eq9(workingPapers.tenantId, tenantId),
        eq9(workingPapers.id, wpId)
      )
    });
    if (!wp) {
      throw new ApiError(
        404,
        "Working paper not found",
        "WORKING_PAPER_NOT_FOUND"
      );
    }
    let updatedStatus = wp.status;
    let preparedByMembershipId = wp.preparedByMembershipId;
    let preparedAt = wp.preparedAt;
    let reviewedByMembershipId = wp.reviewedByMembershipId;
    let reviewedAt = wp.reviewedAt;
    if (action === "prepare") {
      updatedStatus = "prepared";
      preparedByMembershipId = membershipId;
      preparedAt = /* @__PURE__ */ new Date();
    } else if (action === "approve") {
      updatedStatus = "approved";
      reviewedByMembershipId = membershipId;
      reviewedAt = /* @__PURE__ */ new Date();
    } else if (action === "reject") {
      updatedStatus = "rejected";
      reviewedByMembershipId = membershipId;
      reviewedAt = /* @__PURE__ */ new Date();
    }
    const [updated] = await db10.update(workingPapers).set({
      status: updatedStatus,
      preparedByMembershipId,
      preparedAt,
      reviewedByMembershipId,
      reviewedAt,
      remarks: remarks ?? wp.remarks,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and6(eq9(workingPapers.tenantId, tenantId), eq9(workingPapers.id, wpId))
    ).returning();
    return updated;
  }
  static async addReviewNote(tenantId, wpId, authorMembershipId, content) {
    const wp = await db10.query.workingPapers.findFirst({
      where: and6(
        eq9(workingPapers.tenantId, tenantId),
        eq9(workingPapers.id, wpId)
      )
    });
    if (!wp) {
      throw new ApiError(
        404,
        "Working paper not found",
        "WORKING_PAPER_NOT_FOUND"
      );
    }
    const [note] = await db10.insert(reviewNotes).values({
      tenantId,
      workingPaperId: wpId,
      authorMembershipId,
      content,
      status: "open"
    }).returning();
    return note;
  }
  static async updateReviewNoteStatus(tenantId, noteId, action, membershipId) {
    const note = await db10.query.reviewNotes.findFirst({
      where: and6(
        eq9(reviewNotes.tenantId, tenantId),
        eq9(reviewNotes.id, noteId)
      )
    });
    if (!note) {
      throw new ApiError(404, "Review note not found", "REVIEW_NOTE_NOT_FOUND");
    }
    let status = note.status;
    let addressedByMembershipId = note.addressedByMembershipId;
    let addressedAt = note.addressedAt;
    let clearedByMembershipId = note.clearedByMembershipId;
    let clearedAt = note.clearedAt;
    if (action === "address") {
      status = "addressed";
      addressedByMembershipId = membershipId;
      addressedAt = /* @__PURE__ */ new Date();
    } else if (action === "clear") {
      status = "cleared";
      clearedByMembershipId = membershipId;
      clearedAt = /* @__PURE__ */ new Date();
    }
    const [updated] = await db10.update(reviewNotes).set({
      status,
      addressedByMembershipId,
      addressedAt,
      clearedByMembershipId,
      clearedAt,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and6(eq9(reviewNotes.tenantId, tenantId), eq9(reviewNotes.id, noteId))
    ).returning();
    return updated;
  }
  static async listDocumentRequests(tenantId, engagementId) {
    const requests = await db10.select().from(clientDocumentRequests).where(
      and6(
        eq9(clientDocumentRequests.tenantId, tenantId),
        eq9(clientDocumentRequests.engagementId, engagementId)
      )
    ).orderBy(desc5(clientDocumentRequests.createdAt));
    return requests;
  }
  static async createDocumentRequest(tenantId, data) {
    const engagement = await db10.query.engagements.findFirst({
      where: and6(
        eq9(engagements2.tenantId, tenantId),
        eq9(engagements2.id, data.engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const [request] = await db10.insert(clientDocumentRequests).values({
      tenantId,
      engagementId: data.engagementId,
      requestTitle: data.requestTitle,
      description: data.description,
      dueDate: data.dueDate,
      status: "pending"
    }).returning();
    return request;
  }
  static async fulfillDocumentRequest(tenantId, requestId, uploadedFileUrl) {
    const req = await db10.query.clientDocumentRequests.findFirst({
      where: and6(
        eq9(clientDocumentRequests.tenantId, tenantId),
        eq9(clientDocumentRequests.id, requestId)
      )
    });
    if (!req) {
      throw new ApiError(
        404,
        "Document request not found",
        "DOCUMENT_REQUEST_NOT_FOUND"
      );
    }
    const [updated] = await db10.update(clientDocumentRequests).set({
      uploadedFileUrl,
      status: "submitted",
      submittedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and6(
        eq9(clientDocumentRequests.tenantId, tenantId),
        eq9(clientDocumentRequests.id, requestId)
      )
    ).returning();
    return updated;
  }
};

// apps/api/src/http/routes/working-papers.ts
var workingPaperRouter = Router11();
var createWpSchema = z11.object({
  engagementId: z11.string().uuid(),
  wpCode: z11.string().min(1).max(50),
  title: z11.string().min(2).max(255),
  section: z11.enum([
    "planning",
    "assets",
    "liabilities",
    "equity",
    "revenue",
    "expenses",
    "taxation",
    "completion",
    "permanent_file"
  ]),
  fileUrl: z11.string().url().optional(),
  remarks: z11.string().optional()
});
var signoffSchema = z11.object({
  action: z11.enum(["prepare", "approve", "reject"]),
  remarks: z11.string().optional()
});
var addReviewNoteSchema = z11.object({
  content: z11.string().min(2)
});
var updateReviewNoteSchema = z11.object({
  action: z11.enum(["address", "clear"])
});
var createDocReqSchema = z11.object({
  engagementId: z11.string().uuid(),
  requestTitle: z11.string().min(2).max(255),
  description: z11.string().optional(),
  dueDate: z11.string().transform((val) => new Date(val)).optional()
});
var fulfillDocReqSchema = z11.object({
  uploadedFileUrl: z11.string().url()
});
workingPaperRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const engagementId = req.query.engagementId;
      const section = req.query.section;
      const status = req.query.status;
      const search = req.query.search;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : void 0;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : void 0;
      if (!engagementId) {
        throw new ApiError(
          400,
          "engagementId query parameter is required",
          "MISSING_ENGAGEMENT_ID"
        );
      }
      const list = await WorkingPaperService.listWorkingPapers(
        tenantId,
        engagementId,
        {
          section,
          status,
          search,
          limit,
          offset
        }
      );
      res.json({
        success: true,
        data: list
      });
    } catch (error) {
      next(error);
    }
  }
);
workingPaperRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const parseResult = createWpSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid working paper creation payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const wp = await WorkingPaperService.createWorkingPaper(
        tenantId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: wp
      });
    } catch (error) {
      next(error);
    }
  }
);
workingPaperRouter.get(
  "/requests",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const engagementId = req.query.engagementId;
      if (!engagementId) {
        throw new ApiError(
          400,
          "engagementId query parameter is required",
          "MISSING_ENGAGEMENT_ID"
        );
      }
      const requests = await WorkingPaperService.listDocumentRequests(
        tenantId,
        engagementId
      );
      res.json({
        success: true,
        data: requests
      });
    } catch (error) {
      next(error);
    }
  }
);
workingPaperRouter.post(
  "/requests",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:manage_requests"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const parseResult = createDocReqSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid document request payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const docReq = await WorkingPaperService.createDocumentRequest(
        tenantId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: docReq
      });
    } catch (error) {
      next(error);
    }
  }
);
workingPaperRouter.patch(
  "/requests/:requestId",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:manage_requests"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const requestId = req.params.requestId;
      const parseResult = fulfillDocReqSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid document fulfillment payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const fulfilled = await WorkingPaperService.fulfillDocumentRequest(
        tenantId,
        requestId,
        parseResult.data.uploadedFileUrl
      );
      res.json({
        success: true,
        data: fulfilled
      });
    } catch (error) {
      next(error);
    }
  }
);
workingPaperRouter.get(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const wpId = req.params.id;
      const wp = await WorkingPaperService.getWorkingPaperById(tenantId, wpId);
      res.json({
        success: true,
        data: wp
      });
    } catch (error) {
      next(error);
    }
  }
);
workingPaperRouter.post(
  "/:id/signoff",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:signoff"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const wpId = req.params.id;
      const membershipId = req.membership.id;
      const parseResult = signoffSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid sign-off payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const updated = await WorkingPaperService.signoffWorkingPaper(
        tenantId,
        wpId,
        parseResult.data.action,
        membershipId,
        parseResult.data.remarks
      );
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
);
workingPaperRouter.post(
  "/:id/review-notes",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:review_notes"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const wpId = req.params.id;
      const membershipId = req.membership.id;
      const parseResult = addReviewNoteSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid review note payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const note = await WorkingPaperService.addReviewNote(
        tenantId,
        wpId,
        membershipId,
        parseResult.data.content
      );
      res.status(201).json({
        success: true,
        data: note
      });
    } catch (error) {
      next(error);
    }
  }
);
workingPaperRouter.patch(
  "/review-notes/:noteId",
  authenticate,
  requireTenantContext,
  requirePermission("working_papers:review_notes"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const noteId = req.params.noteId;
      const membershipId = req.membership.id;
      const parseResult = updateReviewNoteSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid review note status payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const updated = await WorkingPaperService.updateReviewNoteStatus(
        tenantId,
        noteId,
        parseResult.data.action,
        membershipId
      );
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
);

// apps/api/src/http/routes/tasks.ts
import { Router as Router12 } from "express";
import { z as z12 } from "zod";

// apps/api/src/services/task.service.ts
import { db as db11, tasks, engagements as engagements3 } from "@avenquis/database";
import { eq as eq10, and as and7, desc as desc6, ilike as ilike6, or as or7 } from "drizzle-orm";
var TaskService = class {
  static async listTasks(tenantId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [eq10(tasks.tenantId, tenantId)];
    if (options?.engagementId) {
      conditions.push(eq10(tasks.engagementId, options.engagementId));
    }
    if (options?.assigneeMembershipId) {
      conditions.push(
        eq10(tasks.assigneeMembershipId, options.assigneeMembershipId)
      );
    }
    if (options?.status) {
      conditions.push(eq10(tasks.status, options.status));
    }
    if (options?.priority) {
      conditions.push(eq10(tasks.priority, options.priority));
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      const condOr = or7(
        ilike6(tasks.title, searchPattern),
        ilike6(tasks.description, searchPattern)
      );
      if (condOr) conditions.push(condOr);
    }
    const rows = await db11.select({
      id: tasks.id,
      tenantId: tasks.tenantId,
      engagementId: tasks.engagementId,
      engagementTitle: engagements3.title,
      assigneeMembershipId: tasks.assigneeMembershipId,
      title: tasks.title,
      description: tasks.description,
      priority: tasks.priority,
      status: tasks.status,
      dueDate: tasks.dueDate,
      estimatedHours: tasks.estimatedHours,
      actualHours: tasks.actualHours,
      createdAt: tasks.createdAt
    }).from(tasks).innerJoin(engagements3, eq10(tasks.engagementId, engagements3.id)).where(and7(...conditions)).limit(limit).offset(offset).orderBy(desc6(tasks.createdAt));
    return rows;
  }
  static async createTask(tenantId, data) {
    const engagement = await db11.query.engagements.findFirst({
      where: and7(
        eq10(engagements3.tenantId, tenantId),
        eq10(engagements3.id, data.engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const [task] = await db11.insert(tasks).values({
      tenantId,
      engagementId: data.engagementId,
      assigneeMembershipId: data.assigneeMembershipId,
      title: data.title,
      description: data.description,
      priority: data.priority ?? "medium",
      status: "todo",
      dueDate: data.dueDate,
      estimatedHours: data.estimatedHours ?? 0,
      actualHours: 0
    }).returning();
    return task;
  }
  static async updateTaskStatus(tenantId, taskId, status, actualHours) {
    const task = await db11.query.tasks.findFirst({
      where: and7(eq10(tasks.tenantId, tenantId), eq10(tasks.id, taskId))
    });
    if (!task) {
      throw new ApiError(404, "Task not found", "TASK_NOT_FOUND");
    }
    const [updated] = await db11.update(tasks).set({
      status,
      actualHours: actualHours ?? task.actualHours,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and7(eq10(tasks.tenantId, tenantId), eq10(tasks.id, taskId))).returning();
    return updated;
  }
};

// apps/api/src/http/routes/tasks.ts
var taskRouter = Router12();
var createTaskSchema = z12.object({
  engagementId: z12.string().uuid(),
  assigneeMembershipId: z12.string().uuid().optional(),
  title: z12.string().min(2).max(255),
  description: z12.string().optional(),
  priority: z12.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z12.string().transform((val) => new Date(val)).optional(),
  estimatedHours: z12.number().int().min(0).optional()
});
var updateTaskStatusSchema = z12.object({
  status: z12.enum(["todo", "in_progress", "review", "completed", "cancelled"]),
  actualHours: z12.number().int().min(0).optional()
});
taskRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("tasks:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const engagementId = req.query.engagementId;
      const assigneeMembershipId = req.query.assigneeMembershipId;
      const status = req.query.status;
      const priority = req.query.priority;
      const search = req.query.search;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : void 0;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : void 0;
      const list = await TaskService.listTasks(tenantId, {
        engagementId,
        assigneeMembershipId,
        status,
        priority,
        search,
        limit,
        offset
      });
      res.json({
        success: true,
        data: list
      });
    } catch (error) {
      next(error);
    }
  }
);
taskRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("tasks:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const parseResult = createTaskSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid task payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const task = await TaskService.createTask(tenantId, parseResult.data);
      res.status(201).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }
);
taskRouter.patch(
  "/:id/status",
  authenticate,
  requireTenantContext,
  requirePermission("tasks:update"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const taskId = req.params.id;
      const parseResult = updateTaskStatusSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid task status payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const updated = await TaskService.updateTaskStatus(
        tenantId,
        taskId,
        parseResult.data.status,
        parseResult.data.actualHours
      );
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
);

// apps/api/src/http/routes/timesheets.ts
import { Router as Router13 } from "express";
import { z as z13 } from "zod";

// apps/api/src/services/timesheet.service.ts
import {
  db as db12,
  timesheetEntries,
  engagements as engagements4,
  tasks as tasks2,
  memberships as memberships7,
  userProfiles as userProfiles8
} from "@avenquis/database";
import { eq as eq11, and as and8, desc as desc7 } from "drizzle-orm";
var TimesheetService = class {
  static async listTimesheets(tenantId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [eq11(timesheetEntries.tenantId, tenantId)];
    if (options?.membershipId) {
      conditions.push(eq11(timesheetEntries.membershipId, options.membershipId));
    }
    if (options?.engagementId) {
      conditions.push(eq11(timesheetEntries.engagementId, options.engagementId));
    }
    if (options?.status) {
      conditions.push(eq11(timesheetEntries.status, options.status));
    }
    const rows = await db12.select({
      id: timesheetEntries.id,
      tenantId: timesheetEntries.tenantId,
      membershipId: timesheetEntries.membershipId,
      staffName: userProfiles8.fullName,
      engagementId: timesheetEntries.engagementId,
      engagementTitle: engagements4.title,
      taskId: timesheetEntries.taskId,
      workDate: timesheetEntries.workDate,
      hours: timesheetEntries.hours,
      activityType: timesheetEntries.activityType,
      description: timesheetEntries.description,
      status: timesheetEntries.status,
      createdAt: timesheetEntries.createdAt
    }).from(timesheetEntries).innerJoin(memberships7, eq11(timesheetEntries.membershipId, memberships7.id)).innerJoin(userProfiles8, eq11(memberships7.userId, userProfiles8.id)).leftJoin(engagements4, eq11(timesheetEntries.engagementId, engagements4.id)).where(and8(...conditions)).limit(limit).offset(offset).orderBy(desc7(timesheetEntries.workDate));
    return rows;
  }
  static async logTimesheet(tenantId, membershipId, data) {
    const [entry] = await db12.insert(timesheetEntries).values({
      tenantId,
      membershipId,
      engagementId: data.engagementId,
      taskId: data.taskId,
      workDate: data.workDate,
      hours: data.hours,
      activityType: data.activityType,
      description: data.description,
      status: "submitted"
    }).returning();
    if (data.taskId) {
      const task = await db12.query.tasks.findFirst({
        where: eq11(tasks2.id, data.taskId)
      });
      if (task) {
        await db12.update(tasks2).set({ actualHours: task.actualHours + data.hours }).where(eq11(tasks2.id, data.taskId));
      }
    }
    return entry;
  }
  static async approveTimesheet(tenantId, timesheetId, approverMembershipId, status) {
    const entry = await db12.query.timesheetEntries.findFirst({
      where: and8(
        eq11(timesheetEntries.tenantId, tenantId),
        eq11(timesheetEntries.id, timesheetId)
      )
    });
    if (!entry) {
      throw new ApiError(
        404,
        "Timesheet entry not found",
        "TIMESHEET_NOT_FOUND"
      );
    }
    const [updated] = await db12.update(timesheetEntries).set({
      status,
      approvedByMembershipId: approverMembershipId,
      approvedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and8(
        eq11(timesheetEntries.tenantId, tenantId),
        eq11(timesheetEntries.id, timesheetId)
      )
    ).returning();
    return updated;
  }
};

// apps/api/src/http/routes/timesheets.ts
var timesheetRouter = Router13();
var logTimesheetSchema = z13.object({
  engagementId: z13.string().uuid().optional(),
  taskId: z13.string().uuid().optional(),
  workDate: z13.string().transform((val) => new Date(val)),
  hours: z13.number().int().min(1).max(24),
  activityType: z13.enum([
    "audit_fieldwork",
    "tax_preparation",
    "client_meeting",
    "report_writing",
    "review",
    "administrative",
    "training"
  ]),
  description: z13.string().optional()
});
var approveTimesheetSchema = z13.object({
  status: z13.enum(["approved", "rejected"])
});
timesheetRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("timesheets:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const membershipId = req.query.membershipId;
      const engagementId = req.query.engagementId;
      const status = req.query.status;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : void 0;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : void 0;
      const list = await TimesheetService.listTimesheets(tenantId, {
        membershipId,
        engagementId,
        status,
        limit,
        offset
      });
      res.json({
        success: true,
        data: list
      });
    } catch (error) {
      next(error);
    }
  }
);
timesheetRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("timesheets:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const membershipId = req.membership.id;
      const parseResult = logTimesheetSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid timesheet payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const entry = await TimesheetService.logTimesheet(
        tenantId,
        membershipId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: entry
      });
    } catch (error) {
      next(error);
    }
  }
);
timesheetRouter.patch(
  "/:id/approve",
  authenticate,
  requireTenantContext,
  requirePermission("timesheets:approve"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const timesheetId = req.params.id;
      const approverMembershipId = req.membership.id;
      const parseResult = approveTimesheetSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid approval payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const updated = await TimesheetService.approveTimesheet(
        tenantId,
        timesheetId,
        approverMembershipId,
        parseResult.data.status
      );
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
);

// apps/api/src/http/routes/billing.ts
import { Router as Router14 } from "express";
import { z as z14 } from "zod";

// apps/api/src/services/billing.service.ts
import {
  db as db13,
  invoices,
  payments,
  clients as clients3,
  engagements as engagements5
} from "@avenquis/database";
import { eq as eq12, and as and9, desc as desc8 } from "drizzle-orm";
var BillingService = class {
  static async listInvoices(tenantId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [eq12(invoices.tenantId, tenantId)];
    if (options?.clientId) {
      conditions.push(eq12(invoices.clientId, options.clientId));
    }
    if (options?.engagementId) {
      conditions.push(eq12(invoices.engagementId, options.engagementId));
    }
    if (options?.status) {
      conditions.push(eq12(invoices.status, options.status));
    }
    const rows = await db13.select({
      id: invoices.id,
      tenantId: invoices.tenantId,
      clientId: invoices.clientId,
      clientName: clients3.name,
      engagementId: invoices.engagementId,
      invoiceNumber: invoices.invoiceNumber,
      amount: invoices.amount,
      vatAmount: invoices.vatAmount,
      totalAmount: invoices.totalAmount,
      currency: invoices.currency,
      status: invoices.status,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      paidAmount: invoices.paidAmount,
      createdAt: invoices.createdAt
    }).from(invoices).innerJoin(clients3, eq12(invoices.clientId, clients3.id)).leftJoin(engagements5, eq12(invoices.engagementId, engagements5.id)).where(and9(...conditions)).limit(limit).offset(offset).orderBy(desc8(invoices.createdAt));
    return rows;
  }
  static async createInvoice(tenantId, data) {
    const client = await db13.query.clients.findFirst({
      where: and9(eq12(clients3.tenantId, tenantId), eq12(clients3.id, data.clientId))
    });
    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }
    const existing = await db13.query.invoices.findFirst({
      where: and9(
        eq12(invoices.tenantId, tenantId),
        eq12(invoices.invoiceNumber, data.invoiceNumber)
      )
    });
    if (existing) {
      throw new ApiError(
        409,
        `Invoice number '${data.invoiceNumber}' already exists in this tenant`,
        "INVOICE_NUMBER_EXISTS"
      );
    }
    const vatAmount = data.vatAmount ?? 0;
    const totalAmount = data.amount + vatAmount;
    const [invoice] = await db13.insert(invoices).values({
      tenantId,
      clientId: data.clientId,
      engagementId: data.engagementId,
      invoiceNumber: data.invoiceNumber,
      amount: data.amount,
      vatAmount,
      totalAmount,
      currency: data.currency ?? "BDT",
      status: "sent",
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      paidAmount: 0,
      remarks: data.remarks
    }).returning();
    return invoice;
  }
  static async recordPayment(tenantId, invoiceId, data) {
    const invoice = await db13.query.invoices.findFirst({
      where: and9(eq12(invoices.tenantId, tenantId), eq12(invoices.id, invoiceId))
    });
    if (!invoice) {
      throw new ApiError(404, "Invoice not found", "INVOICE_NOT_FOUND");
    }
    const [payment] = await db13.insert(payments).values({
      tenantId,
      invoiceId,
      receiptNumber: data.receiptNumber,
      amount: data.amount,
      paymentDate: data.paymentDate,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      remarks: data.remarks
    }).returning();
    const newPaidAmount = invoice.paidAmount + data.amount;
    let newStatus = invoice.status;
    if (newPaidAmount >= invoice.totalAmount) {
      newStatus = "paid";
    } else if (newPaidAmount > 0) {
      newStatus = "partially_paid";
    }
    await db13.update(invoices).set({
      paidAmount: newPaidAmount,
      status: newStatus,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and9(eq12(invoices.tenantId, tenantId), eq12(invoices.id, invoiceId)));
    return payment;
  }
};

// apps/api/src/http/routes/billing.ts
var billingRouter = Router14();
var createInvoiceSchema = z14.object({
  clientId: z14.string().uuid(),
  engagementId: z14.string().uuid().optional(),
  invoiceNumber: z14.string().min(2).max(50),
  amount: z14.number().int().min(1),
  vatAmount: z14.number().int().min(0).optional(),
  currency: z14.string().max(10).default("BDT"),
  issueDate: z14.string().transform((val) => new Date(val)),
  dueDate: z14.string().transform((val) => new Date(val)),
  remarks: z14.string().optional()
});
var recordPaymentSchema = z14.object({
  receiptNumber: z14.string().min(2).max(50),
  amount: z14.number().int().min(1),
  paymentDate: z14.string().transform((val) => new Date(val)),
  paymentMethod: z14.enum(["bank_transfer", "cheque", "cash", "online"]),
  referenceNumber: z14.string().max(100).optional(),
  remarks: z14.string().optional()
});
billingRouter.get(
  "/invoices",
  authenticate,
  requireTenantContext,
  requirePermission("billing:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const clientId = req.query.clientId;
      const engagementId = req.query.engagementId;
      const status = req.query.status;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : void 0;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : void 0;
      const list = await BillingService.listInvoices(tenantId, {
        clientId,
        engagementId,
        status,
        limit,
        offset
      });
      res.json({
        success: true,
        data: list
      });
    } catch (error) {
      next(error);
    }
  }
);
billingRouter.post(
  "/invoices",
  authenticate,
  requireTenantContext,
  requirePermission("billing:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const parseResult = createInvoiceSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid invoice payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const invoice = await BillingService.createInvoice(
        tenantId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }
);
billingRouter.post(
  "/invoices/:id/payments",
  authenticate,
  requireTenantContext,
  requirePermission("billing:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const invoiceId = req.params.id;
      const parseResult = recordPaymentSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid payment payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const payment = await BillingService.recordPayment(
        tenantId,
        invoiceId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }
);

// apps/api/src/http/routes/certificates.ts
import { Router as Router15 } from "express";
import { z as z15 } from "zod";

// apps/api/src/services/certificate.service.ts
import { createHash, randomBytes } from "crypto";
import {
  db as db14,
  digitalCertificates,
  signoffAuditLogs,
  engagements as engagements6,
  clients as clients4,
  memberships as memberships8,
  userProfiles as userProfiles9
} from "@avenquis/database";
import { eq as eq13, and as and10, desc as desc9 } from "drizzle-orm";
var CertificateService = class {
  static async signoffEngagement(tenantId, engagementId, signerMembershipId, data) {
    const engagement = await db14.query.engagements.findFirst({
      where: and10(
        eq13(engagements6.tenantId, tenantId),
        eq13(engagements6.id, engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const payload = `${tenantId}:${engagementId}:${signerMembershipId}:${data.signoffRole}:${data.action}:${Date.now()}`;
    const signedHash = createHash("sha256").update(payload).digest("hex");
    const [log] = await db14.insert(signoffAuditLogs).values({
      tenantId,
      engagementId,
      signerMembershipId,
      signoffRole: data.signoffRole,
      action: data.action,
      comments: data.comments,
      signedHash
    }).returning();
    if (data.signoffRole === "lead_partner" && data.action === "approved") {
      await db14.update(engagements6).set({
        status: "completed",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(
        and10(
          eq13(engagements6.tenantId, tenantId),
          eq13(engagements6.id, engagementId)
        )
      );
    }
    return log;
  }
  static async issueCertificate(tenantId, data) {
    const engagement = await db14.query.engagements.findFirst({
      where: and10(
        eq13(engagements6.tenantId, tenantId),
        eq13(engagements6.id, data.engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const existing = await db14.query.digitalCertificates.findFirst({
      where: and10(
        eq13(digitalCertificates.tenantId, tenantId),
        eq13(digitalCertificates.certificateNumber, data.certificateNumber)
      )
    });
    if (existing) {
      throw new ApiError(
        409,
        `Certificate number '${data.certificateNumber}' already exists in this tenant`,
        "CERTIFICATE_NUMBER_EXISTS"
      );
    }
    const signedAt = /* @__PURE__ */ new Date();
    const verificationToken = `AVQ-CERT-${randomBytes(16).toString("hex")}`;
    const rawSealPayload = `${tenantId}:${engagement.id}:${data.certificateNumber}:${data.auditOpinion}:${signedAt.toISOString()}:${data.signedByMembershipId}`;
    const digitalSealHash = createHash("sha256").update(rawSealPayload).digest("hex");
    const [certificate] = await db14.insert(digitalCertificates).values({
      tenantId,
      engagementId: data.engagementId,
      certificateNumber: data.certificateNumber,
      certificateType: data.certificateType,
      title: data.title,
      auditOpinion: data.auditOpinion,
      summaryOpinionText: data.summaryOpinionText,
      digitalSealHash,
      signedByMembershipId: data.signedByMembershipId,
      signedAt,
      verificationToken,
      status: "issued"
    }).returning();
    return certificate;
  }
  static async getCertificateById(tenantId, certificateId) {
    const cert = await db14.query.digitalCertificates.findFirst({
      where: and10(
        eq13(digitalCertificates.tenantId, tenantId),
        eq13(digitalCertificates.id, certificateId)
      )
    });
    if (!cert) {
      throw new ApiError(404, "Certificate not found", "CERTIFICATE_NOT_FOUND");
    }
    const engagement = await db14.query.engagements.findFirst({
      where: eq13(engagements6.id, cert.engagementId)
    });
    const client = engagement ? await db14.query.clients.findFirst({
      where: eq13(clients4.id, engagement.clientId)
    }) : null;
    const [signer] = await db14.select({
      membershipId: memberships8.id,
      fullName: userProfiles9.fullName,
      email: userProfiles9.email
    }).from(memberships8).innerJoin(userProfiles9, eq13(memberships8.userId, userProfiles9.id)).where(eq13(memberships8.id, cert.signedByMembershipId));
    const auditLogs = await db14.select().from(signoffAuditLogs).where(
      and10(
        eq13(signoffAuditLogs.tenantId, tenantId),
        eq13(signoffAuditLogs.engagementId, cert.engagementId)
      )
    ).orderBy(desc9(signoffAuditLogs.createdAt));
    return {
      ...cert,
      engagementTitle: engagement?.title,
      clientName: client?.name,
      signer: signer ?? null,
      auditLogs
    };
  }
  static async verifyCertificatePublic(verificationToken) {
    const cert = await db14.query.digitalCertificates.findFirst({
      where: eq13(digitalCertificates.verificationToken, verificationToken)
    });
    if (!cert) {
      throw new ApiError(
        404,
        "Invalid or expired certificate verification token",
        "INVALID_VERIFICATION_TOKEN"
      );
    }
    const engagement = await db14.query.engagements.findFirst({
      where: eq13(engagements6.id, cert.engagementId)
    });
    const client = engagement ? await db14.query.clients.findFirst({
      where: eq13(clients4.id, engagement.clientId)
    }) : null;
    const [signer] = await db14.select({
      fullName: userProfiles9.fullName
    }).from(memberships8).innerJoin(userProfiles9, eq13(memberships8.userId, userProfiles9.id)).where(eq13(memberships8.id, cert.signedByMembershipId));
    return {
      verified: cert.status === "issued",
      status: cert.status,
      certificateNumber: cert.certificateNumber,
      certificateType: cert.certificateType,
      title: cert.title,
      auditOpinion: cert.auditOpinion,
      summaryOpinionText: cert.summaryOpinionText,
      digitalSealHash: cert.digitalSealHash,
      signedAt: cert.signedAt,
      signedBy: signer?.fullName ?? "Authorized Partner",
      clientName: client?.name ?? "N/A",
      financialYear: engagement?.financialYear ?? "N/A",
      revocationReason: cert.revocationReason ?? void 0
    };
  }
  static async revokeCertificate(tenantId, certificateId, reason) {
    const cert = await db14.query.digitalCertificates.findFirst({
      where: and10(
        eq13(digitalCertificates.tenantId, tenantId),
        eq13(digitalCertificates.id, certificateId)
      )
    });
    if (!cert) {
      throw new ApiError(404, "Certificate not found", "CERTIFICATE_NOT_FOUND");
    }
    const [updated] = await db14.update(digitalCertificates).set({
      status: "revoked",
      revokedAt: /* @__PURE__ */ new Date(),
      revocationReason: reason,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and10(
        eq13(digitalCertificates.tenantId, tenantId),
        eq13(digitalCertificates.id, certificateId)
      )
    ).returning();
    return updated;
  }
};

// apps/api/src/http/routes/certificates.ts
var certificateRouter = Router15();
var signoffEngagementSchema = z15.object({
  engagementId: z15.string().uuid(),
  signoffRole: z15.enum([
    "audit_senior",
    "engagement_manager",
    "eqcr_partner",
    "lead_partner"
  ]),
  action: z15.enum(["approved", "rejected", "signed_and_sealed"]),
  comments: z15.string().optional()
});
var issueCertificateSchema = z15.object({
  engagementId: z15.string().uuid(),
  certificateNumber: z15.string().min(2).max(50),
  certificateType: z15.enum([
    "independent_auditors_report",
    "tax_clearance_certificate",
    "special_audit_certificate",
    "net_worth_certificate",
    "compliance_certificate"
  ]),
  title: z15.string().min(2).max(255),
  auditOpinion: z15.enum(["unmodified", "qualified", "adverse", "disclaimer"]),
  summaryOpinionText: z15.string().min(10)
});
var revokeCertificateSchema = z15.object({
  reason: z15.string().min(5)
});
certificateRouter.get("/verify/:token", async (req, res, next) => {
  try {
    const token = req.params.token;
    const result = await CertificateService.verifyCertificatePublic(token);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});
certificateRouter.post(
  "/signoff",
  authenticate,
  requireTenantContext,
  requirePermission("engagements:signoff"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const membershipId = req.membership.id;
      const parseResult = signoffEngagementSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid signoff payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const log = await CertificateService.signoffEngagement(
        tenantId,
        parseResult.data.engagementId,
        membershipId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: log
      });
    } catch (error) {
      next(error);
    }
  }
);
certificateRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("certificates:issue"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const membershipId = req.membership.id;
      const parseResult = issueCertificateSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid certificate payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const certificate = await CertificateService.issueCertificate(tenantId, {
        ...parseResult.data,
        signedByMembershipId: membershipId
      });
      res.status(201).json({
        success: true,
        data: certificate
      });
    } catch (error) {
      next(error);
    }
  }
);
certificateRouter.get(
  "/:id",
  authenticate,
  requireTenantContext,
  requirePermission("certificates:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const certificateId = req.params.id;
      const cert = await CertificateService.getCertificateById(
        tenantId,
        certificateId
      );
      res.json({
        success: true,
        data: cert
      });
    } catch (error) {
      next(error);
    }
  }
);
certificateRouter.patch(
  "/:id/revoke",
  authenticate,
  requireTenantContext,
  requirePermission("certificates:revoke"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const certificateId = req.params.id;
      const parseResult = revokeCertificateSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid revocation payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const revoked = await CertificateService.revokeCertificate(
        tenantId,
        certificateId,
        parseResult.data.reason
      );
      res.json({
        success: true,
        data: revoked
      });
    } catch (error) {
      next(error);
    }
  }
);

// apps/api/src/http/routes/notifications.ts
import { Router as Router16 } from "express";
import { z as z16 } from "zod";

// apps/api/src/services/notification.service.ts
import {
  db as db15,
  notifications,
  activityFeedEvents,
  memberships as memberships9,
  userProfiles as userProfiles10
} from "@avenquis/database";
import { eq as eq14, and as and11, desc as desc10, count } from "drizzle-orm";
var NotificationService = class {
  static async listNotifications(tenantId, recipientMembershipId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [
      eq14(notifications.tenantId, tenantId),
      eq14(notifications.recipientMembershipId, recipientMembershipId)
    ];
    if (options?.isRead !== void 0) {
      conditions.push(eq14(notifications.isRead, options.isRead));
    }
    const rows = await db15.select().from(notifications).where(and11(...conditions)).limit(limit).offset(offset).orderBy(desc10(notifications.createdAt));
    return rows;
  }
  static async getUnreadCount(tenantId, recipientMembershipId) {
    const [row] = await db15.select({ count: count() }).from(notifications).where(
      and11(
        eq14(notifications.tenantId, tenantId),
        eq14(notifications.recipientMembershipId, recipientMembershipId),
        eq14(notifications.isRead, false)
      )
    );
    return { unreadCount: Number(row?.count ?? 0) };
  }
  static async createNotification(tenantId, data) {
    const [notif] = await db15.insert(notifications).values({
      tenantId,
      recipientMembershipId: data.recipientMembershipId,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
      isRead: false
    }).returning();
    return notif;
  }
  static async markAsRead(tenantId, notificationId, recipientMembershipId) {
    const notif = await db15.query.notifications.findFirst({
      where: and11(
        eq14(notifications.tenantId, tenantId),
        eq14(notifications.id, notificationId),
        eq14(notifications.recipientMembershipId, recipientMembershipId)
      )
    });
    if (!notif) {
      throw new ApiError(
        404,
        "Notification not found",
        "NOTIFICATION_NOT_FOUND"
      );
    }
    const [updated] = await db15.update(notifications).set({
      isRead: true,
      readAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and11(
        eq14(notifications.tenantId, tenantId),
        eq14(notifications.id, notificationId)
      )
    ).returning();
    return updated;
  }
  static async markAllAsRead(tenantId, recipientMembershipId) {
    await db15.update(notifications).set({
      isRead: true,
      readAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and11(
        eq14(notifications.tenantId, tenantId),
        eq14(notifications.recipientMembershipId, recipientMembershipId),
        eq14(notifications.isRead, false)
      )
    );
    return { success: true };
  }
  static async listActivityFeed(tenantId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [eq14(activityFeedEvents.tenantId, tenantId)];
    if (options?.entityType) {
      conditions.push(eq14(activityFeedEvents.entityType, options.entityType));
    }
    if (options?.entityId) {
      conditions.push(eq14(activityFeedEvents.entityId, options.entityId));
    }
    const rows = await db15.select({
      id: activityFeedEvents.id,
      tenantId: activityFeedEvents.tenantId,
      actorMembershipId: activityFeedEvents.actorMembershipId,
      actorFullName: userProfiles10.fullName,
      entityType: activityFeedEvents.entityType,
      entityId: activityFeedEvents.entityId,
      action: activityFeedEvents.action,
      description: activityFeedEvents.description,
      metadata: activityFeedEvents.metadata,
      createdAt: activityFeedEvents.createdAt
    }).from(activityFeedEvents).innerJoin(
      memberships9,
      eq14(activityFeedEvents.actorMembershipId, memberships9.id)
    ).innerJoin(userProfiles10, eq14(memberships9.userId, userProfiles10.id)).where(and11(...conditions)).limit(limit).offset(offset).orderBy(desc10(activityFeedEvents.createdAt));
    return rows;
  }
  static async logActivityEvent(tenantId, actorMembershipId, data) {
    const [event] = await db15.insert(activityFeedEvents).values({
      tenantId,
      actorMembershipId,
      entityType: data.entityType,
      entityId: data.entityId,
      action: data.action,
      description: data.description,
      metadata: data.metadata
    }).returning();
    return event;
  }
};

// apps/api/src/http/routes/notifications.ts
var notificationRouter = Router16();
var createNotificationSchema = z16.object({
  recipientMembershipId: z16.string().uuid(),
  title: z16.string().min(2).max(255),
  message: z16.string().min(2),
  type: z16.enum([
    "task_assignment",
    "review_note",
    "leave_approval",
    "kyc_verification",
    "invoice_payment",
    "independence_flag",
    "system_alert"
  ]),
  link: z16.string().optional()
});
var logActivitySchema = z16.object({
  entityType: z16.enum([
    "client",
    "engagement",
    "working_paper",
    "task",
    "invoice",
    "certificate"
  ]),
  entityId: z16.string().uuid(),
  action: z16.enum([
    "created",
    "updated",
    "submitted",
    "approved",
    "rejected",
    "signed_and_sealed",
    "revoked"
  ]),
  description: z16.string().min(2),
  metadata: z16.record(z16.string(), z16.unknown()).optional()
});
notificationRouter.get(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("notifications:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const membershipId = req.membership.id;
      const isRead = req.query.isRead ? req.query.isRead === "true" : void 0;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : void 0;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : void 0;
      const list = await NotificationService.listNotifications(
        tenantId,
        membershipId,
        {
          isRead,
          limit,
          offset
        }
      );
      res.json({
        success: true,
        data: list
      });
    } catch (error) {
      next(error);
    }
  }
);
notificationRouter.get(
  "/unread-count",
  authenticate,
  requireTenantContext,
  requirePermission("notifications:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const membershipId = req.membership.id;
      const result = await NotificationService.getUnreadCount(
        tenantId,
        membershipId
      );
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);
notificationRouter.post(
  "/",
  authenticate,
  requireTenantContext,
  requirePermission("notifications:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const parseResult = createNotificationSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid notification payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const notif = await NotificationService.createNotification(
        tenantId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: notif
      });
    } catch (error) {
      next(error);
    }
  }
);
notificationRouter.patch(
  "/read-all",
  authenticate,
  requireTenantContext,
  requirePermission("notifications:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const membershipId = req.membership.id;
      const result = await NotificationService.markAllAsRead(
        tenantId,
        membershipId
      );
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);
notificationRouter.patch(
  "/:id/read",
  authenticate,
  requireTenantContext,
  requirePermission("notifications:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const notificationId = req.params.id;
      const membershipId = req.membership.id;
      const updated = await NotificationService.markAsRead(
        tenantId,
        notificationId,
        membershipId
      );
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
);
notificationRouter.get(
  "/activity",
  authenticate,
  requireTenantContext,
  requirePermission("notifications:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const entityType = req.query.entityType;
      const entityId = req.query.entityId;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : void 0;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : void 0;
      const feed = await NotificationService.listActivityFeed(tenantId, {
        entityType,
        entityId,
        limit,
        offset
      });
      res.json({
        success: true,
        data: feed
      });
    } catch (error) {
      next(error);
    }
  }
);
notificationRouter.post(
  "/activity",
  authenticate,
  requireTenantContext,
  requirePermission("notifications:create"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const membershipId = req.membership.id;
      const parseResult = logActivitySchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid activity payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const event = await NotificationService.logActivityEvent(
        tenantId,
        membershipId,
        parseResult.data
      );
      res.status(201).json({
        success: true,
        data: event
      });
    } catch (error) {
      next(error);
    }
  }
);

// apps/api/src/http/routes/analytics.ts
import { Router as Router17 } from "express";

// apps/api/src/services/analytics.service.ts
import {
  db as db16,
  clients as clients5,
  engagements as engagements7,
  studentProfiles as studentProfiles2,
  tasks as tasks3,
  timesheetEntries as timesheetEntries2,
  invoices as invoices2,
  payments as payments2,
  workingPapers as workingPapers2,
  digitalCertificates as digitalCertificates2
} from "@avenquis/database";
import { eq as eq15, and as and12, sum, count as count2 } from "drizzle-orm";
var AnalyticsService = class {
  static async getExecutiveDashboardMetrics(tenantId) {
    const [clientCountRow] = await db16.select({ count: count2() }).from(clients5).where(eq15(clients5.tenantId, tenantId));
    const totalClients = Number(clientCountRow?.count ?? 0);
    const allEngagements = await db16.select({
      id: engagements7.id,
      status: engagements7.status
    }).from(engagements7).where(eq15(engagements7.tenantId, tenantId));
    const totalEngagements = allEngagements.length;
    const engagementsByStatus = {
      planning: 0,
      field_work: 0,
      review: 0,
      completed: 0,
      cancelled: 0
    };
    for (const eng of allEngagements) {
      if (engagementsByStatus[eng.status] !== void 0) {
        engagementsByStatus[eng.status]++;
      }
    }
    const [studentCountRow] = await db16.select({ count: count2() }).from(studentProfiles2).where(eq15(studentProfiles2.tenantId, tenantId));
    const caStudentsCount = Number(studentCountRow?.count ?? 0);
    const [billedSumRow] = await db16.select({ totalBilled: sum(invoices2.totalAmount) }).from(invoices2).where(eq15(invoices2.tenantId, tenantId));
    const totalRevenueBilled = Number(billedSumRow?.totalBilled ?? 0);
    const [collectedSumRow] = await db16.select({ totalCollected: sum(payments2.amount) }).from(payments2).where(eq15(payments2.tenantId, tenantId));
    const totalRevenueCollected = Number(collectedSumRow?.totalCollected ?? 0);
    const outstandingBilling = totalRevenueBilled - totalRevenueCollected;
    const allWps = await db16.select({ status: workingPapers2.status }).from(workingPapers2).where(eq15(workingPapers2.tenantId, tenantId));
    const workingPapersByStatus = {
      draft: 0,
      prepared: 0,
      approved: 0,
      rejected: 0
    };
    for (const wp of allWps) {
      if (workingPapersByStatus[wp.status] !== void 0) {
        workingPapersByStatus[wp.status]++;
      }
    }
    const allCerts = await db16.select({
      status: digitalCertificates2.status,
      auditOpinion: digitalCertificates2.auditOpinion
    }).from(digitalCertificates2).where(eq15(digitalCertificates2.tenantId, tenantId));
    const certificatesIssuedCount = allCerts.filter(
      (c) => c.status === "issued"
    ).length;
    const certificatesByOpinion = {
      unmodified: 0,
      qualified: 0,
      adverse: 0,
      disclaimer: 0
    };
    for (const cert of allCerts) {
      if (certificatesByOpinion[cert.auditOpinion] !== void 0) {
        certificatesByOpinion[cert.auditOpinion]++;
      }
    }
    const [timesheetHoursRow] = await db16.select({ totalHours: sum(timesheetEntries2.hours) }).from(timesheetEntries2).where(eq15(timesheetEntries2.tenantId, tenantId));
    const totalLoggedHours = Number(timesheetHoursRow?.totalHours ?? 0);
    return {
      kpiSummary: {
        totalClients,
        totalEngagements,
        activeEngagements: (engagementsByStatus.planning || 0) + (engagementsByStatus.field_work || 0) + (engagementsByStatus.review || 0),
        caStudentsCount,
        totalRevenueBilled,
        totalRevenueCollected,
        outstandingBilling,
        totalLoggedHours,
        certificatesIssuedCount
      },
      engagementsByStatus,
      workingPapersByStatus,
      certificatesByOpinion
    };
  }
  static async getEngagementHealthReport(tenantId, engagementId) {
    const engagement = await db16.query.engagements.findFirst({
      where: and12(
        eq15(engagements7.tenantId, tenantId),
        eq15(engagements7.id, engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const engagementTasks = await db16.select().from(tasks3).where(
      and12(eq15(tasks3.tenantId, tenantId), eq15(tasks3.engagementId, engagementId))
    );
    const totalTasks = engagementTasks.length;
    const completedTasks = engagementTasks.filter(
      (t) => t.status === "completed"
    ).length;
    const taskCompletionPercentage = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
    const engagementWps = await db16.select().from(workingPapers2).where(
      and12(
        eq15(workingPapers2.tenantId, tenantId),
        eq15(workingPapers2.engagementId, engagementId)
      )
    );
    const totalWps = engagementWps.length;
    const approvedWps = engagementWps.filter(
      (w) => w.status === "approved"
    ).length;
    const wpApprovalPercentage = totalWps > 0 ? Math.round(approvedWps / totalWps * 100) : 0;
    const [invRow] = await db16.select({ totalBilled: sum(invoices2.totalAmount) }).from(invoices2).where(
      and12(
        eq15(invoices2.tenantId, tenantId),
        eq15(invoices2.engagementId, engagementId)
      )
    );
    const totalBilled = Number(invRow?.totalBilled ?? 0);
    return {
      engagementId: engagement.id,
      title: engagement.title,
      engagementCode: engagement.engagementCode,
      status: engagement.status,
      financialYear: engagement.financialYear,
      tasks: {
        totalTasks,
        completedTasks,
        completionPercentage: taskCompletionPercentage
      },
      workingPapers: {
        totalWps,
        approvedWps,
        approvalPercentage: wpApprovalPercentage
      },
      billing: {
        totalBilled
      }
    };
  }
};

// apps/api/src/http/routes/analytics.ts
var analyticsRouter = Router17();
analyticsRouter.get(
  "/dashboard",
  authenticate,
  requireTenantContext,
  requirePermission("analytics:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const data = await AnalyticsService.getExecutiveDashboardMetrics(tenantId);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
);
analyticsRouter.get(
  "/engagements/:id/health",
  authenticate,
  requireTenantContext,
  requirePermission("analytics:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const engagementId = req.params.id;
      const report = await AnalyticsService.getEngagementHealthReport(
        tenantId,
        engagementId
      );
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
);

// apps/api/src/http/app.ts
function createApp(testRouter) {
  const app = express2();
  app.use(requestIdMiddleware);
  app.use(loggingMiddleware);
  app.use(securityMiddlewares);
  app.get("/", (_req, res) => {
    res.status(200).json({ status: "ok", service: "avenquis-api" });
  });
  app.use("/health", healthRouter);
  app.use("/api/v1/auth/mfa", mfaRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/tenants", tenantRouter);
  app.use("/api/v1/departments", departmentRouter);
  app.use("/api/v1/designations", designationRouter);
  app.use("/api/v1/staff", staffRouter);
  app.use("/api/v1/students", studentRouter);
  app.use("/api/v1/clients", clientRouter);
  app.use("/api/v1/engagements", engagementRouter);
  app.use("/api/v1/working-papers", workingPaperRouter);
  app.use("/api/v1/tasks", taskRouter);
  app.use("/api/v1/timesheets", timesheetRouter);
  app.use("/api/v1/billing", billingRouter);
  app.use("/api/v1/certificates", certificateRouter);
  app.use("/api/v1/notifications", notificationRouter);
  app.use("/api/v1/analytics", analyticsRouter);
  if (testRouter) {
    app.use("/test", testRouter);
  }
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

// apps/api/src/bootstrap/server.ts
function startServer() {
  const app = createApp();
  const server = app.listen(env.PORT, "0.0.0.0", () => {
    logger.info(
      `AVENQUIS API listening on port ${env.PORT} in ${env.NODE_ENV} mode`
    );
  });
  setupGracefulShutdown(server);
  return server;
}
function setupGracefulShutdown(server) {
  const shutdown = (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    const timeoutId = setTimeout(() => {
      logger.error("Shutdown timed out. Forcing exit.");
      process.exit(1);
    }, 1e4);
    timeoutId.unref();
    server.close((err) => {
      clearTimeout(timeoutId);
      if (err) {
        logger.error({ err }, "Error during shutdown");
        process.exit(1);
      }
      logger.info("Graceful shutdown complete.");
      process.exit(0);
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

// apps/api/src/index.ts
startServer();
