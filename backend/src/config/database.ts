import mongoose from "mongoose";

import { logger } from "./logger.js";

let listenersRegistered = false;

function registerConnectionListeners(): void {
  if (listenersRegistered) {
    return;
  }

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB connection was disconnected");
  });

  mongoose.connection.on("error", () => {
    logger.error("A MongoDB connection error occurred");
  });

  listenersRegistered = true;
}

export async function connectDatabase(uri: string): Promise<void> {
  registerConnectionListeners();

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  logger.info(
    {
      databaseName: mongoose.connection.name,
    },
    "MongoDB connected successfully",
  );
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}