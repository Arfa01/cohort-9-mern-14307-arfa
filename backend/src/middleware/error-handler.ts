import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";

import { logger } from "../config/logger.js";
import { AppError } from "../utils/app-error.js";

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

  if (error instanceof AppError) {    // expected errors (instances of appError) recieve their intended 400, 401, 409
    response.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined
          ? {}
          : { details: error.details }),
      },
    });
    return;
  }

  logger.error(
    {
      err: error,
      method: request.method,
      path: request.path,
    },
    "Unhandled request error",
  );

  response.status(500).json({       // unexpected errors are logged internally, return generic 500
    success: false,               
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        "An unexpected error occurred. Please try again later.",
    },
  });
};