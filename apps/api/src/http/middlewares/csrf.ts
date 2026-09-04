import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';

export default function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!unsafeMethods.includes(req.method)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return next();
  }

  const hasAuthCookie = !!(req.cookies?.accessToken || req.cookies?.refreshToken);
  if (!hasAuthCookie) {
    return next();
  }

  const origin = req.headers.origin;
  if (!origin || origin !== env.CORS_ORIGIN) {
    return res.status(403).json({ error: 'Invalid or missing Origin' });
  }

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.get('X-CSRF-Token') || req.get('csrf-token');
  
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  return next();
}
