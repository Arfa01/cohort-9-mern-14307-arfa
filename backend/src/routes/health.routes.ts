import { Router, type RequestHandler } from "express";

import { isDatabaseReady } from "../config/database.js";

export const healthRouter = Router();

const livenessHandler: RequestHandler = (_request, response) => {
  response.status(200).json({
    success: true,
    data: {
      service: "notes-api",
      probe: "liveness",
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
};

const readinessHandler: RequestHandler = (_request, response) => {
  const databaseReady = isDatabaseReady();

  response.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    data: {
      service: "notes-api",
      probe: "readiness",
      status: databaseReady ? "ready" : "not_ready",
      database: databaseReady ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    },
  });
};

healthRouter.get("/", livenessHandler);
healthRouter.get("/live", livenessHandler);
healthRouter.get("/ready", readinessHandler);