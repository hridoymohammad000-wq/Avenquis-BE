import { Router } from "express";
import { z } from "zod";
import qrcode from "qrcode";
import { db, userProfiles, eq } from "@avenquis/database";
import { AuthService } from "../../services/auth.service.js";
import { AuditService } from "../../services/audit.service.js";
import { authenticate } from "../middlewares/auth.js";
import { ApiError } from "../../errors/api-error.js";

export const mfaRouter = Router();

// POST /setup - Generate TOTP secret and QR code
mfaRouter.post("/setup", authenticate, async (req, res, next) => {
  try {
    const user = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, req.user!.id),
    });

    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    const { secret, otpauthUrl } = AuthService.generateMfaSecret(user.email);
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    // Save secret pending verification
    await db
      .update(userProfiles)
      .set({ mfaSecret: secret, updatedAt: new Date() })
      .where(eq(userProfiles.id, user.id));

    res.json({
      success: true,
      data: {
        secret,
        qrCode: qrCodeDataUrl,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /verify - Confirm TOTP enrollment with first code and issue backup codes + AAL2 tokens
mfaRouter.post("/verify", authenticate, async (req, res, next) => {
  try {
    const verifySchema = z.object({
      token: z.string().min(6).max(6),
    });

    const parseResult = verifySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(400, "Invalid MFA token", "VALIDATION_ERROR");
    }

    const user = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, req.user!.id),
    });

    if (!user || !user.mfaSecret) {
      throw new ApiError(
        400,
        "MFA setup has not been initiated",
        "MFA_NOT_INITIATED",
      );
    }

    const isValid = AuthService.verifyMfaToken(
      parseResult.data.token,
      user.mfaSecret,
    );
    if (!isValid) {
      throw new ApiError(
        400,
        "Invalid TOTP verification code",
        "INVALID_MFA_CODE",
      );
    }

    const backupCodes = AuthService.generateBackupCodes(8);

    await db
      .update(userProfiles)
      .set({
        mfaEnabled: true,
        mfaBackupCodes: backupCodes,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, user.id));

    // Issue upgraded AAL2 token
    const tokens = AuthService.generateTokens({
      userId: user.id,
      email: user.email,
      aal: "aal2",
    });

    await AuditService.logSecurityEvent({
      eventType: "MFA_ENROLLED",
      severity: "info",
      details: { userId: user.id },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: {
        message: "MFA successfully enabled",
        backupCodes,
        tokens,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /challenge - Verify TOTP during login to upgrade from AAL1 to AAL2
mfaRouter.post("/challenge", authenticate, async (req, res, next) => {
  try {
    const challengeSchema = z.object({
      token: z.string().min(6),
    });

    const parseResult = challengeSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(400, "Invalid MFA token format", "VALIDATION_ERROR");
    }

    const user = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, req.user!.id),
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new ApiError(
        400,
        "MFA is not enabled for this account",
        "MFA_NOT_ENABLED",
      );
    }

    let isValid = AuthService.verifyMfaToken(
      parseResult.data.token,
      user.mfaSecret,
    );

    // Check backup codes if TOTP fails
    if (!isValid && Array.isArray(user.mfaBackupCodes)) {
      const backupIndex = (user.mfaBackupCodes as string[]).indexOf(
        parseResult.data.token.toUpperCase(),
      );
      if (backupIndex !== -1) {
        isValid = true;
        const updatedBackupCodes = [...(user.mfaBackupCodes as string[])];
        updatedBackupCodes.splice(backupIndex, 1);
        await db
          .update(userProfiles)
          .set({ mfaBackupCodes: updatedBackupCodes })
          .where(eq(userProfiles.id, user.id));
      }
    }

    if (!isValid) {
      await AuditService.logSecurityEvent({
        eventType: "FAILED_MFA_CHALLENGE",
        severity: "warning",
        details: { userId: user.id, ipAddress: req.ip },
        ipAddress: req.ip,
      });
      throw new ApiError(
        401,
        "Invalid MFA code or backup code",
        "INVALID_MFA_CODE",
      );
    }

    const tokens = AuthService.generateTokens({
      userId: user.id,
      email: user.email,
      aal: "aal2",
    });

    await AuditService.logSecurityEvent({
      eventType: "SUCCESSFUL_MFA_CHALLENGE",
      severity: "info",
      details: { userId: user.id, aal: "aal2" },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: {
        message: "MFA challenge verified successfully",
        tokens,
      },
    });
  } catch (err) {
    next(err);
  }
});
