// in development, we want to see the logs in a more human-readable format, so we use pino-pretty. In production, we want to see the logs in a more structured format, so we use pino.

import pino from "pino";

import { getLoggingEnvironment } from "./env.js";

const { nodeEnv, logLevel } = getLoggingEnvironment();
const isDevelopment = nodeEnv === "development";
const isTest = nodeEnv === "test";

const transport = isDevelopment
  ? pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    })
  : undefined;

export const logger = pino(
  {
    level: isTest ? "silent" : logLevel,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "res.headers.set-cookie",
        "req.body.password",
        "req.body.confirmPassword",
        "password",
        "token",
        "accessToken",
        "refreshToken",
        "passwordHash",
      ],
      censor: "[REDACTED]",
    },
  },
  transport,
);
