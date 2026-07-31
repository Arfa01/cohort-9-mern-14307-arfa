// incoming req -> middleware -> conroller -> service -> db -> service -> controller -> middleware -> outgoing res. 
// only trusts userID inside correct jwt token, places that id in request.auth. Does not trust body.userId, query.userId, params.userId, etc. because those can be tampered with by the client.
import type { Request, RequestHandler } from "express";
import mongoose from "mongoose";

import { AppError } from "../utils/app-error.js";
import { AUTH_COOKIE_NAME } from "../utils/auth-cookie.js";
import { verifyAuthToken } from "../utils/jwt.js";

function readAuthCookie(
  request: Request,
): string | undefined {
  const cookies = request.cookies as unknown;

  if (typeof cookies !== "object" || cookies === null) {
    return undefined;
  }

  const token = (
    cookies as Record<string, unknown>
  )[AUTH_COOKIE_NAME];

  return typeof token === "string" ? token : undefined;
}

export const authenticate: RequestHandler = (
  request,
  _response,
  next,
): void => {
  const token = readAuthCookie(request);

  if (token === undefined) {
    next(
      new AppError(
        401,
        "UNAUTHENTICATED",
        "Authentication is required.",
      ),
    );
    return;
  }

  try {
    const userId = verifyAuthToken(token);

    if (!mongoose.isObjectIdOrHexString(userId)) {
      throw new Error(
        "Token subject is not a MongoDB ObjectId.",
      );
    }

    request.auth = {
      userId,
    };

    next();
  } catch {
    next(
      new AppError(
        401,
        "UNAUTHENTICATED",
        "Authentication is required.",
      ),
    );
  }
};
