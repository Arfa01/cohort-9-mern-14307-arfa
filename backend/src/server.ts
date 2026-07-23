import type { Server } from "node:http";

import { createApp } from "./app.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.js";
import { getEnvironment } from "./config/env.js";
import { logger } from "./config/logger.js";

async function closeHttpServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function startServer(): Promise<void> {
  const environment = getEnvironment();

  await connectDatabase(environment.mongodbUri);

  const app = createApp(environment.clientOrigin);

  const server = app.listen(environment.port, () => {
    logger.info(
      {
        port: environment.port,
        environment: environment.nodeEnv,
      },
      "Notes API is listening",
    );
  });

  let shutdownStarted = false;

  async function shutdown(signal: string): Promise<void> {
    if (shutdownStarted) {
      return;
    }

    shutdownStarted = true;

    logger.info({ signal }, "Graceful shutdown started");

    try {
      await closeHttpServer(server);
      await disconnectDatabase();
      logger.info("Graceful shutdown completed");
      process.exitCode = 0;
    } catch (error: unknown) {
      logger.error({ err: error }, "Graceful shutdown failed");
      process.exitCode = 1;
    }
  }

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

void startServer().catch((error: unknown) => {
  logger.error(
    {
      errorName: error instanceof Error ? error.name : "UnknownError",
    },
    "The Notes API could not start",
  );

  process.exitCode = 1;
});