import helmet from "helmet";
import express from "express";
import cookieParser from "cookie-parser";

export const securityMiddlewares = [
  helmet(), // Adds secure HTTP headers and disables X-Powered-By
  cookieParser(),
  express.json({ limit: "100kb" }), // Safe body parsing limit
  express.urlencoded({ extended: true, limit: "100kb" }),
];
