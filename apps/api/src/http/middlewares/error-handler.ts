import { Request, Response, NextFunction } from "express";
import { ApiError } from "../../errors/api-error.js";
import { logger } from "../../logging/logger.js";
import { env } from "../../config/env.js";

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  next(new ApiError(404, "NOT_FOUND", "Resource not found"));
}

export function errorHandler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) {
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred";

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    statusCode = 400;
    code = "BAD_REQUEST";
    message = "Malformed JSON payload";
  } else if (err.type === "entity.too.large") {
    statusCode = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "Request body exceeds size limit";
  } else {
    logger.error({ err, reqId: req.id }, "Unhandled error");
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
}
