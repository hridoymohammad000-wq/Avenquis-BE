import helmet from "helmet";
import express from "express";

export const securityMiddlewares = [
  helmet(), // Adds secure HTTP headers and disables X-Powered-By
  express.json({ limit: "100kb" }), // Safe body parsing limit
  express.urlencoded({ extended: true, limit: "100kb" }),
];
