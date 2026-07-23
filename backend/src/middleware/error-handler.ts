import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";

import { logger } from "../config/logger.js";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  if (response.headersSent) {
    next(error);
    return;
  }

  logger.error(
    {
      err: error,
      method: request.method,
      path: request.originalUrl,
    },
    "Unhandled request error",
  );

  response.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred. Please try again later.",
    },
  });
};