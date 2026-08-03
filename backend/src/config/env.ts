//real server starts here, validates the complete configuration: reads env variables, sets up logging, connects to db, and starts listening for incoming requests.
// auth helpers can only validate their own subset when they run, this avoids coupling a unit test for one layer to unrelared db/CORS variables. 

import "dotenv/config";

const allowedEnvironments = ["development","test","production",] as const;

const allowedLogLevels = [ "fatal","error", "warn", "info", "debug", "trace","silent",] as const;

type NodeEnvironment = (typeof allowedEnvironments)[number];
type LogLevel = (typeof allowedLogLevels)[number];

export interface AppEnvironment {
  nodeEnv: NodeEnvironment;
  port: number;
  mongodbUri: string;
  logLevel: LogLevel;
  clientOrigin: string;
  jwtSecret: string;
  jwtTtlSeconds: number;
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

function readJwtSecret(): string {
  const jwtSecret = readRequiredVariable("JWT_SECRET");

  if (jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }

  return jwtSecret;
}

function readJwtTtlSeconds(): number {
  const rawValue = readRequiredVariable("JWT_TTL_SECONDS");
  const jwtTtlSeconds = Number(rawValue);

  if (
    !Number.isSafeInteger(jwtTtlSeconds) ||
    jwtTtlSeconds < 1 ||
    jwtTtlSeconds > 31_536_000
  ) {
    throw new Error(
      "JWT_TTL_SECONDS must be an integer between 1 and 31536000",
    );
  }

  return jwtTtlSeconds;
}

export function getLoggingEnvironment(): Readonly<
  Pick<AppEnvironment, "nodeEnv" | "logLevel">
> {
  return Object.freeze({
    nodeEnv: readNodeEnvironment(),
    logLevel: readLogLevel(),
  });
}

export function getAuthenticationEnvironment(): Readonly<
  Pick<
    AppEnvironment,
    "nodeEnv" | "jwtSecret" | "jwtTtlSeconds"
  >
> {
  return Object.freeze({
    nodeEnv: readNodeEnvironment(),
    jwtSecret: readJwtSecret(),
    jwtTtlSeconds: readJwtTtlSeconds(),
  });
}

export function getEnvironment(): Readonly<AppEnvironment> {
  const loggingEnvironment = getLoggingEnvironment();
  const authenticationEnvironment =
    getAuthenticationEnvironment();

  return Object.freeze({
    ...loggingEnvironment,
    port: readPort(),
    mongodbUri: readRequiredVariable("MONGODB_URI"),
    clientOrigin: readRequiredVariable("CLIENT_ORIGIN"),
    jwtSecret: authenticationEnvironment.jwtSecret,
    jwtTtlSeconds:
      authenticationEnvironment.jwtTtlSeconds,
  });
}