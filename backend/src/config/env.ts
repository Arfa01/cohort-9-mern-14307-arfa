import "dotenv/config";

const allowedEnvironments = [ "development", "test", "production",] as const;

const allowedLogLevels = [ "fatal", "error", "warn","info","debug","trace","silent",] as const;
type NodeEnvironment = (typeof allowedEnvironments)[number]; // TypeScript type that represents allowed values for the NODE_ENV environment variable. "development" | "test" | "production"
type LogLevel = (typeof allowedLogLevels)[number];

export interface AppEnvironment {
  nodeEnv: NodeEnvironment;
  port: number;
  mongodbUri: string;
  logLevel: LogLevel;
  clientOrigin: string;
}

function readRequiredVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readNodeEnvironment(): NodeEnvironment {
  const value = process.env.NODE_ENV?.trim() ?? "development";

  if (!allowedEnvironments.includes(value as NodeEnvironment)) {
    throw new Error(
      `NODE_ENV must be one of: ${allowedEnvironments.join(", ")}`,
    );
  }

  return value as NodeEnvironment;
}

function readLogLevel(): LogLevel {
  const value = process.env.LOG_LEVEL?.trim() ?? "info";

  if (!allowedLogLevels.includes(value as LogLevel)) {
    throw new Error(
      `LOG_LEVEL must be one of: ${allowedLogLevels.join(", ")}`,
    );
  }

  return value as LogLevel;
}

function readPort(): number {
  const rawPort = process.env.PORT?.trim() ?? "5000";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return port;
}

export function getLoggingEnvironment(): Readonly<
  Pick<AppEnvironment, "nodeEnv" | "logLevel">
> {
  return Object.freeze({
    nodeEnv: readNodeEnvironment(),
    logLevel: readLogLevel(),
  });
}

export function getEnvironment(): Readonly<AppEnvironment> {
  const loggingEnvironment = getLoggingEnvironment();

  return Object.freeze({
    ...loggingEnvironment,
    port: readPort(),
    mongodbUri: readRequiredVariable("MONGODB_URI"),
    clientOrigin: readRequiredVariable("CLIENT_ORIGIN"),
  });
}