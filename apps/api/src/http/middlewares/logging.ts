import { pinoHttp } from "pino-http";
import { logger } from "../../logging/logger.js";

export const loggingMiddleware = pinoHttp({
  logger,
  genReqId: (req) => req.id,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  autoLogging: {
    ignore: (req) => req.url === "/health",
  },
});
