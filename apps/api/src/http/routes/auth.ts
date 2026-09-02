import { Router } from "express";
import { z } from "zod";
import { db, userProfiles, eq } from "@avenquis/database";
import { AuthService } from "../../services/auth.service.js";
import { AuditService } from "../../services/audit.service.js";
import { authenticate } from "../middlewares/auth.js";
import { ApiError } from "../../errors/api-error.js";
import { authRateLimit } from "../middlewares/rate-limit.js";

export const authRouter = Router();

function setAuthCookies(
  res: import("express").Response,
  tokens: ReturnType<typeof AuthService.generateTokens>,
) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as
      "none" | "lax",
    path: "/",
  };
  res.cookie("accessToken", tokens.accessToken, options);
  res.cookie("refreshToken", tokens.refreshToken, {
    ...options,
    path: "/api/v1/auth",
  });
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  fullName: z.string().min(2, "Full name must be at least 2 characters long"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

// POST /register
authRouter.post("/register", authRateLimit, async (req, res, next) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(
        400,
        "Validation failed",
        "VALIDATION_ERROR",
        parseResult.error.format(),
      );
    }

    const { email, password, fullName } = parseResult.data;

    const existing = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.email, email),
    });

    if (existing) {
      throw new ApiError(
        409,
        "User with this email already exists",
        "EMAIL_EXISTS",
      );
    }

    const passwordHash = await AuthService.hashPassword(password);

    const [newUser] = await db
      .insert(userProfiles)
      .values({
        email,
        fullName,
        passwordHash,
        status: "active",
      })
      .returning();

    const tokens = AuthService.generateTokens({
      userId: newUser.id,
      email: newUser.email,
      aal: "aal1",
    });
    setAuthCookies(res, tokens);

    await AuditService.logSecurityEvent({
      eventType: "USER_REGISTERED",
      severity: "info",
      details: { userId: newUser.id, email: newUser.email },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          status: newUser.status,
          mfaEnabled: newUser.mfaEnabled,
        },
        tokens,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /login
authRouter.post("/login", authRateLimit, async (req, res, next) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(
        400,
        "Validation failed",
        "VALIDATION_ERROR",
        parseResult.error.format(),
      );
    }

    const { email, password } = parseResult.data;

    const user = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.email, email),
    });

    if (!user || !user.passwordHash) {
      throw new ApiError(
        401,
        "Invalid email or password",
        "INVALID_CREDENTIALS",
      );
    }

    if (user.status !== "active") {
      throw new ApiError(
        403,
        `User account is ${user.status}`,
        "USER_INACTIVE",
      );
    }

    const isMatch = await AuthService.comparePassword(
      password,
      user.passwordHash,
    );
    if (!isMatch) {
      await AuditService.logSecurityEvent({
        eventType: "FAILED_LOGIN_ATTEMPT",
        severity: "warning",
        details: { email, ipAddress: req.ip },
        ipAddress: req.ip,
      });
      throw new ApiError(
        401,
        "Invalid email or password",
        "INVALID_CREDENTIALS",
      );
    }

    const aal = "aal1" as const;
    const tokens = AuthService.generateTokens({
      userId: user.id,
      email: user.email,
      aal,
    });
    setAuthCookies(res, tokens);

    await AuditService.logSecurityEvent({
      eventType: "SUCCESSFUL_LOGIN",
      severity: "info",
      details: {
        userId: user.id,
        email: user.email,
        mfaEnabled: user.mfaEnabled,
        aal,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          status: user.status,
          mfaEnabled: user.mfaEnabled,
        },
        requireMfa: user.mfaEnabled,
        tokens,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /me
authRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, req.user!.id),
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
          avatarUrl: user.avatarUrl,
        },
        aal: req.user!.aal,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /logout
authRouter.post("/logout", authenticate, async (req, res, next) => {
  try {
    if (req.authToken) await AuthService.revokeToken(req.authToken);
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/api/v1/auth" });
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
});
