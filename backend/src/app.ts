import cookieParser from "cookie-parser";   // so we can use request.cookies
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { authRouter } from "./routes/auth.routes.js";
import { healthRouter } from "./routes/health.routes.js";

export function createApp(clientOrigin: string): Express {
  const app = express();

  app.disable("x-powered-by");

  app.use(helmet());

  app.use(
    cors({                     // allows react origin to send the cookie
      origin: clientOrigin,   // origin should never be * because we want to allow only our react app to send the cookie. if we allow *, then any site can send the cookie and get access to the user's session.
      credentials: true,
    }),
  );

  app.use(
    express.json({
      limit: "1mb",
    }),
  );

  app.use(cookieParser());

  app.use(
    pinoHttp({
      logger,
    }),
  );

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);      // auth router should be mounted before the errors middlewares.

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}