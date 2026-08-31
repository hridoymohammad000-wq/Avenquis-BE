import express from "express";
import { requestIdMiddleware } from "./middlewares/request-id.js";
import { loggingMiddleware } from "./middlewares/logging.js";
import { securityMiddlewares } from "./middlewares/security.js";
import { notFoundHandler, errorHandler } from "./middlewares/error-handler.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { mfaRouter } from "./routes/mfa.js";
import { tenantRouter } from "./routes/tenants.js";
import { departmentRouter } from "./routes/departments.js";
import { designationRouter } from "./routes/designations.js";
import { staffRouter } from "./routes/staff.js";
import { studentRouter } from "./routes/students.js";
import { clientRouter } from "./routes/clients.js";

export function createApp(testRouter?: express.Router) {
  const app = express();

  // 1. Request Context
  app.use(requestIdMiddleware);

  // 2. Logging
  app.use(loggingMiddleware);

  // 3. Security & Parsing
  app.use(securityMiddlewares);

  // 4. Routes
  app.use("/health", healthRouter);
  app.use("/api/v1/auth/mfa", mfaRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/tenants", tenantRouter);
  app.use("/api/v1/departments", departmentRouter);
  app.use("/api/v1/designations", designationRouter);
  app.use("/api/v1/staff", staffRouter);
  app.use("/api/v1/students", studentRouter);
  app.use("/api/v1/clients", clientRouter);

  if (testRouter) {
    app.use("/test", testRouter);
  }

  // 5. Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
