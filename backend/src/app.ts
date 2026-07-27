import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { healthRouter } from "./routes/health.routes.js";

export function createApp(clientOrigin: string): Express {
  const app = express();

  app.disable("x-powered-by");

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

  app.use(
    pinoHttp({
      logger,
    }),
  );

  app.use("/api/health", healthRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
