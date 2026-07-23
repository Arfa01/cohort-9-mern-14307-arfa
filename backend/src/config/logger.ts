import "dotenv/config";
import pino from "pino";

const environment = process.env.NODE_ENV ?? "development";
const isDevelopment = environment === "development";
const isTest = environment === "test";

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
    level: isTest ? "silent" : (process.env.LOG_LEVEL ?? "info"),
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
      ],
      censor: "[REDACTED]",
    },
  },
  transport,
);
