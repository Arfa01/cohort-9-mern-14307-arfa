import { expect } from "chai";
import request from "supertest";

import { createApp } from "../src/app.js";

describe("Health API", () => {
  const app = createApp("http://localhost:5173");

  describe("GET /api/health", () => {
    it("returns the service health information", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data.service).to.equal("notes-api");
      expect(response.body.data.status).to.equal("ok");
      expect(response.body.data.timestamp).to.be.a("string");

      const parsedTimestamp = Date.parse(response.body.data.timestamp);

      expect(Number.isNaN(parsedTimestamp)).to.equal(false);
    });
  });

  describe("unknown route", () => {
    it("returns a structured 404 response", async () => {
      const response = await request(app).get(
        "/api/does-not-exist",
      );

      expect(response.status).to.equal(404);
      expect(response.body.success).to.equal(false);
      expect(response.body.error.code).to.equal(
        "ROUTE_NOT_FOUND",
      );
      expect(response.body.error.message).to.equal(
        "The requested route was not found.",
      );
      expect(response.body.error.path).to.equal(
        "/api/does-not-exist",
      );
    });

    it("does not expose query strings in the 404 response", async () => {
      const response = await request(app).get(
        "/api/does-not-exist?token=should-not-be-returned",
      );

      expect(response.status).to.equal(404);
      expect(response.body.error.path).to.equal(
        "/api/does-not-exist",
      );
      expect(JSON.stringify(response.body)).not.to.contain(
        "should-not-be-returned",
      );
    });
  });

  describe("GET /api/health/live", () => {
  it("returns successful liveness information", async () => {
    const response = await request(app).get("/api/health/live");

    expect(response.status).to.equal(200);
    expect(response.body.success).to.equal(true);
    expect(response.body.data.probe).to.equal("liveness");
    expect(response.body.data.status).to.equal("ok");
  });
});

describe("GET /api/health/ready", () => {
  it("returns 503 when MongoDB is disconnected", async () => {
    const response = await request(app).get("/api/health/ready");

    expect(response.status).to.equal(503);
    expect(response.body.success).to.equal(false);
    expect(response.body.data.probe).to.equal("readiness");
    expect(response.body.data.database).to.equal("disconnected");
  });
});
});