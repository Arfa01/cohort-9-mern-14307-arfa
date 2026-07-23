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
  });
});