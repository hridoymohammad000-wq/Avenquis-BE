import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../services/auth.service.js";
import { ApiError } from "../../errors/api-error.js";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

  if (!token) {
    return next(new ApiError(401, "Authentication required", "UNAUTHORIZED"));
  }

  try {
    const payload = AuthService.verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
      aal: payload.aal,
    };
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}
