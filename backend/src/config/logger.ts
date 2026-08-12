import pino from "pino";

import { getLoggingEnvironment } from "./env.js";

interface CreateLoggerOptions {
  destination?: pino.DestinationStream;
  level?: pino.LevelWithSilent;
  pretty?: boolean;
}

const REDACTED_VALUE = "[REDACTED]";

const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "req.body.password",
  "req.body.confirmPassword",
  "res.headers.set-cookie",
  "err.body",
  "password",
  "confirmPassword",
  "token",
  "accessToken",
  "refreshToken",
  "passwordHash",
] as const;

function readStringProperty(
  value: unknown,
  property: string,
): string | undefined {
  if (
    typeof value !== "object" ||
    value === null ||
    !(property in value)
  ) {
    return undefined;
  }

  const propertyValue = (value as Record<string, unknown>)[property];

  return typeof propertyValue === "string"
    ? propertyValue
    : undefined;
}

export function serializeError(
  error: unknown,
): Record<string, unknown> {
  const type =
    readStringProperty(error, "type") ??
    readStringProperty(error, "name") ??
    "UnknownError";
  const message =
    readStringProperty(error, "message") ??
    "A non-Error value was thrown.";
  const stack = readStringProperty(error, "stack");

  return {
    type,
    message,
    ...(stack === undefined ? {} : { stack }),
  };
}

export function createLogger(
  options: CreateLoggerOptions = {},
): pino.Logger {
  const { nodeEnv, logLevel } = getLoggingEnvironment();
  const level =
    options.level ?? (nodeEnv === "test" ? "silent" : logLevel);
  const usePrettyOutput =
    options.pretty ??
    (nodeEnv === "development" && options.destination === undefined);
  const loggerOptions: pino.LoggerOptions = {
    level,
    serializers: {
      err: serializeError,
    },
    redact: {
      paths: [...REDACT_PATHS],
      censor: REDACTED_VALUE,
    },
  };

  if (options.destination !== undefined) {
    return pino(loggerOptions, options.destination);
  }

  if (usePrettyOutput) {
    return pino(
      loggerOptions,
      pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }),
    );
  }

  return pino(loggerOptions);
}

export const logger = createLogger();
