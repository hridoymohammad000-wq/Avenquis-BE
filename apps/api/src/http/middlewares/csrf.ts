import { Request, Response, NextFunction } from 'express';

/**
 * CSRF double-submit token validation middleware.
 *
 * Expects a readable cookie named csrfToken (set by the auth route)
 * and a matching value sent in the X-CSRF-Token request header for
 * any state-changing HTTP method (POST, PUT, PATCH, DELETE).
 *
 * If the token is missing or does not match, the request is rejected
 * with HTTP 403. Otherwise the request proceeds to the next handler.
 */
function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (unsafeMethods.includes(req.method)) {
    const cookieToken = req.cookies?.csrfToken;
    const headerToken = req.get('X-CSRF-Token') || req.get('csrf-token');
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  return next();
}

export default csrfMiddleware;
