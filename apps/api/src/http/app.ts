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
import { engagementRouter } from "./routes/engagements.js";
import { workingPaperRouter } from "./routes/working-papers.js";
import { taskRouter } from "./routes/tasks.js";
import { timesheetRouter } from "./routes/timesheets.js";
import { billingRouter } from "./routes/billing.js";
import { certificateRouter } from "./routes/certificates.js";
import { notificationRouter } from "./routes/notifications.js";
import { analyticsRouter } from "./routes/analytics.js";
import { adminRouter } from "./routes/admin.js";
import { trialBalanceRouter } from "./routes/trial-balance.js";
import { materialityRouter } from "./routes/materiality.js";
import {
  auditProgramRouter,
  auditProcedureRouter,
} from "./routes/audit-program.js";
import { samplingEvidenceRouter } from "./routes/sampling-evidence.js";
import { exceptionReviewRouter } from "./routes/exception-review.js";
import { completionReportingRouter } from "./routes/completion-reporting.js";
import { auditFilesRouter } from "./routes/audit-files.js";
import { qualityControlRouter } from "./routes/quality-control.js";

export function createApp(testRouter?: express.Router) {
  const app = express();

  // 1. Request Context
  app.use(requestIdMiddleware);

  // 2. Logging
  app.use(loggingMiddleware);

  // 3. Security & Parsing
  app.use(securityMiddlewares);

  // 4. Routes
  app.get("/", (_req, res) => {
    res.status(200).json({ status: "ok", service: "avenquis-api" });
  });
  app.use("/health", healthRouter);
  app.use("/api/v1/auth/mfa", mfaRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/tenants", tenantRouter);
  app.use("/api/v1/departments", departmentRouter);
  app.use("/api/v1/designations", designationRouter);
  app.use("/api/v1/staff", staffRouter);
  app.use("/api/v1/students", studentRouter);
  app.use("/api/v1/clients", clientRouter);
  app.use("/api/v1/engagements", engagementRouter);
  app.use("/api/v1/working-papers", workingPaperRouter);
  app.use("/api/v1/tasks", taskRouter);
  app.use("/api/v1/timesheets", timesheetRouter);
  app.use("/api/v1/billing", billingRouter);
  app.use("/api/v1/certificates", certificateRouter);
  app.use("/api/v1/notifications", notificationRouter);
  app.use("/api/v1/analytics", analyticsRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/trial-balances", trialBalanceRouter);
  app.use("/api/v1/audit", materialityRouter); // Materiality & Risks (Phase 15)
  app.use("/api/v1/audit/programs", auditProgramRouter); // Programs (Phase 16)
  app.use("/api/v1/audit/procedures", auditProcedureRouter); // Procedures (Phase 16)
  app.use("/api/v1/audit", samplingEvidenceRouter); // Sampling & Evidence (Phase 17)
  app.use("/api/v1/audit", exceptionReviewRouter); // Exceptions & Review (Phase 18)
  app.use("/api/v1/audit", completionReportingRouter); // Completion & Reporting (Phase 19)
  app.use("/api/v1/audit", auditFilesRouter); // PAF & CAF (Phase 20)
  app.use("/api/v1/audit", qualityControlRouter); // Quality Control (Phase 21)

  if (testRouter) {
    app.use("/test", testRouter);
  }

  // 5. Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
