import jwt from "jsonwebtoken";

import { getAuthenticationEnvironment } from "../config/env.js";

const JWT_ISSUER = "shine-notes-api";
const JWT_AUDIENCE = "shine-notes-web";

export function createAuthToken(userId: string): string {
  const { jwtSecret, jwtTtlSeconds } =
    getAuthenticationEnvironment();

  return jwt.sign({}, jwtSecret, {   // signing makes a tokem tamper-proof and verifiable
    algorithm: "HS256",              // the helper functions read configuration from inside the function so we dont import app.ts or env.ts here
    subject: userId,
    expiresIn: jwtTtlSeconds,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

export function verifyAuthToken(token: string): string {
  const { jwtSecret } = getAuthenticationEnvironment();

  const payload = jwt.verify(token, jwtSecret, {   // verification checks signature, expiry, issuer, audience, algorithm
    algorithms: ["HS256"],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });

  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    payload.sub.length === 0
  ) {
    throw new Error(
      "Authentication token has no valid subject.",
    );
  }

  return payload.sub; // JWT gets the mongo userId from the subject claim of the toekn payload
}