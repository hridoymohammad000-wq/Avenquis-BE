import { Server } from "node:http";
import { createApp } from "../http/app.js";
import { env } from "../config/env.js";
import { logger } from "../logging/logger.js";

export function startServer(): Server {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(
      `AVENQUIS API listening on port ${env.PORT} in ${env.NODE_ENV} mode`,
    );
  });

  setupGracefulShutdown(server);

  return server;
}

function setupGracefulShutdown(server: Server) {
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Force shutdown after bounded time
    const timeoutId = setTimeout(() => {
      logger.error("Shutdown timed out. Forcing exit.");
      process.exit(1);
    }, 10000);
    timeoutId.unref();

    // Stop accepting new connections
    server.close((err) => {
      clearTimeout(timeoutId);
      if (err) {
        logger.error({ err }, "Error during shutdown");
        process.exit(1);
      }
      logger.info("Graceful shutdown complete.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
