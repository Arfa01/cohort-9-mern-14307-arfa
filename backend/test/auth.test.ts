import bcrypt from "bcryptjs";
import { expect } from "chai";
import { MongoMemoryServer } from "mongodb-memory-server";
import type { IncomingHttpHeaders } from "node:http";
import request from "supertest";

import { createApp } from "../src/app.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "../src/config/database.js";
import { UserModel } from "../src/models/user.model.js";
import { AUTH_COOKIE_NAME } from "../src/utils/auth-cookie.js";

const validUser = {
  name: "Arfa Riaz",
  email: "arfa@example.com",
  password: "StrongPassword123!",
  confirmPassword: "StrongPassword123!",
};

function getSetCookies(
  headers: IncomingHttpHeaders,
): string[] {
  const value = headers["set-cookie"];

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return [value];
  }

  return [];
}

function expectNoSecrets(body: unknown): void {
  const serializedBody = JSON.stringify(body).toLowerCase();

  expect(serializedBody).not.to.contain("password");
  expect(serializedBody).not.to.contain("token");
}

describe("Authentication API", function () {
  this.timeout(120_000);    // 120 sec timeout allows test packages to download its local mongodb binnary in the first run

  const app = createApp("http://localhost:5173");
  let mongoServer: MongoMemoryServer | undefined;    // disposable database for integration tests. it is started before the tests and stopped after the tests. it is not used in production.

  before(async () => {
    const testMongoServer = await MongoMemoryServer.create();
    mongoServer = testMongoServer;

    process.env.JWT_SECRET =
      "integration-test-only-secret-that-is-over-32-characters";
    process.env.JWT_TTL_SECONDS = "3600";

    await connectDatabase(
      testMongoServer.getUri("shine_notes_auth_test"),
    );
    await UserModel.init(); // waits for unique email indexes to be created before testing for duplicates. 
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});       // clears document but perserves index. 
  });

  after(async () => {
    await disconnectDatabase();

    if (mongoServer !== undefined) {
      await mongoServer.stop();
    }
  });

  it("registers, hashes the password, and sets a safe cookie", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(validUser);

    expect(response.status).to.equal(201);
    expect(response.body.success).to.equal(true);
    expect(response.body.data.user).to.include({
      name: validUser.name,
      email: validUser.email,
    });
    expectNoSecrets(response.body);

    const cookies = getSetCookies(response.headers);
    const authCookie = cookies.find((cookie) =>
      cookie.startsWith(`${AUTH_COOKIE_NAME}=`),
    );

    expect(authCookie).to.be.a("string");
    expect(authCookie).to.match(/HttpOnly/i);
    expect(authCookie).to.match(/SameSite=Lax/i);

    const storedUser = await UserModel.findOne({
      email: validUser.email,
    })
      .select("+passwordHash")
      .exec();

    expect(storedUser).not.to.equal(null);

    if (storedUser === null) {
      throw new Error("Registered user was not stored.");
    }

    expect(storedUser.passwordHash).not.to.equal(
      validUser.password,
    );
    expect(
      await bcrypt.compare(
        validUser.password,
        storedUser.passwordHash,
      ),
    ).to.equal(true);
  });

  it("normalizes email and rejects a case-insensitive duplicate", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        ...validUser,
        email: "  ARFA@EXAMPLE.COM  ",
      })
      .expect(201);

    const response = await request(app)
      .post("/api/auth/register")
      .send(validUser);

    expect(response.status).to.equal(409);
    expect(response.body.error.code).to.equal(
      "EMAIL_ALREADY_REGISTERED",
    );
    expect(await UserModel.countDocuments()).to.equal(1);
  });

  it("rejects invalid registration input", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        ...validUser,
        confirmPassword: "DifferentPassword123!",
      });

    expect(response.status).to.equal(400);
    expect(response.body.error.code).to.equal(
      "VALIDATION_ERROR",
    );
    expect(await UserModel.countDocuments()).to.equal(0);
  });

  it("rejects passwords longer than bcrypt's 72-byte limit", async () => {
    const oversizedPassword = "é".repeat(37);

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        ...validUser,
        password: oversizedPassword,
        confirmPassword: oversizedPassword,
      });

    expect(response.status).to.equal(400);
    expect(response.body.error.code).to.equal(
      "VALIDATION_ERROR",
    );
  });

  it("uses the same public error for an unknown email and wrong password", async () => {
    await request(app)
      .post("/api/auth/register")
      .send(validUser)
      .expect(201);

    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({
        email: validUser.email,
        password: "DefinitelyWrong123!",
      });

    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({
        email: "unknown@example.com",
        password: "DefinitelyWrong123!",
      });

    expect(wrongPassword.status).to.equal(401);
    expect(unknownEmail.status).to.equal(401);
    expect(wrongPassword.body.error).to.deep.equal(
      unknownEmail.body.error,
    );
    expect(wrongPassword.body.error.code).to.equal(
      "INVALID_CREDENTIALS",
    );
  });

  it("logs in and restores the user through the protected /me route", async () => {
    await request(app)
      .post("/api/auth/register")
      .send(validUser)
      .expect(201);

    const agent = request.agent(app);   //acts iike browser by retaining cookies between requests

    const loginResponse = await agent
      .post("/api/auth/login")
      .send({
        email: validUser.email,
        password: validUser.password,
      });

    expect(loginResponse.status).to.equal(200);
    expectNoSecrets(loginResponse.body);

    const meResponse = await agent.get("/api/auth/me");

    expect(meResponse.status).to.equal(200);
    expect(meResponse.body.data.user).to.deep.equal(
      loginResponse.body.data.user,
    );
    expect(meResponse.headers["cache-control"]).to.equal(
      "no-store",
    );
  });

  it("rejects missing and tampered sessions", async () => {
    const missingCookie = await request(app).get(
      "/api/auth/me",
    );

    const tamperedCookie = await request(app)
      .get("/api/auth/me")
      .set(
        "Cookie",
        `${AUTH_COOKIE_NAME}=not-a-valid-jwt`,
      );

    for (const response of [
      missingCookie,
      tamperedCookie,
    ]) {
      expect(response.status).to.equal(401);
      expect(response.body.error.code).to.equal(
        "UNAUTHENTICATED",
      );
    }
  });

  it("clears the cookie and invalidates the browser session on logout", async () => {
    const agent = request.agent(app);      

    await agent
      .post("/api/auth/register")
      .send(validUser)
      .expect(201);

    await agent.get("/api/auth/me").expect(200);

    const logoutResponse = await agent.post(
      "/api/auth/logout",
    );

    expect(logoutResponse.status).to.equal(200);
    expect(
      getSetCookies(logoutResponse.headers).some(
        (cookie) =>
          cookie.startsWith(`${AUTH_COOKIE_NAME}=`) &&
          /Expires=Thu, 01 Jan 1970/i.test(cookie),
      ),
    ).to.equal(true);

    await agent.get("/api/auth/me").expect(401);
  });

  it("allows logout even when no valid session exists", async () => {
    const response = await request(app).post(
      "/api/auth/logout",
    );

    expect(response.status).to.equal(200);
    expect(response.body.success).to.equal(true);
  });
});

