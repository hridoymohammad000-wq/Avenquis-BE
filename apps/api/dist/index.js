"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc12) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc12 = __getOwnPropDesc(from, key)) || desc12.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// apps/api/src/http/app.ts
var import_express20 = __toESM(require("express"));

// apps/api/src/http/middlewares/request-id.ts
var import_node_crypto = require("node:crypto");
function requestIdMiddleware(req, res, next) {
  const reqId = req.get("X-Request-Id");
  const id = reqId && /^[a-zA-Z0-9-]+$/.test(reqId) ? reqId : (0, import_node_crypto.randomUUID)();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}

// apps/api/src/http/middlewares/logging.ts
var import_pino_http = require("pino-http");

// apps/api/src/logging/logger.ts
var import_pino = __toESM(require("pino"));

// apps/api/src/config/env.ts
var import_zod = require("zod");
var envSchema = import_zod.z.object({
  PORT: import_zod.z.coerce.number().default(3e3),
  NODE_ENV: import_zod.z.enum(["development", "production", "test"]).default("development"),
  JWT_SECRET: import_zod.z.string().default("avenquis_jwt_super_secret_key_production_grade_32_chars"),
  JWT_EXPIRES_IN: import_zod.z.string().default("1h"),
  REFRESH_TOKEN_SECRET: import_zod.z.string().default("avenquis_refresh_super_secret_key_production_grade_32"),
  REFRESH_TOKEN_EXPIRES_IN: import_zod.z.string().default("7d"),
  DATABASE_URL: import_zod.z.string().default("postgresql://postgres:postgres@localhost:5432/postgres")
});
var _env = envSchema.safeParse(process.env);
if (!_env.success) {
  console.error("\u274C Invalid environment variables:", _env.error.format());
  process.exit(1);
}
var env = _env.data;

// apps/api/src/logging/logger.ts
var logger = (0, import_pino.default)({
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
var loggingMiddleware = (0, import_pino_http.pinoHttp)({
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
var import_helmet = __toESM(require("helmet"));
var import_express = __toESM(require("express"));
var import_cookie_parser = __toESM(require("cookie-parser"));
var securityMiddlewares = [
  (0, import_helmet.default)(),
  // Adds secure HTTP headers and disables X-Powered-By
  (0, import_cookie_parser.default)(),
  import_express.default.json({ limit: "100kb" }),
  // Safe body parsing limit
  import_express.default.urlencoded({ extended: true, limit: "100kb" })
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
var import_express2 = require("express");
var healthRouter = (0, import_express2.Router)();
healthRouter.get("/", (req, res) => {
  res.status(200).json({
    status: "ok"
  });
});

// apps/api/src/http/routes/auth.ts
var import_express3 = require("express");
var import_zod2 = require("zod");
var import_database2 = require("@avenquis/database");
var import_drizzle_orm = require("drizzle-orm");

// apps/api/src/services/auth.service.ts
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_otplib = require("otplib");
var import_crypto = __toESM(require("crypto"));
var AuthService = class {
  static async hashPassword(password) {
    const salt = await import_bcryptjs.default.genSalt(12);
    return import_bcryptjs.default.hash(password, salt);
  }
  static async comparePassword(password, hash) {
    return import_bcryptjs.default.compare(password, hash);
  }
  static generateTokens(payload) {
    const accessToken = import_jsonwebtoken.default.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    });
    const refreshToken = import_jsonwebtoken.default.sign(payload, env.REFRESH_TOKEN_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN
    });
    return { accessToken, refreshToken };
  }
  static verifyAccessToken(token) {
    return import_jsonwebtoken.default.verify(token, env.JWT_SECRET);
  }
  static verifyRefreshToken(token) {
    return import_jsonwebtoken.default.verify(token, env.REFRESH_TOKEN_SECRET);
  }
  static generateMfaSecret(email) {
    const secret = import_otplib.authenticator.generateSecret();
    const otpauthUrl = import_otplib.authenticator.keyuri(email, "Avenquis OS", secret);
    return { secret, otpauthUrl };
  }
  static verifyMfaToken(token, secret) {
    return import_otplib.authenticator.check(token, secret);
  }
  static generateBackupCodes(count3 = 8) {
    const codes = [];
    for (let i = 0; i < count3; i++) {
      codes.push(import_crypto.default.randomBytes(4).toString("hex").toUpperCase());
    }
    return codes;
  }
};

// apps/api/src/services/audit.service.ts
var import_database = require("@avenquis/database");
var AuditService = class {
  static async logActivity(params) {
    try {
      await import_database.db.insert(import_database.activityEvents).values({
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
      await import_database.db.insert(import_database.securityEvents).values({
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
var authRouter = (0, import_express3.Router)();
var registerSchema = import_zod2.z.object({
  email: import_zod2.z.string().email(),
  password: import_zod2.z.string().min(8, "Password must be at least 8 characters long"),
  fullName: import_zod2.z.string().min(2, "Full name must be at least 2 characters long")
});
var loginSchema = import_zod2.z.object({
  email: import_zod2.z.string().email(),
  password: import_zod2.z.string().min(1, "Password is required")
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
    const existing = await import_database2.db.query.userProfiles.findFirst({
      where: (0, import_drizzle_orm.eq)(import_database2.userProfiles.email, email)
    });
    if (existing) {
      throw new ApiError(
        409,
        "User with this email already exists",
        "EMAIL_EXISTS"
      );
    }
    const passwordHash = await AuthService.hashPassword(password);
    const [newUser] = await import_database2.db.insert(import_database2.userProfiles).values({
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
    const user = await import_database2.db.query.userProfiles.findFirst({
      where: (0, import_drizzle_orm.eq)(import_database2.userProfiles.email, email)
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
    const user = await import_database2.db.query.userProfiles.findFirst({
      where: (0, import_drizzle_orm.eq)(import_database2.userProfiles.id, req.user.id)
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
var import_express4 = require("express");
var import_zod3 = require("zod");
var import_qrcode = __toESM(require("qrcode"));
var import_database3 = require("@avenquis/database");
var import_drizzle_orm2 = require("drizzle-orm");
var mfaRouter = (0, import_express4.Router)();
mfaRouter.post("/setup", authenticate, async (req, res, next) => {
  try {
    const user = await import_database3.db.query.userProfiles.findFirst({
      where: (0, import_drizzle_orm2.eq)(import_database3.userProfiles.id, req.user.id)
    });
    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }
    const { secret, otpauthUrl } = AuthService.generateMfaSecret(user.email);
    const qrCodeDataUrl = await import_qrcode.default.toDataURL(otpauthUrl);
    await import_database3.db.update(import_database3.userProfiles).set({ mfaSecret: secret, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm2.eq)(import_database3.userProfiles.id, user.id));
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
    const verifySchema = import_zod3.z.object({
      token: import_zod3.z.string().min(6).max(6)
    });
    const parseResult = verifySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(400, "Invalid MFA token", "VALIDATION_ERROR");
    }
    const user = await import_database3.db.query.userProfiles.findFirst({
      where: (0, import_drizzle_orm2.eq)(import_database3.userProfiles.id, req.user.id)
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
    await import_database3.db.update(import_database3.userProfiles).set({
      mfaEnabled: true,
      mfaBackupCodes: backupCodes,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm2.eq)(import_database3.userProfiles.id, user.id));
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
    const challengeSchema = import_zod3.z.object({
      token: import_zod3.z.string().min(6)
    });
    const parseResult = challengeSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(400, "Invalid MFA token format", "VALIDATION_ERROR");
    }
    const user = await import_database3.db.query.userProfiles.findFirst({
      where: (0, import_drizzle_orm2.eq)(import_database3.userProfiles.id, req.user.id)
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
        await import_database3.db.update(import_database3.userProfiles).set({ mfaBackupCodes: updatedBackupCodes }).where((0, import_drizzle_orm2.eq)(import_database3.userProfiles.id, user.id));
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
var import_express5 = require("express");
var import_zod4 = require("zod");

// apps/api/src/services/tenant.service.ts
var import_database4 = require("@avenquis/database");
var import_drizzle_orm3 = require("drizzle-orm");
var TenantService = class {
  static async getUserMemberships(userId) {
    return import_database4.db.select({
      membershipId: import_database4.memberships.id,
      tenantId: import_database4.memberships.tenantId,
      tenantName: import_database4.tenants.name,
      tenantSlug: import_database4.tenants.slug,
      status: import_database4.memberships.status,
      startAt: import_database4.memberships.startAt,
      expiresAt: import_database4.memberships.expiresAt
    }).from(import_database4.memberships).innerJoin(import_database4.tenants, (0, import_drizzle_orm3.eq)(import_database4.memberships.tenantId, import_database4.tenants.id)).where(
      (0, import_drizzle_orm3.and)(
        (0, import_drizzle_orm3.eq)(import_database4.memberships.userId, userId),
        (0, import_drizzle_orm3.eq)(import_database4.memberships.status, "active"),
        (0, import_drizzle_orm3.eq)(import_database4.tenants.status, "active"),
        (0, import_drizzle_orm3.lte)(import_database4.memberships.startAt, /* @__PURE__ */ new Date()),
        (0, import_drizzle_orm3.or)(
          (0, import_drizzle_orm3.isNull)(import_database4.memberships.expiresAt),
          (0, import_drizzle_orm3.gt)(import_database4.memberships.expiresAt, /* @__PURE__ */ new Date())
        )
      )
    );
  }
  static async validateTenantMembership(userId, tenantId) {
    const membership = await import_database4.db.query.memberships.findFirst({
      where: (0, import_drizzle_orm3.and)(
        (0, import_drizzle_orm3.eq)(import_database4.memberships.userId, userId),
        (0, import_drizzle_orm3.eq)(import_database4.memberships.tenantId, tenantId)
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
    const tenant = await import_database4.db.query.tenants.findFirst({
      where: (0, import_drizzle_orm3.eq)(import_database4.tenants.id, tenantId)
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
    return import_database4.db.transaction(async (tx) => {
      const [newTenant] = await tx.insert(import_database4.tenants).values({
        name: params.name,
        slug: params.slug,
        status: "active"
      }).returning();
      const [membership] = await tx.insert(import_database4.memberships).values({
        tenantId: newTenant.id,
        userId: params.ownerUserId,
        status: "active"
      }).returning();
      let adminRole = await tx.query.roles.findFirst({
        where: (0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(import_database4.roles.tenantId, newTenant.id), (0, import_drizzle_orm3.eq)(import_database4.roles.code, "admin"))
      });
      if (!adminRole) {
        const [createdRole] = await tx.insert(import_database4.roles).values({
          tenantId: newTenant.id,
          code: "admin",
          name: "Tenant Administrator",
          description: "Full administrative access to the tenant",
          isSystem: true
        }).returning();
        adminRole = createdRole;
      }
      await tx.insert(import_database4.membershipRoles).values({
        membershipId: membership.id,
        roleId: adminRole.id
      });
      return { tenant: newTenant, membership };
    });
  }
};

// apps/api/src/services/permission.service.ts
var import_database5 = require("@avenquis/database");
var import_drizzle_orm4 = require("drizzle-orm");
var PermissionService = class {
  static async getMembershipPermissions(membershipId) {
    const assignedRoles = await import_database5.db.select({ roleId: import_database5.membershipRoles.roleId }).from(import_database5.membershipRoles).where((0, import_drizzle_orm4.eq)(import_database5.membershipRoles.membershipId, membershipId));
    if (assignedRoles.length === 0) {
      return [];
    }
    const roleIds = assignedRoles.map((r) => r.roleId);
    const roleDetails = await import_database5.db.select({ code: import_database5.roles.code }).from(import_database5.roles).where((0, import_drizzle_orm4.inArray)(import_database5.roles.id, roleIds));
    if (roleDetails.some(
      (r) => r.code === "admin" || r.code === "owner" || r.code === "system_admin"
    )) {
      return ["*"];
    }
    const perms = await import_database5.db.select({ code: import_database5.permissions.code }).from(import_database5.rolePermissions).innerJoin(import_database5.permissions, (0, import_drizzle_orm4.eq)(import_database5.rolePermissions.permissionId, import_database5.permissions.id)).where((0, import_drizzle_orm4.inArray)(import_database5.rolePermissions.roleId, roleIds));
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
var tenantRouter = (0, import_express5.Router)();
var createTenantSchema = import_zod4.z.object({
  name: import_zod4.z.string().min(2, "Name must be at least 2 characters"),
  slug: import_zod4.z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
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
    const switchSchema = import_zod4.z.object({
      tenantId: import_zod4.z.string().uuid("Invalid tenant ID format")
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
var import_express6 = require("express");
var import_zod5 = require("zod");

// apps/api/src/services/staff.service.ts
var import_database6 = require("@avenquis/database");
var import_drizzle_orm5 = require("drizzle-orm");
var StaffService = class {
  // --- Departments ---
  static async listDepartments(tenantId) {
    return import_database6.db.select().from(import_database6.departments).where((0, import_drizzle_orm5.eq)(import_database6.departments.tenantId, tenantId)).orderBy(import_database6.departments.name);
  }
  static async createDepartment(tenantId, data) {
    const existing = await import_database6.db.query.departments.findFirst({
      where: (0, import_drizzle_orm5.and)(
        (0, import_drizzle_orm5.eq)(import_database6.departments.tenantId, tenantId),
        (0, import_drizzle_orm5.eq)(import_database6.departments.code, data.code.toUpperCase())
      )
    });
    if (existing) {
      throw new ApiError(
        409,
        "Department with this code already exists in this tenant",
        "DEPARTMENT_EXISTS"
      );
    }
    const [dept] = await import_database6.db.insert(import_database6.departments).values({
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
    return import_database6.db.select().from(import_database6.designations).where((0, import_drizzle_orm5.eq)(import_database6.designations.tenantId, tenantId)).orderBy((0, import_drizzle_orm5.desc)(import_database6.designations.level), import_database6.designations.name);
  }
  static async createDesignation(tenantId, data) {
    const existing = await import_database6.db.query.designations.findFirst({
      where: (0, import_drizzle_orm5.and)(
        (0, import_drizzle_orm5.eq)(import_database6.designations.tenantId, tenantId),
        (0, import_drizzle_orm5.eq)(import_database6.designations.code, data.code.toUpperCase())
      )
    });
    if (existing) {
      throw new ApiError(
        409,
        "Designation with this code already exists in this tenant",
        "DESIGNATION_EXISTS"
      );
    }
    const [desig] = await import_database6.db.insert(import_database6.designations).values({
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
    const conditions = [(0, import_drizzle_orm5.eq)(import_database6.staffProfiles.tenantId, tenantId)];
    if (options?.departmentId) {
      conditions.push((0, import_drizzle_orm5.eq)(import_database6.staffProfiles.departmentId, options.departmentId));
    }
    if (options?.designationId) {
      conditions.push((0, import_drizzle_orm5.eq)(import_database6.staffProfiles.designationId, options.designationId));
    }
    if (options?.status) {
      conditions.push((0, import_drizzle_orm5.eq)(import_database6.staffProfiles.status, options.status));
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      conditions.push(
        (0, import_drizzle_orm5.or)(
          (0, import_drizzle_orm5.ilike)(import_database6.staffProfiles.employeeCode, searchPattern),
          (0, import_drizzle_orm5.ilike)(import_database6.userProfiles.fullName, searchPattern),
          (0, import_drizzle_orm5.ilike)(import_database6.userProfiles.email, searchPattern)
        )
      );
    }
    const rows = await import_database6.db.select({
      id: import_database6.staffProfiles.id,
      tenantId: import_database6.staffProfiles.tenantId,
      membershipId: import_database6.staffProfiles.membershipId,
      employeeCode: import_database6.staffProfiles.employeeCode,
      departmentId: import_database6.staffProfiles.departmentId,
      departmentName: import_database6.departments.name,
      designationId: import_database6.staffProfiles.designationId,
      designationName: import_database6.designations.name,
      employmentType: import_database6.staffProfiles.employmentType,
      status: import_database6.staffProfiles.status,
      joiningDate: import_database6.staffProfiles.joiningDate,
      exitDate: import_database6.staffProfiles.exitDate,
      phone: import_database6.staffProfiles.phone,
      emergencyContact: import_database6.staffProfiles.emergencyContact,
      bio: import_database6.staffProfiles.bio,
      fullName: import_database6.userProfiles.fullName,
      email: import_database6.userProfiles.email,
      avatarUrl: import_database6.userProfiles.avatarUrl,
      createdAt: import_database6.staffProfiles.createdAt
    }).from(import_database6.staffProfiles).innerJoin(import_database6.memberships, (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.membershipId, import_database6.memberships.id)).innerJoin(import_database6.userProfiles, (0, import_drizzle_orm5.eq)(import_database6.memberships.userId, import_database6.userProfiles.id)).leftJoin(import_database6.departments, (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.departmentId, import_database6.departments.id)).leftJoin(import_database6.designations, (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.designationId, import_database6.designations.id)).where((0, import_drizzle_orm5.and)(...conditions)).limit(limit).offset(offset).orderBy(import_database6.staffProfiles.employeeCode);
    return rows;
  }
  static async getStaffById(tenantId, staffId) {
    const [staff] = await import_database6.db.select({
      id: import_database6.staffProfiles.id,
      tenantId: import_database6.staffProfiles.tenantId,
      membershipId: import_database6.staffProfiles.membershipId,
      employeeCode: import_database6.staffProfiles.employeeCode,
      departmentId: import_database6.staffProfiles.departmentId,
      departmentName: import_database6.departments.name,
      designationId: import_database6.staffProfiles.designationId,
      designationName: import_database6.designations.name,
      employmentType: import_database6.staffProfiles.employmentType,
      status: import_database6.staffProfiles.status,
      joiningDate: import_database6.staffProfiles.joiningDate,
      exitDate: import_database6.staffProfiles.exitDate,
      phone: import_database6.staffProfiles.phone,
      emergencyContact: import_database6.staffProfiles.emergencyContact,
      address: import_database6.staffProfiles.address,
      bio: import_database6.staffProfiles.bio,
      fullName: import_database6.userProfiles.fullName,
      email: import_database6.userProfiles.email,
      avatarUrl: import_database6.userProfiles.avatarUrl,
      createdAt: import_database6.staffProfiles.createdAt,
      updatedAt: import_database6.staffProfiles.updatedAt
    }).from(import_database6.staffProfiles).innerJoin(import_database6.memberships, (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.membershipId, import_database6.memberships.id)).innerJoin(import_database6.userProfiles, (0, import_drizzle_orm5.eq)(import_database6.memberships.userId, import_database6.userProfiles.id)).leftJoin(import_database6.departments, (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.departmentId, import_database6.departments.id)).leftJoin(import_database6.designations, (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.designationId, import_database6.designations.id)).where(
      (0, import_drizzle_orm5.and)(
        (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.tenantId, tenantId),
        (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.id, staffId)
      )
    );
    if (!staff) {
      throw new ApiError(404, "Staff profile not found", "STAFF_NOT_FOUND");
    }
    const history = await import_database6.db.select().from(import_database6.staffLifecycleEvents).where(
      (0, import_drizzle_orm5.and)(
        (0, import_drizzle_orm5.eq)(import_database6.staffLifecycleEvents.tenantId, tenantId),
        (0, import_drizzle_orm5.eq)(import_database6.staffLifecycleEvents.staffId, staffId)
      )
    ).orderBy((0, import_drizzle_orm5.desc)(import_database6.staffLifecycleEvents.effectiveDate));
    return { ...staff, lifecycleHistory: history };
  }
  static async createStaff(tenantId, data) {
    return import_database6.db.transaction(async (tx) => {
      const existingCode = await tx.query.staffProfiles.findFirst({
        where: (0, import_drizzle_orm5.and)(
          (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.tenantId, tenantId),
          (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.employeeCode, data.employeeCode)
        )
      });
      if (existingCode) {
        throw new ApiError(
          409,
          `Employee code '${data.employeeCode}' is already in use in this tenant`,
          "EMPLOYEE_CODE_EXISTS"
        );
      }
      const [newStaff] = await tx.insert(import_database6.staffProfiles).values({
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
      await tx.insert(import_database6.staffLifecycleEvents).values({
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
    const existing = await import_database6.db.query.staffProfiles.findFirst({
      where: (0, import_drizzle_orm5.and)(
        (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.tenantId, tenantId),
        (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.id, staffId)
      )
    });
    if (!existing) {
      throw new ApiError(404, "Staff profile not found", "STAFF_NOT_FOUND");
    }
    const [updated] = await import_database6.db.update(import_database6.staffProfiles).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      (0, import_drizzle_orm5.and)(
        (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.tenantId, tenantId),
        (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.id, staffId)
      )
    ).returning();
    return updated;
  }
  static async recordLifecycleEvent(tenantId, staffId, data) {
    return import_database6.db.transaction(async (tx) => {
      const staff = await tx.query.staffProfiles.findFirst({
        where: (0, import_drizzle_orm5.and)(
          (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.tenantId, tenantId),
          (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.id, staffId)
        )
      });
      if (!staff) {
        throw new ApiError(404, "Staff profile not found", "STAFF_NOT_FOUND");
      }
      const effectiveDate = data.effectiveDate ?? /* @__PURE__ */ new Date();
      const [event] = await tx.insert(import_database6.staffLifecycleEvents).values({
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
      await tx.update(import_database6.staffProfiles).set(updates).where(
        (0, import_drizzle_orm5.and)(
          (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.tenantId, tenantId),
          (0, import_drizzle_orm5.eq)(import_database6.staffProfiles.id, staffId)
        )
      );
      return event;
    });
  }
};

// apps/api/src/http/routes/departments.ts
var departmentRouter = (0, import_express6.Router)();
var createDeptSchema = import_zod5.z.object({
  name: import_zod5.z.string().min(2, "Department name must be at least 2 characters"),
  code: import_zod5.z.string().min(2, "Department code must be at least 2 characters").regex(/^[a-zA-Z0-9_-]+$/, "Department code must be alphanumeric"),
  description: import_zod5.z.string().optional(),
  headMembershipId: import_zod5.z.string().uuid().optional()
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
var import_express7 = require("express");
var import_zod6 = require("zod");
var designationRouter = (0, import_express7.Router)();
var createDesigSchema = import_zod6.z.object({
  name: import_zod6.z.string().min(2, "Designation name must be at least 2 characters"),
  code: import_zod6.z.string().min(2, "Designation code must be at least 2 characters").regex(/^[a-zA-Z0-9_-]+$/, "Designation code must be alphanumeric"),
  level: import_zod6.z.number().int().min(1).default(1),
  description: import_zod6.z.string().optional()
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
var import_express8 = require("express");
var import_zod7 = require("zod");
var staffRouter = (0, import_express8.Router)();
var createStaffSchema = import_zod7.z.object({
  membershipId: import_zod7.z.string().uuid("Invalid membership ID"),
  employeeCode: import_zod7.z.string().min(1, "Employee code is required").regex(/^[a-zA-Z0-9_-]+$/, "Employee code must be alphanumeric"),
  departmentId: import_zod7.z.string().uuid().optional(),
  designationId: import_zod7.z.string().uuid().optional(),
  employmentType: import_zod7.z.enum(["full_time", "part_time", "contract", "intern"]).default("full_time"),
  status: import_zod7.z.enum(["active", "probation", "notice_period", "exited", "suspended"]).default("active"),
  joiningDate: import_zod7.z.string().datetime().or(import_zod7.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().transform((val) => val ? new Date(val) : void 0),
  phone: import_zod7.z.string().optional(),
  emergencyContact: import_zod7.z.record(import_zod7.z.string(), import_zod7.z.unknown()).optional(),
  bio: import_zod7.z.string().optional(),
  address: import_zod7.z.record(import_zod7.z.string(), import_zod7.z.unknown()).optional()
});
var updateStaffSchema = import_zod7.z.object({
  departmentId: import_zod7.z.string().uuid().nullable().optional(),
  designationId: import_zod7.z.string().uuid().nullable().optional(),
  employmentType: import_zod7.z.enum(["full_time", "part_time", "contract", "intern"]).optional(),
  status: import_zod7.z.enum(["active", "probation", "notice_period", "exited", "suspended"]).optional(),
  phone: import_zod7.z.string().optional(),
  emergencyContact: import_zod7.z.record(import_zod7.z.string(), import_zod7.z.unknown()).optional(),
  bio: import_zod7.z.string().optional(),
  address: import_zod7.z.record(import_zod7.z.string(), import_zod7.z.unknown()).optional()
});
var lifecycleEventSchema = import_zod7.z.object({
  eventType: import_zod7.z.enum([
    "joined",
    "probation_cleared",
    "promoted",
    "transferred",
    "resigned",
    "terminated",
    "suspended",
    "reinstated"
  ]),
  effectiveDate: import_zod7.z.string().datetime().or(import_zod7.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().transform((val) => val ? new Date(val) : void 0),
  remarks: import_zod7.z.string().optional(),
  metadata: import_zod7.z.record(import_zod7.z.string(), import_zod7.z.unknown()).optional(),
  newStatus: import_zod7.z.enum(["active", "probation", "notice_period", "exited", "suspended"]).optional(),
  newDepartmentId: import_zod7.z.string().uuid().optional(),
  newDesignationId: import_zod7.z.string().uuid().optional()
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
var import_express9 = require("express");
var import_zod8 = require("zod");

// apps/api/src/services/student.service.ts
var import_database7 = require("@avenquis/database");
var import_drizzle_orm6 = require("drizzle-orm");
var StudentService = class {
  static async listStudents(tenantId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [(0, import_drizzle_orm6.eq)(import_database7.studentProfiles.tenantId, tenantId)];
    if (options?.status) {
      conditions.push((0, import_drizzle_orm6.eq)(import_database7.studentProfiles.status, options.status));
    }
    if (options?.courseLevel) {
      conditions.push((0, import_drizzle_orm6.eq)(import_database7.studentProfiles.courseLevel, options.courseLevel));
    }
    if (options?.principalMembershipId) {
      conditions.push(
        (0, import_drizzle_orm6.eq)(
          import_database7.studentProfiles.principalMembershipId,
          options.principalMembershipId
        )
      );
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      conditions.push(
        (0, import_drizzle_orm6.or)(
          (0, import_drizzle_orm6.ilike)(import_database7.studentProfiles.registrationNumber, searchPattern),
          (0, import_drizzle_orm6.ilike)(import_database7.userProfiles.fullName, searchPattern),
          (0, import_drizzle_orm6.ilike)(import_database7.userProfiles.email, searchPattern)
        )
      );
    }
    const rows = await import_database7.db.select({
      id: import_database7.studentProfiles.id,
      tenantId: import_database7.studentProfiles.tenantId,
      membershipId: import_database7.studentProfiles.membershipId,
      registrationNumber: import_database7.studentProfiles.registrationNumber,
      principalMembershipId: import_database7.studentProfiles.principalMembershipId,
      courseLevel: import_database7.studentProfiles.courseLevel,
      articleshipStartDate: import_database7.studentProfiles.articleshipStartDate,
      articleshipEndDate: import_database7.studentProfiles.articleshipEndDate,
      status: import_database7.studentProfiles.status,
      fullName: import_database7.userProfiles.fullName,
      email: import_database7.userProfiles.email,
      avatarUrl: import_database7.userProfiles.avatarUrl,
      createdAt: import_database7.studentProfiles.createdAt
    }).from(import_database7.studentProfiles).innerJoin(import_database7.memberships, (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.membershipId, import_database7.memberships.id)).innerJoin(import_database7.userProfiles, (0, import_drizzle_orm6.eq)(import_database7.memberships.userId, import_database7.userProfiles.id)).where((0, import_drizzle_orm6.and)(...conditions)).limit(limit).offset(offset).orderBy(import_database7.studentProfiles.registrationNumber);
    return rows;
  }
  static async getStudentById(tenantId, studentId) {
    const [student] = await import_database7.db.select({
      id: import_database7.studentProfiles.id,
      tenantId: import_database7.studentProfiles.tenantId,
      membershipId: import_database7.studentProfiles.membershipId,
      registrationNumber: import_database7.studentProfiles.registrationNumber,
      principalMembershipId: import_database7.studentProfiles.principalMembershipId,
      courseLevel: import_database7.studentProfiles.courseLevel,
      articleshipStartDate: import_database7.studentProfiles.articleshipStartDate,
      articleshipEndDate: import_database7.studentProfiles.articleshipEndDate,
      status: import_database7.studentProfiles.status,
      emergencyContact: import_database7.studentProfiles.emergencyContact,
      address: import_database7.studentProfiles.address,
      fullName: import_database7.userProfiles.fullName,
      email: import_database7.userProfiles.email,
      avatarUrl: import_database7.userProfiles.avatarUrl,
      createdAt: import_database7.studentProfiles.createdAt,
      updatedAt: import_database7.studentProfiles.updatedAt
    }).from(import_database7.studentProfiles).innerJoin(import_database7.memberships, (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.membershipId, import_database7.memberships.id)).innerJoin(import_database7.userProfiles, (0, import_drizzle_orm6.eq)(import_database7.memberships.userId, import_database7.userProfiles.id)).where(
      (0, import_drizzle_orm6.and)(
        (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.tenantId, tenantId),
        (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.id, studentId)
      )
    );
    if (!student) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }
    const trainingRecords = await import_database7.db.select().from(import_database7.studentTrainingRecords).where(
      (0, import_drizzle_orm6.and)(
        (0, import_drizzle_orm6.eq)(import_database7.studentTrainingRecords.tenantId, tenantId),
        (0, import_drizzle_orm6.eq)(import_database7.studentTrainingRecords.studentId, studentId)
      )
    ).orderBy((0, import_drizzle_orm6.desc)(import_database7.studentTrainingRecords.createdAt));
    const leaveRecords = await import_database7.db.select().from(import_database7.studentLeaveRecords).where(
      (0, import_drizzle_orm6.and)(
        (0, import_drizzle_orm6.eq)(import_database7.studentLeaveRecords.tenantId, tenantId),
        (0, import_drizzle_orm6.eq)(import_database7.studentLeaveRecords.studentId, studentId)
      )
    ).orderBy((0, import_drizzle_orm6.desc)(import_database7.studentLeaveRecords.startDate));
    const examRecords = await import_database7.db.select().from(import_database7.studentExamRecords).where(
      (0, import_drizzle_orm6.and)(
        (0, import_drizzle_orm6.eq)(import_database7.studentExamRecords.tenantId, tenantId),
        (0, import_drizzle_orm6.eq)(import_database7.studentExamRecords.studentId, studentId)
      )
    ).orderBy((0, import_drizzle_orm6.desc)(import_database7.studentExamRecords.createdAt));
    const assignmentHistory = await import_database7.db.select().from(import_database7.studentAssignmentHistory).where(
      (0, import_drizzle_orm6.and)(
        (0, import_drizzle_orm6.eq)(import_database7.studentAssignmentHistory.tenantId, tenantId),
        (0, import_drizzle_orm6.eq)(import_database7.studentAssignmentHistory.studentId, studentId)
      )
    ).orderBy((0, import_drizzle_orm6.desc)(import_database7.studentAssignmentHistory.startDate));
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
    const existing = await import_database7.db.query.studentProfiles.findFirst({
      where: (0, import_drizzle_orm6.and)(
        (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.tenantId, tenantId),
        (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.registrationNumber, data.registrationNumber)
      )
    });
    if (existing) {
      throw new ApiError(
        409,
        `Student registration number '${data.registrationNumber}' already exists in this tenant`,
        "REGISTRATION_NUMBER_EXISTS"
      );
    }
    const [newStudent] = await import_database7.db.insert(import_database7.studentProfiles).values({
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
    const existing = await import_database7.db.query.studentProfiles.findFirst({
      where: (0, import_drizzle_orm6.and)(
        (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.tenantId, tenantId),
        (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.id, studentId)
      )
    });
    if (!existing) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }
    const [updated] = await import_database7.db.update(import_database7.studentProfiles).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      (0, import_drizzle_orm6.and)(
        (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.tenantId, tenantId),
        (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.id, studentId)
      )
    ).returning();
    return updated;
  }
  static async logTraining(tenantId, studentId, data) {
    const student = await import_database7.db.query.studentProfiles.findFirst({
      where: (0, import_drizzle_orm6.and)(
        (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.tenantId, tenantId),
        (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.id, studentId)
      )
    });
    if (!student) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }
    const [record] = await import_database7.db.insert(import_database7.studentTrainingRecords).values({
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
    const student = await import_database7.db.query.studentProfiles.findFirst({
      where: (0, import_drizzle_orm6.and)(
        (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.tenantId, tenantId),
        (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.id, studentId)
      )
    });
    if (!student) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }
    const [leave] = await import_database7.db.insert(import_database7.studentLeaveRecords).values({
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
    const existing = await import_database7.db.query.studentLeaveRecords.findFirst({
      where: (0, import_drizzle_orm6.and)(
        (0, import_drizzle_orm6.eq)(import_database7.studentLeaveRecords.tenantId, tenantId),
        (0, import_drizzle_orm6.eq)(import_database7.studentLeaveRecords.id, leaveId)
      )
    });
    if (!existing) {
      throw new ApiError(404, "Leave record not found", "LEAVE_NOT_FOUND");
    }
    const [updated] = await import_database7.db.update(import_database7.studentLeaveRecords).set({
      status: data.status,
      approvedByMembershipId: data.approvedByMembershipId,
      remarks: data.remarks ?? existing.remarks,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      (0, import_drizzle_orm6.and)(
        (0, import_drizzle_orm6.eq)(import_database7.studentLeaveRecords.tenantId, tenantId),
        (0, import_drizzle_orm6.eq)(import_database7.studentLeaveRecords.id, leaveId)
      )
    ).returning();
    return updated;
  }
  static async recordExamResult(tenantId, studentId, data) {
    const student = await import_database7.db.query.studentProfiles.findFirst({
      where: (0, import_drizzle_orm6.and)(
        (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.tenantId, tenantId),
        (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.id, studentId)
      )
    });
    if (!student) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }
    const [exam] = await import_database7.db.insert(import_database7.studentExamRecords).values({
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
      await import_database7.db.update(import_database7.studentProfiles).set({ courseLevel: "application", updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm6.eq)(import_database7.studentProfiles.id, studentId));
    }
    return exam;
  }
  static async logAssignment(tenantId, studentId, data) {
    const student = await import_database7.db.query.studentProfiles.findFirst({
      where: (0, import_drizzle_orm6.and)(
        (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.tenantId, tenantId),
        (0, import_drizzle_orm6.eq)(import_database7.studentProfiles.id, studentId)
      )
    });
    if (!student) {
      throw new ApiError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }
    const [assignment] = await import_database7.db.insert(import_database7.studentAssignmentHistory).values({
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
var studentRouter = (0, import_express9.Router)();
var createStudentSchema = import_zod8.z.object({
  membershipId: import_zod8.z.string().uuid(),
  registrationNumber: import_zod8.z.string().min(2).max(100),
  principalMembershipId: import_zod8.z.string().uuid().optional(),
  courseLevel: import_zod8.z.enum(["knowledge", "application", "advanced"]).default("knowledge"),
  articleshipStartDate: import_zod8.z.string().transform((val) => new Date(val)).optional(),
  articleshipEndDate: import_zod8.z.string().transform((val) => new Date(val)).optional(),
  status: import_zod8.z.enum(["active", "completed", "transferred", "suspended"]).default("active"),
  emergencyContact: import_zod8.z.record(import_zod8.z.string(), import_zod8.z.unknown()).optional(),
  address: import_zod8.z.record(import_zod8.z.string(), import_zod8.z.unknown()).optional()
});
var updateStudentSchema = import_zod8.z.object({
  courseLevel: import_zod8.z.enum(["knowledge", "application", "advanced"]).optional(),
  principalMembershipId: import_zod8.z.string().uuid().nullable().optional(),
  articleshipEndDate: import_zod8.z.string().transform((val) => new Date(val)).nullable().optional(),
  status: import_zod8.z.enum(["active", "completed", "transferred", "suspended"]).optional(),
  emergencyContact: import_zod8.z.record(import_zod8.z.string(), import_zod8.z.unknown()).optional(),
  address: import_zod8.z.record(import_zod8.z.string(), import_zod8.z.unknown()).optional()
});
var logTrainingSchema = import_zod8.z.object({
  topic: import_zod8.z.string().min(2).max(255),
  hoursCompleted: import_zod8.z.number().int().min(1),
  supervisorMembershipId: import_zod8.z.string().uuid().optional(),
  remarks: import_zod8.z.string().optional(),
  verifyNow: import_zod8.z.boolean().optional()
});
var applyLeaveSchema = import_zod8.z.object({
  leaveType: import_zod8.z.enum(["study", "exam", "sick", "casual"]),
  startDate: import_zod8.z.string().transform((val) => new Date(val)),
  endDate: import_zod8.z.string().transform((val) => new Date(val)),
  totalDays: import_zod8.z.number().int().min(1),
  remarks: import_zod8.z.string().optional()
});
var updateLeaveStatusSchema = import_zod8.z.object({
  status: import_zod8.z.enum(["approved", "rejected"]),
  remarks: import_zod8.z.string().optional()
});
var recordExamSchema = import_zod8.z.object({
  session: import_zod8.z.string().min(2).max(100),
  level: import_zod8.z.enum(["knowledge", "application", "advanced"]),
  subject: import_zod8.z.string().min(2).max(255),
  resultStatus: import_zod8.z.enum(["passed", "failed", "appeared"]),
  marks: import_zod8.z.number().int().min(0).max(100).optional(),
  examDate: import_zod8.z.string().transform((val) => new Date(val)).optional()
});
var logAssignmentSchema = import_zod8.z.object({
  clientName: import_zod8.z.string().min(2).max(255),
  role: import_zod8.z.string().min(2).max(100),
  startDate: import_zod8.z.string().transform((val) => new Date(val)),
  endDate: import_zod8.z.string().transform((val) => new Date(val)).optional(),
  hoursLogged: import_zod8.z.number().int().min(0).optional(),
  remarks: import_zod8.z.string().optional()
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
var import_express10 = require("express");
var import_zod9 = require("zod");

// apps/api/src/services/client.service.ts
var import_database8 = require("@avenquis/database");
var import_drizzle_orm7 = require("drizzle-orm");
var ClientService = class {
  static async listClients(tenantId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [(0, import_drizzle_orm7.eq)(import_database8.clients.tenantId, tenantId)];
    if (options?.status) {
      conditions.push((0, import_drizzle_orm7.eq)(import_database8.clients.status, options.status));
    }
    if (options?.clientType) {
      conditions.push((0, import_drizzle_orm7.eq)(import_database8.clients.clientType, options.clientType));
    }
    if (options?.riskRating) {
      conditions.push((0, import_drizzle_orm7.eq)(import_database8.clients.riskRating, options.riskRating));
    }
    if (options?.kycStatus) {
      conditions.push((0, import_drizzle_orm7.eq)(import_database8.clients.kycStatus, options.kycStatus));
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      const condOr = (0, import_drizzle_orm7.or)(
        (0, import_drizzle_orm7.ilike)(import_database8.clients.name, searchPattern),
        (0, import_drizzle_orm7.ilike)(import_database8.clients.clientCode, searchPattern),
        (0, import_drizzle_orm7.ilike)(import_database8.clients.primaryEmail, searchPattern)
      );
      if (condOr) conditions.push(condOr);
    }
    const rows = await import_database8.db.select().from(import_database8.clients).where((0, import_drizzle_orm7.and)(...conditions)).limit(limit).offset(offset).orderBy((0, import_drizzle_orm7.desc)(import_database8.clients.createdAt));
    return rows;
  }
  static async createClient(tenantId, data) {
    const existing = await import_database8.db.query.clients.findFirst({
      where: (0, import_drizzle_orm7.and)(
        (0, import_drizzle_orm7.eq)(import_database8.clients.tenantId, tenantId),
        (0, import_drizzle_orm7.eq)(import_database8.clients.clientCode, data.clientCode)
      )
    });
    if (existing) {
      throw new ApiError(
        409,
        `Client code '${data.clientCode}' already exists in this tenant`,
        "CLIENT_CODE_EXISTS"
      );
    }
    const [client] = await import_database8.db.insert(import_database8.clients).values({
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
    const client = await import_database8.db.query.clients.findFirst({
      where: (0, import_drizzle_orm7.and)((0, import_drizzle_orm7.eq)(import_database8.clients.tenantId, tenantId), (0, import_drizzle_orm7.eq)(import_database8.clients.id, clientId))
    });
    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }
    const contacts = await import_database8.db.select().from(import_database8.clientContacts).where(
      (0, import_drizzle_orm7.and)(
        (0, import_drizzle_orm7.eq)(import_database8.clientContacts.tenantId, tenantId),
        (0, import_drizzle_orm7.eq)(import_database8.clientContacts.clientId, clientId)
      )
    ).orderBy((0, import_drizzle_orm7.desc)(import_database8.clientContacts.isPrimary), import_database8.clientContacts.fullName);
    const kycDocuments = await import_database8.db.select().from(import_database8.clientKycDocuments).where(
      (0, import_drizzle_orm7.and)(
        (0, import_drizzle_orm7.eq)(import_database8.clientKycDocuments.tenantId, tenantId),
        (0, import_drizzle_orm7.eq)(import_database8.clientKycDocuments.clientId, clientId)
      )
    ).orderBy((0, import_drizzle_orm7.desc)(import_database8.clientKycDocuments.createdAt));
    let leadPartner = null;
    if (client.leadPartnerMembershipId) {
      const [partnerRow] = await import_database8.db.select({
        membershipId: import_database8.memberships.id,
        fullName: import_database8.userProfiles.fullName,
        email: import_database8.userProfiles.email
      }).from(import_database8.memberships).innerJoin(import_database8.userProfiles, (0, import_drizzle_orm7.eq)(import_database8.memberships.userId, import_database8.userProfiles.id)).where((0, import_drizzle_orm7.eq)(import_database8.memberships.id, client.leadPartnerMembershipId));
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
    const client = await import_database8.db.query.clients.findFirst({
      where: (0, import_drizzle_orm7.and)((0, import_drizzle_orm7.eq)(import_database8.clients.tenantId, tenantId), (0, import_drizzle_orm7.eq)(import_database8.clients.id, clientId))
    });
    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }
    const [updated] = await import_database8.db.update(import_database8.clients).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm7.and)((0, import_drizzle_orm7.eq)(import_database8.clients.tenantId, tenantId), (0, import_drizzle_orm7.eq)(import_database8.clients.id, clientId))).returning();
    return updated;
  }
  static async addContact(tenantId, clientId, data) {
    const client = await import_database8.db.query.clients.findFirst({
      where: (0, import_drizzle_orm7.and)((0, import_drizzle_orm7.eq)(import_database8.clients.tenantId, tenantId), (0, import_drizzle_orm7.eq)(import_database8.clients.id, clientId))
    });
    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }
    if (data.isPrimary) {
      await import_database8.db.update(import_database8.clientContacts).set({ isPrimary: false }).where(
        (0, import_drizzle_orm7.and)(
          (0, import_drizzle_orm7.eq)(import_database8.clientContacts.tenantId, tenantId),
          (0, import_drizzle_orm7.eq)(import_database8.clientContacts.clientId, clientId)
        )
      );
    }
    const [contact] = await import_database8.db.insert(import_database8.clientContacts).values({
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
    const client = await import_database8.db.query.clients.findFirst({
      where: (0, import_drizzle_orm7.and)((0, import_drizzle_orm7.eq)(import_database8.clients.tenantId, tenantId), (0, import_drizzle_orm7.eq)(import_database8.clients.id, clientId))
    });
    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }
    const [document] = await import_database8.db.insert(import_database8.clientKycDocuments).values({
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
    const doc = await import_database8.db.query.clientKycDocuments.findFirst({
      where: (0, import_drizzle_orm7.and)(
        (0, import_drizzle_orm7.eq)(import_database8.clientKycDocuments.tenantId, tenantId),
        (0, import_drizzle_orm7.eq)(import_database8.clientKycDocuments.id, documentId)
      )
    });
    if (!doc) {
      throw new ApiError(
        404,
        "KYC document record not found",
        "KYC_DOCUMENT_NOT_FOUND"
      );
    }
    const [updatedDoc] = await import_database8.db.update(import_database8.clientKycDocuments).set({
      verificationStatus: data.verificationStatus,
      verifiedByMembershipId: data.verifierMembershipId,
      verifiedAt: /* @__PURE__ */ new Date(),
      remarks: data.remarks ?? doc.remarks,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      (0, import_drizzle_orm7.and)(
        (0, import_drizzle_orm7.eq)(import_database8.clientKycDocuments.tenantId, tenantId),
        (0, import_drizzle_orm7.eq)(import_database8.clientKycDocuments.id, documentId)
      )
    ).returning();
    const allDocs = await import_database8.db.select().from(import_database8.clientKycDocuments).where(
      (0, import_drizzle_orm7.and)(
        (0, import_drizzle_orm7.eq)(import_database8.clientKycDocuments.tenantId, tenantId),
        (0, import_drizzle_orm7.eq)(import_database8.clientKycDocuments.clientId, doc.clientId)
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
    await import_database8.db.update(import_database8.clients).set({ kycStatus: newKycStatus, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm7.and)((0, import_drizzle_orm7.eq)(import_database8.clients.tenantId, tenantId), (0, import_drizzle_orm7.eq)(import_database8.clients.id, doc.clientId)));
    return updatedDoc;
  }
  static async updateRiskRating(tenantId, clientId, riskRating) {
    const client = await import_database8.db.query.clients.findFirst({
      where: (0, import_drizzle_orm7.and)((0, import_drizzle_orm7.eq)(import_database8.clients.tenantId, tenantId), (0, import_drizzle_orm7.eq)(import_database8.clients.id, clientId))
    });
    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }
    const [updated] = await import_database8.db.update(import_database8.clients).set({
      riskRating,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm7.and)((0, import_drizzle_orm7.eq)(import_database8.clients.tenantId, tenantId), (0, import_drizzle_orm7.eq)(import_database8.clients.id, clientId))).returning();
    return updated;
  }
};

// apps/api/src/http/routes/clients.ts
var clientRouter = (0, import_express10.Router)();
var createClientSchema = import_zod9.z.object({
  clientCode: import_zod9.z.string().min(2).max(50),
  name: import_zod9.z.string().min(2).max(255),
  clientType: import_zod9.z.enum([
    "corporate",
    "individual",
    "government",
    "non_profit",
    "partnership"
  ]),
  industry: import_zod9.z.string().max(100).optional(),
  taxIdentificationNumber: import_zod9.z.string().max(100).optional(),
  businessRegistrationNumber: import_zod9.z.string().max(100).optional(),
  primaryEmail: import_zod9.z.string().email().optional(),
  primaryPhone: import_zod9.z.string().max(50).optional(),
  address: import_zod9.z.record(import_zod9.z.string(), import_zod9.z.unknown()).optional(),
  riskRating: import_zod9.z.enum(["low", "medium", "high", "unassessed"]).default("unassessed"),
  kycStatus: import_zod9.z.enum(["pending", "verified", "expired", "rejected"]).default("pending"),
  status: import_zod9.z.enum(["active", "onboarding", "inactive", "blacklisted"]).default("active"),
  leadPartnerMembershipId: import_zod9.z.string().uuid().optional()
});
var updateClientSchema = createClientSchema.partial().omit({
  clientCode: true
});
var addContactSchema = import_zod9.z.object({
  fullName: import_zod9.z.string().min(2).max(255),
  designation: import_zod9.z.string().max(100).optional(),
  email: import_zod9.z.string().email().optional(),
  phone: import_zod9.z.string().max(50).optional(),
  isPrimary: import_zod9.z.boolean().default(false),
  notes: import_zod9.z.string().optional()
});
var uploadKycSchema = import_zod9.z.object({
  documentType: import_zod9.z.enum([
    "trade_license",
    "tin_certificate",
    "vat_certificate",
    "incorporation_cert",
    "nid_passport",
    "utility_bill"
  ]),
  documentNumber: import_zod9.z.string().max(100).optional(),
  fileUrl: import_zod9.z.string().url().optional(),
  expiryDate: import_zod9.z.string().transform((val) => new Date(val)).optional(),
  remarks: import_zod9.z.string().optional()
});
var verifyKycSchema = import_zod9.z.object({
  verificationStatus: import_zod9.z.enum(["verified", "rejected"]),
  remarks: import_zod9.z.string().optional()
});
var updateRiskSchema = import_zod9.z.object({
  riskRating: import_zod9.z.enum(["low", "medium", "high", "unassessed"])
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
var import_express11 = require("express");
var import_zod10 = require("zod");

// apps/api/src/services/engagement.service.ts
var import_database9 = require("@avenquis/database");
var import_drizzle_orm8 = require("drizzle-orm");
var EngagementService = class {
  static async listEngagements(tenantId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [(0, import_drizzle_orm8.eq)(import_database9.engagements.tenantId, tenantId)];
    if (options?.clientId) {
      conditions.push((0, import_drizzle_orm8.eq)(import_database9.engagements.clientId, options.clientId));
    }
    if (options?.status) {
      conditions.push((0, import_drizzle_orm8.eq)(import_database9.engagements.status, options.status));
    }
    if (options?.engagementType) {
      conditions.push((0, import_drizzle_orm8.eq)(import_database9.engagements.engagementType, options.engagementType));
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      const condOr = (0, import_drizzle_orm8.or)(
        (0, import_drizzle_orm8.ilike)(import_database9.engagements.title, searchPattern),
        (0, import_drizzle_orm8.ilike)(import_database9.engagements.engagementCode, searchPattern),
        (0, import_drizzle_orm8.ilike)(import_database9.engagements.financialYear, searchPattern)
      );
      if (condOr) conditions.push(condOr);
    }
    const rows = await import_database9.db.select({
      id: import_database9.engagements.id,
      tenantId: import_database9.engagements.tenantId,
      clientId: import_database9.engagements.clientId,
      clientName: import_database9.clients.name,
      clientCode: import_database9.clients.clientCode,
      engagementCode: import_database9.engagements.engagementCode,
      title: import_database9.engagements.title,
      engagementType: import_database9.engagements.engagementType,
      financialYear: import_database9.engagements.financialYear,
      startDate: import_database9.engagements.startDate,
      endDate: import_database9.engagements.endDate,
      budgetedHours: import_database9.engagements.budgetedHours,
      budgetedFee: import_database9.engagements.budgetedFee,
      currency: import_database9.engagements.currency,
      status: import_database9.engagements.status,
      independenceCleared: import_database9.engagements.independenceCleared,
      createdAt: import_database9.engagements.createdAt
    }).from(import_database9.engagements).innerJoin(import_database9.clients, (0, import_drizzle_orm8.eq)(import_database9.engagements.clientId, import_database9.clients.id)).where((0, import_drizzle_orm8.and)(...conditions)).limit(limit).offset(offset).orderBy((0, import_drizzle_orm8.desc)(import_database9.engagements.createdAt));
    return rows;
  }
  static async createEngagement(tenantId, data) {
    const client = await import_database9.db.query.clients.findFirst({
      where: (0, import_drizzle_orm8.and)((0, import_drizzle_orm8.eq)(import_database9.clients.tenantId, tenantId), (0, import_drizzle_orm8.eq)(import_database9.clients.id, data.clientId))
    });
    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }
    const existing = await import_database9.db.query.engagements.findFirst({
      where: (0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(import_database9.engagements.tenantId, tenantId),
        (0, import_drizzle_orm8.eq)(import_database9.engagements.engagementCode, data.engagementCode)
      )
    });
    if (existing) {
      throw new ApiError(
        409,
        `Engagement code '${data.engagementCode}' already exists in this tenant`,
        "ENGAGEMENT_CODE_EXISTS"
      );
    }
    const [engagement] = await import_database9.db.insert(import_database9.engagements).values({
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
    const engagement = await import_database9.db.query.engagements.findFirst({
      where: (0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(import_database9.engagements.tenantId, tenantId),
        (0, import_drizzle_orm8.eq)(import_database9.engagements.id, engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const client = await import_database9.db.query.clients.findFirst({
      where: (0, import_drizzle_orm8.eq)(import_database9.clients.id, engagement.clientId)
    });
    const teamMembers = await import_database9.db.select({
      id: import_database9.engagementTeamMembers.id,
      membershipId: import_database9.engagementTeamMembers.membershipId,
      role: import_database9.engagementTeamMembers.role,
      allocatedHours: import_database9.engagementTeamMembers.allocatedHours,
      startDate: import_database9.engagementTeamMembers.startDate,
      endDate: import_database9.engagementTeamMembers.endDate,
      fullName: import_database9.userProfiles.fullName,
      email: import_database9.userProfiles.email
    }).from(import_database9.engagementTeamMembers).innerJoin(
      import_database9.memberships,
      (0, import_drizzle_orm8.eq)(import_database9.engagementTeamMembers.membershipId, import_database9.memberships.id)
    ).innerJoin(import_database9.userProfiles, (0, import_drizzle_orm8.eq)(import_database9.memberships.userId, import_database9.userProfiles.id)).where(
      (0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(import_database9.engagementTeamMembers.tenantId, tenantId),
        (0, import_drizzle_orm8.eq)(import_database9.engagementTeamMembers.engagementId, engagementId)
      )
    );
    const independenceDeclarations = await import_database9.db.select({
      id: import_database9.engagementIndependenceDeclarations.id,
      membershipId: import_database9.engagementIndependenceDeclarations.membershipId,
      declarationStatus: import_database9.engagementIndependenceDeclarations.declarationStatus,
      hasFinancialInterest: import_database9.engagementIndependenceDeclarations.hasFinancialInterest,
      hasPersonalRelationship: import_database9.engagementIndependenceDeclarations.hasPersonalRelationship,
      remarks: import_database9.engagementIndependenceDeclarations.remarks,
      clearedAt: import_database9.engagementIndependenceDeclarations.clearedAt,
      fullName: import_database9.userProfiles.fullName
    }).from(import_database9.engagementIndependenceDeclarations).innerJoin(
      import_database9.memberships,
      (0, import_drizzle_orm8.eq)(import_database9.engagementIndependenceDeclarations.membershipId, import_database9.memberships.id)
    ).innerJoin(import_database9.userProfiles, (0, import_drizzle_orm8.eq)(import_database9.memberships.userId, import_database9.userProfiles.id)).where(
      (0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(import_database9.engagementIndependenceDeclarations.tenantId, tenantId),
        (0, import_drizzle_orm8.eq)(import_database9.engagementIndependenceDeclarations.engagementId, engagementId)
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
    const engagement = await import_database9.db.query.engagements.findFirst({
      where: (0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(import_database9.engagements.tenantId, tenantId),
        (0, import_drizzle_orm8.eq)(import_database9.engagements.id, engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const [updated] = await import_database9.db.update(import_database9.engagements).set({
      status,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      (0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(import_database9.engagements.tenantId, tenantId),
        (0, import_drizzle_orm8.eq)(import_database9.engagements.id, engagementId)
      )
    ).returning();
    return updated;
  }
  static async assignTeamMember(tenantId, engagementId, data) {
    const engagement = await import_database9.db.query.engagements.findFirst({
      where: (0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(import_database9.engagements.tenantId, tenantId),
        (0, import_drizzle_orm8.eq)(import_database9.engagements.id, engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const existing = await import_database9.db.query.engagementTeamMembers.findFirst({
      where: (0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(import_database9.engagementTeamMembers.tenantId, tenantId),
        (0, import_drizzle_orm8.eq)(import_database9.engagementTeamMembers.engagementId, engagementId),
        (0, import_drizzle_orm8.eq)(import_database9.engagementTeamMembers.membershipId, data.membershipId)
      )
    });
    let member;
    if (existing) {
      [member] = await import_database9.db.update(import_database9.engagementTeamMembers).set({
        role: data.role,
        allocatedHours: data.allocatedHours ?? existing.allocatedHours,
        startDate: data.startDate ?? existing.startDate,
        endDate: data.endDate ?? existing.endDate,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm8.eq)(import_database9.engagementTeamMembers.id, existing.id)).returning();
    } else {
      [member] = await import_database9.db.insert(import_database9.engagementTeamMembers).values({
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
    const existing = await import_database9.db.query.engagementTeamMembers.findFirst({
      where: (0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(import_database9.engagementTeamMembers.tenantId, tenantId),
        (0, import_drizzle_orm8.eq)(import_database9.engagementTeamMembers.engagementId, engagementId),
        (0, import_drizzle_orm8.eq)(import_database9.engagementTeamMembers.membershipId, membershipId)
      )
    });
    if (!existing) {
      throw new ApiError(
        404,
        "Team member assignment not found",
        "TEAM_MEMBER_NOT_FOUND"
      );
    }
    await import_database9.db.delete(import_database9.engagementTeamMembers).where((0, import_drizzle_orm8.eq)(import_database9.engagementTeamMembers.id, existing.id));
    return { success: true };
  }
  static async submitIndependenceDeclaration(tenantId, engagementId, membershipId, data) {
    const engagement = await import_database9.db.query.engagements.findFirst({
      where: (0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(import_database9.engagements.tenantId, tenantId),
        (0, import_drizzle_orm8.eq)(import_database9.engagements.id, engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const hasConflict = data.hasFinancialInterest || data.hasPersonalRelationship;
    const declarationStatus = hasConflict ? "conflict_flagged" : "cleared";
    const existing = await import_database9.db.query.engagementIndependenceDeclarations.findFirst({
      where: (0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(import_database9.engagementIndependenceDeclarations.tenantId, tenantId),
        (0, import_drizzle_orm8.eq)(import_database9.engagementIndependenceDeclarations.engagementId, engagementId),
        (0, import_drizzle_orm8.eq)(import_database9.engagementIndependenceDeclarations.membershipId, membershipId)
      )
    });
    let declaration;
    if (existing) {
      [declaration] = await import_database9.db.update(import_database9.engagementIndependenceDeclarations).set({
        declarationStatus,
        hasFinancialInterest: data.hasFinancialInterest,
        hasPersonalRelationship: data.hasPersonalRelationship,
        remarks: data.remarks,
        clearedAt: hasConflict ? null : /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm8.eq)(import_database9.engagementIndependenceDeclarations.id, existing.id)).returning();
    } else {
      [declaration] = await import_database9.db.insert(import_database9.engagementIndependenceDeclarations).values({
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
    const allDeclarations = await import_database9.db.select().from(import_database9.engagementIndependenceDeclarations).where(
      (0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(import_database9.engagementIndependenceDeclarations.tenantId, tenantId),
        (0, import_drizzle_orm8.eq)(import_database9.engagementIndependenceDeclarations.engagementId, engagementId)
      )
    );
    const hasDeclarations = allDeclarations.length > 0;
    const allCleared = hasDeclarations && allDeclarations.every((d) => d.declarationStatus === "cleared");
    await import_database9.db.update(import_database9.engagements).set({
      independenceCleared: allCleared,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      (0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(import_database9.engagements.tenantId, tenantId),
        (0, import_drizzle_orm8.eq)(import_database9.engagements.id, engagementId)
      )
    );
    return declaration;
  }
};

// apps/api/src/http/routes/engagements.ts
var engagementRouter = (0, import_express11.Router)();
var createEngagementSchema = import_zod10.z.object({
  clientId: import_zod10.z.string().uuid(),
  engagementCode: import_zod10.z.string().min(2).max(50),
  title: import_zod10.z.string().min(2).max(255),
  engagementType: import_zod10.z.enum([
    "statutory_audit",
    "tax_advisory",
    "accounting_services",
    "special_audit",
    "vat_consulting",
    "valuation_advisory"
  ]),
  financialYear: import_zod10.z.string().min(2).max(50),
  startDate: import_zod10.z.string().transform((val) => new Date(val)),
  endDate: import_zod10.z.string().transform((val) => new Date(val)).optional(),
  budgetedHours: import_zod10.z.number().int().min(0).optional(),
  budgetedFee: import_zod10.z.number().int().min(0).optional(),
  currency: import_zod10.z.string().max(10).default("BDT"),
  engagementPartnerMembershipId: import_zod10.z.string().uuid().optional(),
  engagementManagerMembershipId: import_zod10.z.string().uuid().optional(),
  auditQualityReviewerMembershipId: import_zod10.z.string().uuid().optional()
});
var updateStatusSchema = import_zod10.z.object({
  status: import_zod10.z.enum([
    "planning",
    "fieldwork",
    "review",
    "partner_signoff",
    "completed",
    "archived"
  ])
});
var assignTeamMemberSchema = import_zod10.z.object({
  membershipId: import_zod10.z.string().uuid(),
  role: import_zod10.z.enum([
    "lead_partner",
    "engagement_manager",
    "senior_auditor",
    "staff_auditor",
    "article_student",
    "eqcr_partner"
  ]),
  allocatedHours: import_zod10.z.number().int().min(0).optional(),
  startDate: import_zod10.z.string().transform((val) => new Date(val)).optional(),
  endDate: import_zod10.z.string().transform((val) => new Date(val)).optional()
});
var submitIndependenceSchema = import_zod10.z.object({
  hasFinancialInterest: import_zod10.z.boolean(),
  hasPersonalRelationship: import_zod10.z.boolean(),
  remarks: import_zod10.z.string().optional()
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
var import_express12 = require("express");
var import_zod11 = require("zod");

// apps/api/src/services/working-paper.service.ts
var import_database10 = require("@avenquis/database");
var import_drizzle_orm9 = require("drizzle-orm");
var WorkingPaperService = class {
  static async listWorkingPapers(tenantId, engagementId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [
      (0, import_drizzle_orm9.eq)(import_database10.workingPapers.tenantId, tenantId),
      (0, import_drizzle_orm9.eq)(import_database10.workingPapers.engagementId, engagementId)
    ];
    if (options?.section) {
      conditions.push((0, import_drizzle_orm9.eq)(import_database10.workingPapers.section, options.section));
    }
    if (options?.status) {
      conditions.push((0, import_drizzle_orm9.eq)(import_database10.workingPapers.status, options.status));
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      const condOr = (0, import_drizzle_orm9.or)(
        (0, import_drizzle_orm9.ilike)(import_database10.workingPapers.title, searchPattern),
        (0, import_drizzle_orm9.ilike)(import_database10.workingPapers.wpCode, searchPattern)
      );
      if (condOr) conditions.push(condOr);
    }
    const rows = await import_database10.db.select().from(import_database10.workingPapers).where((0, import_drizzle_orm9.and)(...conditions)).limit(limit).offset(offset).orderBy((0, import_drizzle_orm9.desc)(import_database10.workingPapers.createdAt));
    return rows;
  }
  static async createWorkingPaper(tenantId, data) {
    const engagement = await import_database10.db.query.engagements.findFirst({
      where: (0, import_drizzle_orm9.and)(
        (0, import_drizzle_orm9.eq)(import_database10.engagements.tenantId, tenantId),
        (0, import_drizzle_orm9.eq)(import_database10.engagements.id, data.engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const existing = await import_database10.db.query.workingPapers.findFirst({
      where: (0, import_drizzle_orm9.and)(
        (0, import_drizzle_orm9.eq)(import_database10.workingPapers.tenantId, tenantId),
        (0, import_drizzle_orm9.eq)(import_database10.workingPapers.engagementId, data.engagementId),
        (0, import_drizzle_orm9.eq)(import_database10.workingPapers.wpCode, data.wpCode)
      )
    });
    if (existing) {
      throw new ApiError(
        409,
        `Working paper code '${data.wpCode}' already exists in this engagement`,
        "WP_CODE_EXISTS"
      );
    }
    const [wp] = await import_database10.db.insert(import_database10.workingPapers).values({
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
    const wp = await import_database10.db.query.workingPapers.findFirst({
      where: (0, import_drizzle_orm9.and)(
        (0, import_drizzle_orm9.eq)(import_database10.workingPapers.tenantId, tenantId),
        (0, import_drizzle_orm9.eq)(import_database10.workingPapers.id, wpId)
      )
    });
    if (!wp) {
      throw new ApiError(
        404,
        "Working paper not found",
        "WORKING_PAPER_NOT_FOUND"
      );
    }
    const notes = await import_database10.db.select({
      id: import_database10.reviewNotes.id,
      content: import_database10.reviewNotes.content,
      status: import_database10.reviewNotes.status,
      authorMembershipId: import_database10.reviewNotes.authorMembershipId,
      authorFullName: import_database10.userProfiles.fullName,
      addressedAt: import_database10.reviewNotes.addressedAt,
      clearedAt: import_database10.reviewNotes.clearedAt,
      createdAt: import_database10.reviewNotes.createdAt
    }).from(import_database10.reviewNotes).innerJoin(
      import_database10.memberships,
      (0, import_drizzle_orm9.eq)(import_database10.reviewNotes.authorMembershipId, import_database10.memberships.id)
    ).innerJoin(import_database10.userProfiles, (0, import_drizzle_orm9.eq)(import_database10.memberships.userId, import_database10.userProfiles.id)).where(
      (0, import_drizzle_orm9.and)(
        (0, import_drizzle_orm9.eq)(import_database10.reviewNotes.tenantId, tenantId),
        (0, import_drizzle_orm9.eq)(import_database10.reviewNotes.workingPaperId, wpId)
      )
    ).orderBy((0, import_drizzle_orm9.desc)(import_database10.reviewNotes.createdAt));
    let preparer = null;
    if (wp.preparedByMembershipId) {
      const [p] = await import_database10.db.select({
        membershipId: import_database10.memberships.id,
        fullName: import_database10.userProfiles.fullName,
        email: import_database10.userProfiles.email
      }).from(import_database10.memberships).innerJoin(import_database10.userProfiles, (0, import_drizzle_orm9.eq)(import_database10.memberships.userId, import_database10.userProfiles.id)).where((0, import_drizzle_orm9.eq)(import_database10.memberships.id, wp.preparedByMembershipId));
      preparer = p ?? null;
    }
    let reviewer = null;
    if (wp.reviewedByMembershipId) {
      const [r] = await import_database10.db.select({
        membershipId: import_database10.memberships.id,
        fullName: import_database10.userProfiles.fullName,
        email: import_database10.userProfiles.email
      }).from(import_database10.memberships).innerJoin(import_database10.userProfiles, (0, import_drizzle_orm9.eq)(import_database10.memberships.userId, import_database10.userProfiles.id)).where((0, import_drizzle_orm9.eq)(import_database10.memberships.id, wp.reviewedByMembershipId));
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
    const wp = await import_database10.db.query.workingPapers.findFirst({
      where: (0, import_drizzle_orm9.and)(
        (0, import_drizzle_orm9.eq)(import_database10.workingPapers.tenantId, tenantId),
        (0, import_drizzle_orm9.eq)(import_database10.workingPapers.id, wpId)
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
    const [updated] = await import_database10.db.update(import_database10.workingPapers).set({
      status: updatedStatus,
      preparedByMembershipId,
      preparedAt,
      reviewedByMembershipId,
      reviewedAt,
      remarks: remarks ?? wp.remarks,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      (0, import_drizzle_orm9.and)((0, import_drizzle_orm9.eq)(import_database10.workingPapers.tenantId, tenantId), (0, import_drizzle_orm9.eq)(import_database10.workingPapers.id, wpId))
    ).returning();
    return updated;
  }
  static async addReviewNote(tenantId, wpId, authorMembershipId, content) {
    const wp = await import_database10.db.query.workingPapers.findFirst({
      where: (0, import_drizzle_orm9.and)(
        (0, import_drizzle_orm9.eq)(import_database10.workingPapers.tenantId, tenantId),
        (0, import_drizzle_orm9.eq)(import_database10.workingPapers.id, wpId)
      )
    });
    if (!wp) {
      throw new ApiError(
        404,
        "Working paper not found",
        "WORKING_PAPER_NOT_FOUND"
      );
    }
    const [note] = await import_database10.db.insert(import_database10.reviewNotes).values({
      tenantId,
      workingPaperId: wpId,
      authorMembershipId,
      content,
      status: "open"
    }).returning();
    return note;
  }
  static async updateReviewNoteStatus(tenantId, noteId, action, membershipId) {
    const note = await import_database10.db.query.reviewNotes.findFirst({
      where: (0, import_drizzle_orm9.and)(
        (0, import_drizzle_orm9.eq)(import_database10.reviewNotes.tenantId, tenantId),
        (0, import_drizzle_orm9.eq)(import_database10.reviewNotes.id, noteId)
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
    const [updated] = await import_database10.db.update(import_database10.reviewNotes).set({
      status,
      addressedByMembershipId,
      addressedAt,
      clearedByMembershipId,
      clearedAt,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      (0, import_drizzle_orm9.and)((0, import_drizzle_orm9.eq)(import_database10.reviewNotes.tenantId, tenantId), (0, import_drizzle_orm9.eq)(import_database10.reviewNotes.id, noteId))
    ).returning();
    return updated;
  }
  static async listDocumentRequests(tenantId, engagementId) {
    const requests = await import_database10.db.select().from(import_database10.clientDocumentRequests).where(
      (0, import_drizzle_orm9.and)(
        (0, import_drizzle_orm9.eq)(import_database10.clientDocumentRequests.tenantId, tenantId),
        (0, import_drizzle_orm9.eq)(import_database10.clientDocumentRequests.engagementId, engagementId)
      )
    ).orderBy((0, import_drizzle_orm9.desc)(import_database10.clientDocumentRequests.createdAt));
    return requests;
  }
  static async createDocumentRequest(tenantId, data) {
    const engagement = await import_database10.db.query.engagements.findFirst({
      where: (0, import_drizzle_orm9.and)(
        (0, import_drizzle_orm9.eq)(import_database10.engagements.tenantId, tenantId),
        (0, import_drizzle_orm9.eq)(import_database10.engagements.id, data.engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const [request] = await import_database10.db.insert(import_database10.clientDocumentRequests).values({
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
    const req = await import_database10.db.query.clientDocumentRequests.findFirst({
      where: (0, import_drizzle_orm9.and)(
        (0, import_drizzle_orm9.eq)(import_database10.clientDocumentRequests.tenantId, tenantId),
        (0, import_drizzle_orm9.eq)(import_database10.clientDocumentRequests.id, requestId)
      )
    });
    if (!req) {
      throw new ApiError(
        404,
        "Document request not found",
        "DOCUMENT_REQUEST_NOT_FOUND"
      );
    }
    const [updated] = await import_database10.db.update(import_database10.clientDocumentRequests).set({
      uploadedFileUrl,
      status: "submitted",
      submittedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      (0, import_drizzle_orm9.and)(
        (0, import_drizzle_orm9.eq)(import_database10.clientDocumentRequests.tenantId, tenantId),
        (0, import_drizzle_orm9.eq)(import_database10.clientDocumentRequests.id, requestId)
      )
    ).returning();
    return updated;
  }
};

// apps/api/src/http/routes/working-papers.ts
var workingPaperRouter = (0, import_express12.Router)();
var createWpSchema = import_zod11.z.object({
  engagementId: import_zod11.z.string().uuid(),
  wpCode: import_zod11.z.string().min(1).max(50),
  title: import_zod11.z.string().min(2).max(255),
  section: import_zod11.z.enum([
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
  fileUrl: import_zod11.z.string().url().optional(),
  remarks: import_zod11.z.string().optional()
});
var signoffSchema = import_zod11.z.object({
  action: import_zod11.z.enum(["prepare", "approve", "reject"]),
  remarks: import_zod11.z.string().optional()
});
var addReviewNoteSchema = import_zod11.z.object({
  content: import_zod11.z.string().min(2)
});
var updateReviewNoteSchema = import_zod11.z.object({
  action: import_zod11.z.enum(["address", "clear"])
});
var createDocReqSchema = import_zod11.z.object({
  engagementId: import_zod11.z.string().uuid(),
  requestTitle: import_zod11.z.string().min(2).max(255),
  description: import_zod11.z.string().optional(),
  dueDate: import_zod11.z.string().transform((val) => new Date(val)).optional()
});
var fulfillDocReqSchema = import_zod11.z.object({
  uploadedFileUrl: import_zod11.z.string().url()
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
var import_express13 = require("express");
var import_zod12 = require("zod");

// apps/api/src/services/task.service.ts
var import_database11 = require("@avenquis/database");
var import_drizzle_orm10 = require("drizzle-orm");
var TaskService = class {
  static async listTasks(tenantId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [(0, import_drizzle_orm10.eq)(import_database11.tasks.tenantId, tenantId)];
    if (options?.engagementId) {
      conditions.push((0, import_drizzle_orm10.eq)(import_database11.tasks.engagementId, options.engagementId));
    }
    if (options?.assigneeMembershipId) {
      conditions.push(
        (0, import_drizzle_orm10.eq)(import_database11.tasks.assigneeMembershipId, options.assigneeMembershipId)
      );
    }
    if (options?.status) {
      conditions.push((0, import_drizzle_orm10.eq)(import_database11.tasks.status, options.status));
    }
    if (options?.priority) {
      conditions.push((0, import_drizzle_orm10.eq)(import_database11.tasks.priority, options.priority));
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      const condOr = (0, import_drizzle_orm10.or)(
        (0, import_drizzle_orm10.ilike)(import_database11.tasks.title, searchPattern),
        (0, import_drizzle_orm10.ilike)(import_database11.tasks.description, searchPattern)
      );
      if (condOr) conditions.push(condOr);
    }
    const rows = await import_database11.db.select({
      id: import_database11.tasks.id,
      tenantId: import_database11.tasks.tenantId,
      engagementId: import_database11.tasks.engagementId,
      engagementTitle: import_database11.engagements.title,
      assigneeMembershipId: import_database11.tasks.assigneeMembershipId,
      title: import_database11.tasks.title,
      description: import_database11.tasks.description,
      priority: import_database11.tasks.priority,
      status: import_database11.tasks.status,
      dueDate: import_database11.tasks.dueDate,
      estimatedHours: import_database11.tasks.estimatedHours,
      actualHours: import_database11.tasks.actualHours,
      createdAt: import_database11.tasks.createdAt
    }).from(import_database11.tasks).innerJoin(import_database11.engagements, (0, import_drizzle_orm10.eq)(import_database11.tasks.engagementId, import_database11.engagements.id)).where((0, import_drizzle_orm10.and)(...conditions)).limit(limit).offset(offset).orderBy((0, import_drizzle_orm10.desc)(import_database11.tasks.createdAt));
    return rows;
  }
  static async createTask(tenantId, data) {
    const engagement = await import_database11.db.query.engagements.findFirst({
      where: (0, import_drizzle_orm10.and)(
        (0, import_drizzle_orm10.eq)(import_database11.engagements.tenantId, tenantId),
        (0, import_drizzle_orm10.eq)(import_database11.engagements.id, data.engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const [task] = await import_database11.db.insert(import_database11.tasks).values({
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
    const task = await import_database11.db.query.tasks.findFirst({
      where: (0, import_drizzle_orm10.and)((0, import_drizzle_orm10.eq)(import_database11.tasks.tenantId, tenantId), (0, import_drizzle_orm10.eq)(import_database11.tasks.id, taskId))
    });
    if (!task) {
      throw new ApiError(404, "Task not found", "TASK_NOT_FOUND");
    }
    const [updated] = await import_database11.db.update(import_database11.tasks).set({
      status,
      actualHours: actualHours ?? task.actualHours,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm10.and)((0, import_drizzle_orm10.eq)(import_database11.tasks.tenantId, tenantId), (0, import_drizzle_orm10.eq)(import_database11.tasks.id, taskId))).returning();
    return updated;
  }
};

// apps/api/src/http/routes/tasks.ts
var taskRouter = (0, import_express13.Router)();
var createTaskSchema = import_zod12.z.object({
  engagementId: import_zod12.z.string().uuid(),
  assigneeMembershipId: import_zod12.z.string().uuid().optional(),
  title: import_zod12.z.string().min(2).max(255),
  description: import_zod12.z.string().optional(),
  priority: import_zod12.z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: import_zod12.z.string().transform((val) => new Date(val)).optional(),
  estimatedHours: import_zod12.z.number().int().min(0).optional()
});
var updateTaskStatusSchema = import_zod12.z.object({
  status: import_zod12.z.enum(["todo", "in_progress", "review", "completed", "cancelled"]),
  actualHours: import_zod12.z.number().int().min(0).optional()
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
var import_express14 = require("express");
var import_zod13 = require("zod");

// apps/api/src/services/timesheet.service.ts
var import_database12 = require("@avenquis/database");
var import_drizzle_orm11 = require("drizzle-orm");
var TimesheetService = class {
  static async listTimesheets(tenantId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [(0, import_drizzle_orm11.eq)(import_database12.timesheetEntries.tenantId, tenantId)];
    if (options?.membershipId) {
      conditions.push((0, import_drizzle_orm11.eq)(import_database12.timesheetEntries.membershipId, options.membershipId));
    }
    if (options?.engagementId) {
      conditions.push((0, import_drizzle_orm11.eq)(import_database12.timesheetEntries.engagementId, options.engagementId));
    }
    if (options?.status) {
      conditions.push((0, import_drizzle_orm11.eq)(import_database12.timesheetEntries.status, options.status));
    }
    const rows = await import_database12.db.select({
      id: import_database12.timesheetEntries.id,
      tenantId: import_database12.timesheetEntries.tenantId,
      membershipId: import_database12.timesheetEntries.membershipId,
      staffName: import_database12.userProfiles.fullName,
      engagementId: import_database12.timesheetEntries.engagementId,
      engagementTitle: import_database12.engagements.title,
      taskId: import_database12.timesheetEntries.taskId,
      workDate: import_database12.timesheetEntries.workDate,
      hours: import_database12.timesheetEntries.hours,
      activityType: import_database12.timesheetEntries.activityType,
      description: import_database12.timesheetEntries.description,
      status: import_database12.timesheetEntries.status,
      createdAt: import_database12.timesheetEntries.createdAt
    }).from(import_database12.timesheetEntries).innerJoin(import_database12.memberships, (0, import_drizzle_orm11.eq)(import_database12.timesheetEntries.membershipId, import_database12.memberships.id)).innerJoin(import_database12.userProfiles, (0, import_drizzle_orm11.eq)(import_database12.memberships.userId, import_database12.userProfiles.id)).leftJoin(import_database12.engagements, (0, import_drizzle_orm11.eq)(import_database12.timesheetEntries.engagementId, import_database12.engagements.id)).where((0, import_drizzle_orm11.and)(...conditions)).limit(limit).offset(offset).orderBy((0, import_drizzle_orm11.desc)(import_database12.timesheetEntries.workDate));
    return rows;
  }
  static async logTimesheet(tenantId, membershipId, data) {
    const [entry] = await import_database12.db.insert(import_database12.timesheetEntries).values({
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
      const task = await import_database12.db.query.tasks.findFirst({
        where: (0, import_drizzle_orm11.eq)(import_database12.tasks.id, data.taskId)
      });
      if (task) {
        await import_database12.db.update(import_database12.tasks).set({ actualHours: task.actualHours + data.hours }).where((0, import_drizzle_orm11.eq)(import_database12.tasks.id, data.taskId));
      }
    }
    return entry;
  }
  static async approveTimesheet(tenantId, timesheetId, approverMembershipId, status) {
    const entry = await import_database12.db.query.timesheetEntries.findFirst({
      where: (0, import_drizzle_orm11.and)(
        (0, import_drizzle_orm11.eq)(import_database12.timesheetEntries.tenantId, tenantId),
        (0, import_drizzle_orm11.eq)(import_database12.timesheetEntries.id, timesheetId)
      )
    });
    if (!entry) {
      throw new ApiError(
        404,
        "Timesheet entry not found",
        "TIMESHEET_NOT_FOUND"
      );
    }
    const [updated] = await import_database12.db.update(import_database12.timesheetEntries).set({
      status,
      approvedByMembershipId: approverMembershipId,
      approvedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      (0, import_drizzle_orm11.and)(
        (0, import_drizzle_orm11.eq)(import_database12.timesheetEntries.tenantId, tenantId),
        (0, import_drizzle_orm11.eq)(import_database12.timesheetEntries.id, timesheetId)
      )
    ).returning();
    return updated;
  }
};

// apps/api/src/http/routes/timesheets.ts
var timesheetRouter = (0, import_express14.Router)();
var logTimesheetSchema = import_zod13.z.object({
  engagementId: import_zod13.z.string().uuid().optional(),
  taskId: import_zod13.z.string().uuid().optional(),
  workDate: import_zod13.z.string().transform((val) => new Date(val)),
  hours: import_zod13.z.number().int().min(1).max(24),
  activityType: import_zod13.z.enum([
    "audit_fieldwork",
    "tax_preparation",
    "client_meeting",
    "report_writing",
    "review",
    "administrative",
    "training"
  ]),
  description: import_zod13.z.string().optional()
});
var approveTimesheetSchema = import_zod13.z.object({
  status: import_zod13.z.enum(["approved", "rejected"])
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
var import_express15 = require("express");
var import_zod14 = require("zod");

// apps/api/src/services/billing.service.ts
var import_database13 = require("@avenquis/database");
var import_drizzle_orm12 = require("drizzle-orm");
var BillingService = class {
  static async listInvoices(tenantId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [(0, import_drizzle_orm12.eq)(import_database13.invoices.tenantId, tenantId)];
    if (options?.clientId) {
      conditions.push((0, import_drizzle_orm12.eq)(import_database13.invoices.clientId, options.clientId));
    }
    if (options?.engagementId) {
      conditions.push((0, import_drizzle_orm12.eq)(import_database13.invoices.engagementId, options.engagementId));
    }
    if (options?.status) {
      conditions.push((0, import_drizzle_orm12.eq)(import_database13.invoices.status, options.status));
    }
    const rows = await import_database13.db.select({
      id: import_database13.invoices.id,
      tenantId: import_database13.invoices.tenantId,
      clientId: import_database13.invoices.clientId,
      clientName: import_database13.clients.name,
      engagementId: import_database13.invoices.engagementId,
      invoiceNumber: import_database13.invoices.invoiceNumber,
      amount: import_database13.invoices.amount,
      vatAmount: import_database13.invoices.vatAmount,
      totalAmount: import_database13.invoices.totalAmount,
      currency: import_database13.invoices.currency,
      status: import_database13.invoices.status,
      issueDate: import_database13.invoices.issueDate,
      dueDate: import_database13.invoices.dueDate,
      paidAmount: import_database13.invoices.paidAmount,
      createdAt: import_database13.invoices.createdAt
    }).from(import_database13.invoices).innerJoin(import_database13.clients, (0, import_drizzle_orm12.eq)(import_database13.invoices.clientId, import_database13.clients.id)).leftJoin(import_database13.engagements, (0, import_drizzle_orm12.eq)(import_database13.invoices.engagementId, import_database13.engagements.id)).where((0, import_drizzle_orm12.and)(...conditions)).limit(limit).offset(offset).orderBy((0, import_drizzle_orm12.desc)(import_database13.invoices.createdAt));
    return rows;
  }
  static async createInvoice(tenantId, data) {
    const client = await import_database13.db.query.clients.findFirst({
      where: (0, import_drizzle_orm12.and)((0, import_drizzle_orm12.eq)(import_database13.clients.tenantId, tenantId), (0, import_drizzle_orm12.eq)(import_database13.clients.id, data.clientId))
    });
    if (!client) {
      throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }
    const existing = await import_database13.db.query.invoices.findFirst({
      where: (0, import_drizzle_orm12.and)(
        (0, import_drizzle_orm12.eq)(import_database13.invoices.tenantId, tenantId),
        (0, import_drizzle_orm12.eq)(import_database13.invoices.invoiceNumber, data.invoiceNumber)
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
    const [invoice] = await import_database13.db.insert(import_database13.invoices).values({
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
    const invoice = await import_database13.db.query.invoices.findFirst({
      where: (0, import_drizzle_orm12.and)((0, import_drizzle_orm12.eq)(import_database13.invoices.tenantId, tenantId), (0, import_drizzle_orm12.eq)(import_database13.invoices.id, invoiceId))
    });
    if (!invoice) {
      throw new ApiError(404, "Invoice not found", "INVOICE_NOT_FOUND");
    }
    const [payment] = await import_database13.db.insert(import_database13.payments).values({
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
    await import_database13.db.update(import_database13.invoices).set({
      paidAmount: newPaidAmount,
      status: newStatus,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm12.and)((0, import_drizzle_orm12.eq)(import_database13.invoices.tenantId, tenantId), (0, import_drizzle_orm12.eq)(import_database13.invoices.id, invoiceId)));
    return payment;
  }
};

// apps/api/src/http/routes/billing.ts
var billingRouter = (0, import_express15.Router)();
var createInvoiceSchema = import_zod14.z.object({
  clientId: import_zod14.z.string().uuid(),
  engagementId: import_zod14.z.string().uuid().optional(),
  invoiceNumber: import_zod14.z.string().min(2).max(50),
  amount: import_zod14.z.number().int().min(1),
  vatAmount: import_zod14.z.number().int().min(0).optional(),
  currency: import_zod14.z.string().max(10).default("BDT"),
  issueDate: import_zod14.z.string().transform((val) => new Date(val)),
  dueDate: import_zod14.z.string().transform((val) => new Date(val)),
  remarks: import_zod14.z.string().optional()
});
var recordPaymentSchema = import_zod14.z.object({
  receiptNumber: import_zod14.z.string().min(2).max(50),
  amount: import_zod14.z.number().int().min(1),
  paymentDate: import_zod14.z.string().transform((val) => new Date(val)),
  paymentMethod: import_zod14.z.enum(["bank_transfer", "cheque", "cash", "online"]),
  referenceNumber: import_zod14.z.string().max(100).optional(),
  remarks: import_zod14.z.string().optional()
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
var import_express16 = require("express");
var import_zod15 = require("zod");

// apps/api/src/services/certificate.service.ts
var import_crypto2 = require("crypto");
var import_database14 = require("@avenquis/database");
var import_drizzle_orm13 = require("drizzle-orm");
var CertificateService = class {
  static async signoffEngagement(tenantId, engagementId, signerMembershipId, data) {
    const engagement = await import_database14.db.query.engagements.findFirst({
      where: (0, import_drizzle_orm13.and)(
        (0, import_drizzle_orm13.eq)(import_database14.engagements.tenantId, tenantId),
        (0, import_drizzle_orm13.eq)(import_database14.engagements.id, engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const payload = `${tenantId}:${engagementId}:${signerMembershipId}:${data.signoffRole}:${data.action}:${Date.now()}`;
    const signedHash = (0, import_crypto2.createHash)("sha256").update(payload).digest("hex");
    const [log] = await import_database14.db.insert(import_database14.signoffAuditLogs).values({
      tenantId,
      engagementId,
      signerMembershipId,
      signoffRole: data.signoffRole,
      action: data.action,
      comments: data.comments,
      signedHash
    }).returning();
    if (data.signoffRole === "lead_partner" && data.action === "approved") {
      await import_database14.db.update(import_database14.engagements).set({
        status: "completed",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(
        (0, import_drizzle_orm13.and)(
          (0, import_drizzle_orm13.eq)(import_database14.engagements.tenantId, tenantId),
          (0, import_drizzle_orm13.eq)(import_database14.engagements.id, engagementId)
        )
      );
    }
    return log;
  }
  static async issueCertificate(tenantId, data) {
    const engagement = await import_database14.db.query.engagements.findFirst({
      where: (0, import_drizzle_orm13.and)(
        (0, import_drizzle_orm13.eq)(import_database14.engagements.tenantId, tenantId),
        (0, import_drizzle_orm13.eq)(import_database14.engagements.id, data.engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const existing = await import_database14.db.query.digitalCertificates.findFirst({
      where: (0, import_drizzle_orm13.and)(
        (0, import_drizzle_orm13.eq)(import_database14.digitalCertificates.tenantId, tenantId),
        (0, import_drizzle_orm13.eq)(import_database14.digitalCertificates.certificateNumber, data.certificateNumber)
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
    const verificationToken = `AVQ-CERT-${(0, import_crypto2.randomBytes)(16).toString("hex")}`;
    const rawSealPayload = `${tenantId}:${engagement.id}:${data.certificateNumber}:${data.auditOpinion}:${signedAt.toISOString()}:${data.signedByMembershipId}`;
    const digitalSealHash = (0, import_crypto2.createHash)("sha256").update(rawSealPayload).digest("hex");
    const [certificate] = await import_database14.db.insert(import_database14.digitalCertificates).values({
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
    const cert = await import_database14.db.query.digitalCertificates.findFirst({
      where: (0, import_drizzle_orm13.and)(
        (0, import_drizzle_orm13.eq)(import_database14.digitalCertificates.tenantId, tenantId),
        (0, import_drizzle_orm13.eq)(import_database14.digitalCertificates.id, certificateId)
      )
    });
    if (!cert) {
      throw new ApiError(404, "Certificate not found", "CERTIFICATE_NOT_FOUND");
    }
    const engagement = await import_database14.db.query.engagements.findFirst({
      where: (0, import_drizzle_orm13.eq)(import_database14.engagements.id, cert.engagementId)
    });
    const client = engagement ? await import_database14.db.query.clients.findFirst({
      where: (0, import_drizzle_orm13.eq)(import_database14.clients.id, engagement.clientId)
    }) : null;
    const [signer] = await import_database14.db.select({
      membershipId: import_database14.memberships.id,
      fullName: import_database14.userProfiles.fullName,
      email: import_database14.userProfiles.email
    }).from(import_database14.memberships).innerJoin(import_database14.userProfiles, (0, import_drizzle_orm13.eq)(import_database14.memberships.userId, import_database14.userProfiles.id)).where((0, import_drizzle_orm13.eq)(import_database14.memberships.id, cert.signedByMembershipId));
    const auditLogs = await import_database14.db.select().from(import_database14.signoffAuditLogs).where(
      (0, import_drizzle_orm13.and)(
        (0, import_drizzle_orm13.eq)(import_database14.signoffAuditLogs.tenantId, tenantId),
        (0, import_drizzle_orm13.eq)(import_database14.signoffAuditLogs.engagementId, cert.engagementId)
      )
    ).orderBy((0, import_drizzle_orm13.desc)(import_database14.signoffAuditLogs.createdAt));
    return {
      ...cert,
      engagementTitle: engagement?.title,
      clientName: client?.name,
      signer: signer ?? null,
      auditLogs
    };
  }
  static async verifyCertificatePublic(verificationToken) {
    const cert = await import_database14.db.query.digitalCertificates.findFirst({
      where: (0, import_drizzle_orm13.eq)(import_database14.digitalCertificates.verificationToken, verificationToken)
    });
    if (!cert) {
      throw new ApiError(
        404,
        "Invalid or expired certificate verification token",
        "INVALID_VERIFICATION_TOKEN"
      );
    }
    const engagement = await import_database14.db.query.engagements.findFirst({
      where: (0, import_drizzle_orm13.eq)(import_database14.engagements.id, cert.engagementId)
    });
    const client = engagement ? await import_database14.db.query.clients.findFirst({
      where: (0, import_drizzle_orm13.eq)(import_database14.clients.id, engagement.clientId)
    }) : null;
    const [signer] = await import_database14.db.select({
      fullName: import_database14.userProfiles.fullName
    }).from(import_database14.memberships).innerJoin(import_database14.userProfiles, (0, import_drizzle_orm13.eq)(import_database14.memberships.userId, import_database14.userProfiles.id)).where((0, import_drizzle_orm13.eq)(import_database14.memberships.id, cert.signedByMembershipId));
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
    const cert = await import_database14.db.query.digitalCertificates.findFirst({
      where: (0, import_drizzle_orm13.and)(
        (0, import_drizzle_orm13.eq)(import_database14.digitalCertificates.tenantId, tenantId),
        (0, import_drizzle_orm13.eq)(import_database14.digitalCertificates.id, certificateId)
      )
    });
    if (!cert) {
      throw new ApiError(404, "Certificate not found", "CERTIFICATE_NOT_FOUND");
    }
    const [updated] = await import_database14.db.update(import_database14.digitalCertificates).set({
      status: "revoked",
      revokedAt: /* @__PURE__ */ new Date(),
      revocationReason: reason,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      (0, import_drizzle_orm13.and)(
        (0, import_drizzle_orm13.eq)(import_database14.digitalCertificates.tenantId, tenantId),
        (0, import_drizzle_orm13.eq)(import_database14.digitalCertificates.id, certificateId)
      )
    ).returning();
    return updated;
  }
};

// apps/api/src/http/routes/certificates.ts
var certificateRouter = (0, import_express16.Router)();
var signoffEngagementSchema = import_zod15.z.object({
  engagementId: import_zod15.z.string().uuid(),
  signoffRole: import_zod15.z.enum([
    "audit_senior",
    "engagement_manager",
    "eqcr_partner",
    "lead_partner"
  ]),
  action: import_zod15.z.enum(["approved", "rejected", "signed_and_sealed"]),
  comments: import_zod15.z.string().optional()
});
var issueCertificateSchema = import_zod15.z.object({
  engagementId: import_zod15.z.string().uuid(),
  certificateNumber: import_zod15.z.string().min(2).max(50),
  certificateType: import_zod15.z.enum([
    "independent_auditors_report",
    "tax_clearance_certificate",
    "special_audit_certificate",
    "net_worth_certificate",
    "compliance_certificate"
  ]),
  title: import_zod15.z.string().min(2).max(255),
  auditOpinion: import_zod15.z.enum(["unmodified", "qualified", "adverse", "disclaimer"]),
  summaryOpinionText: import_zod15.z.string().min(10)
});
var revokeCertificateSchema = import_zod15.z.object({
  reason: import_zod15.z.string().min(5)
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
var import_express17 = require("express");
var import_zod16 = require("zod");

// apps/api/src/services/notification.service.ts
var import_database15 = require("@avenquis/database");
var import_drizzle_orm14 = require("drizzle-orm");
var NotificationService = class {
  static async listNotifications(tenantId, recipientMembershipId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [
      (0, import_drizzle_orm14.eq)(import_database15.notifications.tenantId, tenantId),
      (0, import_drizzle_orm14.eq)(import_database15.notifications.recipientMembershipId, recipientMembershipId)
    ];
    if (options?.isRead !== void 0) {
      conditions.push((0, import_drizzle_orm14.eq)(import_database15.notifications.isRead, options.isRead));
    }
    const rows = await import_database15.db.select().from(import_database15.notifications).where((0, import_drizzle_orm14.and)(...conditions)).limit(limit).offset(offset).orderBy((0, import_drizzle_orm14.desc)(import_database15.notifications.createdAt));
    return rows;
  }
  static async getUnreadCount(tenantId, recipientMembershipId) {
    const [row] = await import_database15.db.select({ count: (0, import_drizzle_orm14.count)() }).from(import_database15.notifications).where(
      (0, import_drizzle_orm14.and)(
        (0, import_drizzle_orm14.eq)(import_database15.notifications.tenantId, tenantId),
        (0, import_drizzle_orm14.eq)(import_database15.notifications.recipientMembershipId, recipientMembershipId),
        (0, import_drizzle_orm14.eq)(import_database15.notifications.isRead, false)
      )
    );
    return { unreadCount: Number(row?.count ?? 0) };
  }
  static async createNotification(tenantId, data) {
    const [notif] = await import_database15.db.insert(import_database15.notifications).values({
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
    const notif = await import_database15.db.query.notifications.findFirst({
      where: (0, import_drizzle_orm14.and)(
        (0, import_drizzle_orm14.eq)(import_database15.notifications.tenantId, tenantId),
        (0, import_drizzle_orm14.eq)(import_database15.notifications.id, notificationId),
        (0, import_drizzle_orm14.eq)(import_database15.notifications.recipientMembershipId, recipientMembershipId)
      )
    });
    if (!notif) {
      throw new ApiError(
        404,
        "Notification not found",
        "NOTIFICATION_NOT_FOUND"
      );
    }
    const [updated] = await import_database15.db.update(import_database15.notifications).set({
      isRead: true,
      readAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      (0, import_drizzle_orm14.and)(
        (0, import_drizzle_orm14.eq)(import_database15.notifications.tenantId, tenantId),
        (0, import_drizzle_orm14.eq)(import_database15.notifications.id, notificationId)
      )
    ).returning();
    return updated;
  }
  static async markAllAsRead(tenantId, recipientMembershipId) {
    await import_database15.db.update(import_database15.notifications).set({
      isRead: true,
      readAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      (0, import_drizzle_orm14.and)(
        (0, import_drizzle_orm14.eq)(import_database15.notifications.tenantId, tenantId),
        (0, import_drizzle_orm14.eq)(import_database15.notifications.recipientMembershipId, recipientMembershipId),
        (0, import_drizzle_orm14.eq)(import_database15.notifications.isRead, false)
      )
    );
    return { success: true };
  }
  static async listActivityFeed(tenantId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [(0, import_drizzle_orm14.eq)(import_database15.activityFeedEvents.tenantId, tenantId)];
    if (options?.entityType) {
      conditions.push((0, import_drizzle_orm14.eq)(import_database15.activityFeedEvents.entityType, options.entityType));
    }
    if (options?.entityId) {
      conditions.push((0, import_drizzle_orm14.eq)(import_database15.activityFeedEvents.entityId, options.entityId));
    }
    const rows = await import_database15.db.select({
      id: import_database15.activityFeedEvents.id,
      tenantId: import_database15.activityFeedEvents.tenantId,
      actorMembershipId: import_database15.activityFeedEvents.actorMembershipId,
      actorFullName: import_database15.userProfiles.fullName,
      entityType: import_database15.activityFeedEvents.entityType,
      entityId: import_database15.activityFeedEvents.entityId,
      action: import_database15.activityFeedEvents.action,
      description: import_database15.activityFeedEvents.description,
      metadata: import_database15.activityFeedEvents.metadata,
      createdAt: import_database15.activityFeedEvents.createdAt
    }).from(import_database15.activityFeedEvents).innerJoin(
      import_database15.memberships,
      (0, import_drizzle_orm14.eq)(import_database15.activityFeedEvents.actorMembershipId, import_database15.memberships.id)
    ).innerJoin(import_database15.userProfiles, (0, import_drizzle_orm14.eq)(import_database15.memberships.userId, import_database15.userProfiles.id)).where((0, import_drizzle_orm14.and)(...conditions)).limit(limit).offset(offset).orderBy((0, import_drizzle_orm14.desc)(import_database15.activityFeedEvents.createdAt));
    return rows;
  }
  static async logActivityEvent(tenantId, actorMembershipId, data) {
    const [event] = await import_database15.db.insert(import_database15.activityFeedEvents).values({
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
var notificationRouter = (0, import_express17.Router)();
var createNotificationSchema = import_zod16.z.object({
  recipientMembershipId: import_zod16.z.string().uuid(),
  title: import_zod16.z.string().min(2).max(255),
  message: import_zod16.z.string().min(2),
  type: import_zod16.z.enum([
    "task_assignment",
    "review_note",
    "leave_approval",
    "kyc_verification",
    "invoice_payment",
    "independence_flag",
    "system_alert"
  ]),
  link: import_zod16.z.string().optional()
});
var logActivitySchema = import_zod16.z.object({
  entityType: import_zod16.z.enum([
    "client",
    "engagement",
    "working_paper",
    "task",
    "invoice",
    "certificate"
  ]),
  entityId: import_zod16.z.string().uuid(),
  action: import_zod16.z.enum([
    "created",
    "updated",
    "submitted",
    "approved",
    "rejected",
    "signed_and_sealed",
    "revoked"
  ]),
  description: import_zod16.z.string().min(2),
  metadata: import_zod16.z.record(import_zod16.z.string(), import_zod16.z.unknown()).optional()
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
var import_express18 = require("express");

// apps/api/src/services/analytics.service.ts
var import_database16 = require("@avenquis/database");
var import_drizzle_orm15 = require("drizzle-orm");
var AnalyticsService = class {
  static async getExecutiveDashboardMetrics(tenantId) {
    const [clientCountRow] = await import_database16.db.select({ count: (0, import_drizzle_orm15.count)() }).from(import_database16.clients).where((0, import_drizzle_orm15.eq)(import_database16.clients.tenantId, tenantId));
    const totalClients = Number(clientCountRow?.count ?? 0);
    const allEngagements = await import_database16.db.select({
      id: import_database16.engagements.id,
      status: import_database16.engagements.status
    }).from(import_database16.engagements).where((0, import_drizzle_orm15.eq)(import_database16.engagements.tenantId, tenantId));
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
    const [studentCountRow] = await import_database16.db.select({ count: (0, import_drizzle_orm15.count)() }).from(import_database16.studentProfiles).where((0, import_drizzle_orm15.eq)(import_database16.studentProfiles.tenantId, tenantId));
    const caStudentsCount = Number(studentCountRow?.count ?? 0);
    const [billedSumRow] = await import_database16.db.select({ totalBilled: (0, import_drizzle_orm15.sum)(import_database16.invoices.totalAmount) }).from(import_database16.invoices).where((0, import_drizzle_orm15.eq)(import_database16.invoices.tenantId, tenantId));
    const totalRevenueBilled = Number(billedSumRow?.totalBilled ?? 0);
    const [collectedSumRow] = await import_database16.db.select({ totalCollected: (0, import_drizzle_orm15.sum)(import_database16.payments.amount) }).from(import_database16.payments).where((0, import_drizzle_orm15.eq)(import_database16.payments.tenantId, tenantId));
    const totalRevenueCollected = Number(collectedSumRow?.totalCollected ?? 0);
    const outstandingBilling = totalRevenueBilled - totalRevenueCollected;
    const allWps = await import_database16.db.select({ status: import_database16.workingPapers.status }).from(import_database16.workingPapers).where((0, import_drizzle_orm15.eq)(import_database16.workingPapers.tenantId, tenantId));
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
    const allCerts = await import_database16.db.select({
      status: import_database16.digitalCertificates.status,
      auditOpinion: import_database16.digitalCertificates.auditOpinion
    }).from(import_database16.digitalCertificates).where((0, import_drizzle_orm15.eq)(import_database16.digitalCertificates.tenantId, tenantId));
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
    const [timesheetHoursRow] = await import_database16.db.select({ totalHours: (0, import_drizzle_orm15.sum)(import_database16.timesheetEntries.hours) }).from(import_database16.timesheetEntries).where((0, import_drizzle_orm15.eq)(import_database16.timesheetEntries.tenantId, tenantId));
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
    const engagement = await import_database16.db.query.engagements.findFirst({
      where: (0, import_drizzle_orm15.and)(
        (0, import_drizzle_orm15.eq)(import_database16.engagements.tenantId, tenantId),
        (0, import_drizzle_orm15.eq)(import_database16.engagements.id, engagementId)
      )
    });
    if (!engagement) {
      throw new ApiError(404, "Engagement not found", "ENGAGEMENT_NOT_FOUND");
    }
    const engagementTasks = await import_database16.db.select().from(import_database16.tasks).where(
      (0, import_drizzle_orm15.and)((0, import_drizzle_orm15.eq)(import_database16.tasks.tenantId, tenantId), (0, import_drizzle_orm15.eq)(import_database16.tasks.engagementId, engagementId))
    );
    const totalTasks = engagementTasks.length;
    const completedTasks = engagementTasks.filter(
      (t) => t.status === "completed"
    ).length;
    const taskCompletionPercentage = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
    const engagementWps = await import_database16.db.select().from(import_database16.workingPapers).where(
      (0, import_drizzle_orm15.and)(
        (0, import_drizzle_orm15.eq)(import_database16.workingPapers.tenantId, tenantId),
        (0, import_drizzle_orm15.eq)(import_database16.workingPapers.engagementId, engagementId)
      )
    );
    const totalWps = engagementWps.length;
    const approvedWps = engagementWps.filter(
      (w) => w.status === "approved"
    ).length;
    const wpApprovalPercentage = totalWps > 0 ? Math.round(approvedWps / totalWps * 100) : 0;
    const [invRow] = await import_database16.db.select({ totalBilled: (0, import_drizzle_orm15.sum)(import_database16.invoices.totalAmount) }).from(import_database16.invoices).where(
      (0, import_drizzle_orm15.and)(
        (0, import_drizzle_orm15.eq)(import_database16.invoices.tenantId, tenantId),
        (0, import_drizzle_orm15.eq)(import_database16.invoices.engagementId, engagementId)
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
var analyticsRouter = (0, import_express18.Router)();
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

// apps/api/src/http/routes/admin.ts
var import_express19 = require("express");
var import_zod17 = require("zod");

// apps/api/src/services/admin.service.ts
var import_database17 = require("@avenquis/database");
var import_drizzle_orm16 = require("drizzle-orm");
var AdminService = class {
  static async listSecurityEvents(tenantId, options) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const conditions = [(0, import_drizzle_orm16.eq)(import_database17.securityEvents.tenantId, tenantId)];
    if (options?.severity) {
      conditions.push((0, import_drizzle_orm16.eq)(import_database17.securityEvents.severity, options.severity));
    }
    const events = await import_database17.db.select({
      id: import_database17.securityEvents.id,
      tenantId: import_database17.securityEvents.tenantId,
      membershipId: import_database17.securityEvents.membershipId,
      userFullName: import_database17.userProfiles.fullName,
      userEmail: import_database17.userProfiles.email,
      eventType: import_database17.securityEvents.eventType,
      severity: import_database17.securityEvents.severity,
      details: import_database17.securityEvents.details,
      ipAddress: import_database17.securityEvents.ipAddress,
      createdAt: import_database17.securityEvents.createdAt
    }).from(import_database17.securityEvents).leftJoin(import_database17.memberships, (0, import_drizzle_orm16.eq)(import_database17.securityEvents.membershipId, import_database17.memberships.id)).leftJoin(import_database17.userProfiles, (0, import_drizzle_orm16.eq)(import_database17.memberships.userId, import_database17.userProfiles.id)).where((0, import_drizzle_orm16.and)(...conditions)).limit(limit).offset(offset).orderBy((0, import_drizzle_orm16.desc)(import_database17.securityEvents.createdAt));
    return events;
  }
  static async getSystemHealth() {
    const dbCheck = await import_database17.db.query.tenants.findFirst();
    const activeTenantsCount = (await import_database17.db.select().from(import_database17.tenants)).length;
    return {
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0",
      services: {
        database: dbCheck ? "connected" : "idle",
        authentication: "healthy",
        multiTenantRls: "active"
      },
      metrics: {
        activeTenantsCount,
        uptimeSeconds: Math.floor(process.uptime())
      }
    };
  }
  static async getTenantDeploymentProfile(tenantId) {
    const tenant = await import_database17.db.query.tenants.findFirst({
      where: (0, import_drizzle_orm16.eq)(import_database17.tenants.id, tenantId)
    });
    const flags = await import_database17.db.query.featureFlags.findMany({
      where: (0, import_drizzle_orm16.eq)(import_database17.featureFlags.tenantId, tenantId)
    });
    return {
      tenantId,
      tenantName: tenant?.name,
      tenantSlug: tenant?.slug,
      status: tenant?.status,
      deploymentTier: "enterprise",
      featureFlags: flags.map((f) => ({
        code: f.code,
        enabled: f.enabled
      }))
    };
  }
  static async updateFeatureFlag(tenantId, code, enabled) {
    const existing = await import_database17.db.query.featureFlags.findFirst({
      where: (0, import_drizzle_orm16.and)(
        (0, import_drizzle_orm16.eq)(import_database17.featureFlags.tenantId, tenantId),
        (0, import_drizzle_orm16.eq)(import_database17.featureFlags.code, code)
      )
    });
    if (existing) {
      const [updated] = await import_database17.db.update(import_database17.featureFlags).set({ enabled }).where((0, import_drizzle_orm16.eq)(import_database17.featureFlags.id, existing.id)).returning();
      return updated;
    }
    const [inserted] = await import_database17.db.insert(import_database17.featureFlags).values({
      tenantId,
      code,
      enabled
    }).returning();
    return inserted;
  }
};

// apps/api/src/http/routes/admin.ts
var adminRouter = (0, import_express19.Router)();
var updateFeatureFlagSchema = import_zod17.z.object({
  code: import_zod17.z.string().min(2).max(100),
  enabled: import_zod17.z.boolean()
});
adminRouter.get(
  "/system-health",
  authenticate,
  requireTenantContext,
  requirePermission("admin:read"),
  async (_req, res, next) => {
    try {
      const health = await AdminService.getSystemHealth();
      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      next(error);
    }
  }
);
adminRouter.get(
  "/security-events",
  authenticate,
  requireTenantContext,
  requirePermission("admin:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const severity = req.query.severity;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : void 0;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : void 0;
      const events = await AdminService.listSecurityEvents(tenantId, {
        severity,
        limit,
        offset
      });
      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }
);
adminRouter.get(
  "/deployment-profile",
  authenticate,
  requireTenantContext,
  requirePermission("admin:read"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const profile = await AdminService.getTenantDeploymentProfile(tenantId);
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }
);
adminRouter.patch(
  "/feature-flags",
  authenticate,
  requireTenantContext,
  requirePermission("admin:write"),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const parseResult = updateFeatureFlagSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ApiError(
          400,
          "Invalid feature flag payload",
          "INVALID_PAYLOAD",
          parseResult.error.flatten()
        );
      }
      const flag = await AdminService.updateFeatureFlag(
        tenantId,
        parseResult.data.code,
        parseResult.data.enabled
      );
      res.json({
        success: true,
        data: flag
      });
    } catch (error) {
      next(error);
    }
  }
);

// apps/api/src/http/app.ts
function createApp(testRouter) {
  const app = (0, import_express20.default)();
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
  app.use("/api/v1/admin", adminRouter);
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
