import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import type pino from "pino";
import { pinoHttp, type HttpLogger } from "pino-http";

import {
  logger,
  serializeError,
} from "./config/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { authRouter } from "./routes/auth.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { noteRouter } from "./routes/note.routes.js";

export function createRequestLogger(
  appLogger: pino.Logger = logger,
): HttpLogger<IncomingMessage, ServerResponse> {
  return pinoHttp<IncomingMessage, ServerResponse>({
    logger: appLogger,
    serializers: {
      req: (request) => ({
        id: request.id,
        method: request.method,
        path:
          typeof request.url === "string"
            ? request.url.split("?", 1)[0]
            : undefined,
        remoteAddress: request.remoteAddress,
        remotePort: request.remotePort,
      }),
      res: (response) => ({
        statusCode: response.statusCode,
      }),
      err: serializeError,
    },
    genReqId: (_request, response) => {
      const requestId = randomUUID();

      response.setHeader("X-Request-Id", requestId);

      return requestId;
    },
    customProps: (request) => ({
      requestId: request.id,
    }),
    customReceivedMessage: () => "request received",
    customLogLevel: (_request, response, error) => {
      if (error !== undefined || response.statusCode >= 500) {
        return "error";
      }

      if (response.statusCode >= 400) {
        return "warn";
      }

      return "info";
    },
  });
}

export function createApp(
  clientOrigin: string,
  appLogger: pino.Logger = logger,
): Express {
  const app = express();

  app.disable("x-powered-by");

  app.use(createRequestLogger(appLogger));

  app.use(helmet());

  app.use(
    cors({
      origin: clientOrigin,
      credentials: true,
    }),
  );

  app.use(
    express.json({
      limit: "1mb",
    }),
  );

  app.use(cookieParser());

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/notes", noteRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
