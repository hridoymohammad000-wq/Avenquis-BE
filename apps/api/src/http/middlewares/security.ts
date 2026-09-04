import helmet from "helmet";
import express from "express";
import cookieParser from "cookie-parser";
import { env } from "../../config/env.js";
import csrfMiddleware from "./csrf.js";

function corsMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const origin = req.headers.origin;
  if (origin === env.CORS_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Tenant-Id, X-CSRF-Token, csrf-token",
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(origin === env.CORS_ORIGIN ? 204 : 403);
  }
  return next();
}

export const securityMiddlewares = [
  corsMiddleware,
  helmet(), // Adds secure HTTP headers and disables X-Powered-By
  cookieParser(),
  csrfMiddleware,
  express.json({ limit: "100kb" }), // Safe body parsing limit
  express.urlencoded({ extended: true, limit: "100kb" }),
];
