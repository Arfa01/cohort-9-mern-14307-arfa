import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.status(200).json({
    success: true,
    data: {
      service: "notes-api",
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
});