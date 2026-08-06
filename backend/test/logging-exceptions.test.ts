import { expect } from "chai";
import express from "express";
import { Writable } from "node:stream";
import request from "supertest";

import {
  createApp,
  createRequestLogger,
} from "../src/app.js";
import { createLogger } from "../src/config/logger.js";
import { errorHandler } from "../src/middleware/error-handler.js";
import { AUTH_COOKIE_NAME } from "../src/utils/auth-cookie.js";

interface LogRecord {
  level?: number;
  msg?: string;
  requestId?: string;
  errorCode?: string;
  statusCode?: number;
  res?: {
    statusCode?: number;
  };
}

class LogCollector extends Writable {
  private output = "";

  override _write(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    this.output += chunk.toString("utf8");
    callback();
  }

  get text(): string {
    return this.output;
  }

  get records(): LogRecord[] {
    return this.output
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as LogRecord);
  }
}

function createTestLogger(): {
  collector: LogCollector;
  logger: ReturnType<typeof createLogger>;
} {
  const collector = new LogCollector();
  const logger = createLogger({
    destination: collector,
    level: "trace",
    pretty: false,
  });

  return { collector, logger };
}

async function waitForLogs(): Promise<void> {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}

describe("Application logging and exception handling", () => {
  it("correlates successful request and response logs", async () => {
    const { collector, logger } = createTestLogger();
    const app = createApp("http://localhost:5173", logger);
    const incomingRequestId = "client-request-123";

    const response = await request(app)
      .get("/api/health")
      .set("X-Request-Id", incomingRequestId);

    await waitForLogs();

    expect(response.status).to.equal(200);
    expect(response.headers["x-request-id"]).to.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(response.headers["x-request-id"]).not.to.equal(
      incomingRequestId,
    );

    const requestId = response.headers["x-request-id"] as string;
    const receivedLog = collector.records.find(
      (record) => record.msg === "request received",
    );

    const completionLog = collector.records.find(
      (record) => record.msg === "request completed",
    );

    expect(receivedLog).to.include({
      level: 30,
      requestId,
    });
    expect(completionLog).to.include({
      level: 30,
      requestId,
    });
    expect(completionLog?.res?.statusCode).to.equal(200);
  });

  it("warn-logs 404 responses without headers or query values", async () => {
    const { collector, logger } = createTestLogger();
    const app = createApp("http://localhost:5173", logger);
    const querySecret = "query-secret";
    const authorizationSecret = "authorization-secret";
    const cookieSecret = "cookie-secret";

    const response = await request(app)
      .get(`/api/does-not-exist?token=${querySecret}`)
      .set("Authorization", `Bearer ${authorizationSecret}`)
      .set("Cookie", `${AUTH_COOKIE_NAME}=${cookieSecret}`);

    await waitForLogs();

    expect(response.status).to.equal(404);
    expect(collector.text).not.to.contain(querySecret);
    expect(collector.text).not.to.contain(authorizationSecret);
    expect(collector.text).not.to.contain(cookieSecret);

    const completionLog = collector.records.find(
      (record) => record.msg === "request completed",
    );

    expect(completionLog?.level).to.equal(40);
    expect(completionLog?.res?.statusCode).to.equal(404);
  });

  it("returns and logs a meaningful invalid-JSON error", async () => {
    const { collector, logger } = createTestLogger();
    const app = createApp("http://localhost:5173", logger);
    const passwordMarker = "invalid-json-password-marker";
    const incomingRequestId = "invalid-json-request";

    const response = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .set("X-Request-Id", incomingRequestId)
      .send(
        `{"email":"arfa@example.com","password":"${passwordMarker}"`,
      );

    await waitForLogs();

    expect(response.status).to.equal(400);
    expect(response.body.error).to.deep.equal({
      code: "INVALID_JSON",
      message: "The request body contains invalid JSON.",
    });
    expect(collector.text).not.to.contain(passwordMarker);

    const requestId = response.headers["x-request-id"] as string;

    const rejectionLog = collector.records.find(
      (record) => record.msg === "Request rejected",
    );

    expect(rejectionLog).to.include({
      level: 40,
      requestId,
      errorCode: "INVALID_JSON",
      statusCode: 400,
    });
  });

  it("returns 413 without logging an oversized request body", async () => {
    const { collector, logger } = createTestLogger();
    const app = createApp("http://localhost:5173", logger);
    const payloadMarker = "oversized-payload-marker";

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "arfa@example.com",
        password: `${payloadMarker}${"x".repeat(1_100_000)}`,
      });

    await waitForLogs();

    expect(response.status).to.equal(413);
    expect(response.body.error).to.deep.equal({
      code: "PAYLOAD_TOO_LARGE",
      message: "The request body exceeds the allowed size.",
    });
    expect(collector.text).not.to.contain(payloadMarker);
  });

  it("redacts credentials and logs operational errors safely", async () => {
    const { collector, logger } = createTestLogger();
    const app = createApp("http://localhost:5173", logger);
    const passwordSecret = "password-secret";
    const confirmationSecret = "confirmation-secret";

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Arfa Riaz",
        email: "arfa@example.com",
        password: passwordSecret,
        confirmPassword: confirmationSecret,
      });

    logger.info(
      {
        req: {
          headers: {
            authorization: "Bearer authorization-secret",
            cookie: "session=direct-cookie-secret",
          },
          body: {
            password: passwordSecret,
            confirmPassword: confirmationSecret,
          },
        },
        token: "token-secret",
        passwordHash: "password-hash-secret",
        res: {
          headers: {
            "set-cookie": "response-cookie-secret",
          },
        },
      },
      "Redaction verification",
    );
    logger.error(
      {
        err: {
          type: "SyntaxError",
          message: "Invalid JSON",
          stack: "safe-test-stack",
          body: "raw-error-body-secret",
        },
      },
      "Safe error serialization verification",
    );

    await waitForLogs();

    expect(response.status).to.equal(400);
    expect(collector.text).not.to.contain("authorization-secret");
    expect(collector.text).not.to.contain("direct-cookie-secret");
    expect(collector.text).not.to.contain(passwordSecret);
    expect(collector.text).not.to.contain(confirmationSecret);
    expect(collector.text).not.to.contain("token-secret");
    expect(collector.text).not.to.contain("password-hash-secret");
    expect(collector.text).not.to.contain("response-cookie-secret");
    expect(collector.text).not.to.contain("raw-error-body-secret");
    expect(collector.text).to.contain("[REDACTED]");

    const rejectionLog = collector.records.find(
      (record) => record.errorCode === "VALIDATION_ERROR",
    );

    expect(rejectionLog).to.include({
      level: 40,
      statusCode: 400,
    });
  });

  it("logs unexpected exceptions and returns a generic 500", async () => {
    const { collector, logger } = createTestLogger();
    const app = express();

    app.use(createRequestLogger(logger));
    app.get("/explode", () => {
      throw new Error("Simulated database outage");
    });
    app.use(errorHandler);

    const response = await request(app).get("/explode");

    await waitForLogs();

    expect(response.status).to.equal(500);
    expect(response.body.error).to.deep.equal({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred. Please try again later.",
    });
    expect(JSON.stringify(response.body)).not.to.contain(
      "Simulated database outage",
    );

    const errorLog = collector.records.find(
      (record) => record.msg === "Unhandled request error",
    );

    expect(errorLog).to.include({
      level: 50,
      requestId: response.headers["x-request-id"],
    });
  });

  it("records logout as a user activity", async () => {
    const { collector, logger } = createTestLogger();
    const app = createApp("http://localhost:5173", logger);

    const response = await request(app).post("/api/auth/logout");

    await waitForLogs();

    expect(response.status).to.equal(200);
    expect(
      collector.records.some(
        (record) => record.msg === "User logged out",
      ),
    ).to.equal(true);
  });
});
