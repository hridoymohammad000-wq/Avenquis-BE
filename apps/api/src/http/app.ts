import express from "express";
import { requestIdMiddleware } from "./middlewares/request-id.js";
import { loggingMiddleware } from "./middlewares/logging.js";
import { securityMiddlewares } from "./middlewares/security.js";
import { notFoundHandler, errorHandler } from "./middlewares/error-handler.js";
import { healthRouter } from "./routes/health.js";

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
  if (testRouter) {
    app.use("/test", testRouter);
  }

  // 5. Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
