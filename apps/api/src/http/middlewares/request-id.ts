import { randomUUID } from "node:crypto";
import { Request, Response, NextFunction } from "express";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const reqId = req.get("X-Request-Id");
  const id = reqId && /^[a-zA-Z0-9-]+$/.test(reqId) ? reqId : randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}

// Extend Express Request interface to include 'id'
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id: string;
    }
  }
}
