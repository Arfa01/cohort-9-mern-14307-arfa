import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";

import { AppError } from "../utils/app-error.js";

function readErrorType(error: unknown): string | undefined {
  if (
    typeof error !== "object" ||
    error === null ||
    !("type" in error)
  ) {
    return undefined;
  }

  const errorType = (error as { type?: unknown }).type;

  return typeof errorType === "string" ? errorType : undefined;
}

function normalizeOperationalError(
  error: unknown,
): AppError | undefined {
  if (error instanceof AppError) {
    return error;
  }

  const errorType = readErrorType(error);

  if (errorType === "entity.parse.failed") {
    return new AppError(
      400,
      "INVALID_JSON",
      "The request body contains invalid JSON.",
    );
  }

  if (errorType === "entity.too.large") {
    return new AppError(
      413,
      "PAYLOAD_TOO_LARGE",
      "The request body exceeds the allowed size.",
    );
  }

  return undefined;
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  if (response.headersSent) {
    request.log.error(
      { err: error },
      "Request failed after response headers were sent",
    );
    next(error);
    return;
  }

  const operationalError = normalizeOperationalError(error);

  if (operationalError !== undefined) {
    const logContext = {
      errorCode: operationalError.code,
      statusCode: operationalError.statusCode,
    };

    if (operationalError.statusCode >= 500) {
      request.log.error(logContext, "Request failed");
    } else {
      request.log.warn(logContext, "Request rejected");
    }

    response.status(operationalError.statusCode).json({
      success: false,
      error: {
        code: operationalError.code,
        message: operationalError.message,
        ...(operationalError.details === undefined
          ? {}
          : { details: operationalError.details }),
      },
    });
    return;
  }

  request.log.error(
    {
      err: error,
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
