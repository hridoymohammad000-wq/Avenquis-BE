import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level:
    env.NODE_ENV === "test"
      ? "silent"
      : env.NODE_ENV === "development"
        ? "debug"
        : "info",
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: { colorize: true },
        }
      : undefined,
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
    "res.headers['set-cookie']",
  ],
});
