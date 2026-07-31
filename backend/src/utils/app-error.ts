// to give expected errors a format instead of default 500 Internal Server Error

interface AppErrorOptions {
  details?: unknown;
  cause?: unknown;
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    options: AppErrorOptions = {},
  ) {
    super(
      message,
      options.cause === undefined
        ? undefined
        : { cause: options.cause },
    );

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = options.details;
  }
}