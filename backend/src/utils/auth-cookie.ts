import type { CookieOptions, Response } from "express";

import { getAuthenticationEnvironment } from "../config/env.js";

export const AUTH_COOKIE_NAME = "shine_notes_session";

function getBaseCookieOptions(): CookieOptions {
  const { nodeEnv } = getAuthenticationEnvironment();

  return {
    httpOnly: true,               // prevents client-side/browser JavaScript from accessing the cookie/JWT
    secure: nodeEnv === "production",      // will require HTTPS in production, but in development http is also fine
    sameSite: "lax",              // lax means the cookie is sent on same-site requests and top-level navigation GET requests, but not on cross-site POST requests. to prevent cross-site forgery risks. 
    path: "/",
  };
}

export function setAuthCookie(
  response: Response,
  token: string,
): void {
  const { jwtTtlSeconds } =
    getAuthenticationEnvironment();

  response.cookie(AUTH_COOKIE_NAME, token, {
    ...getBaseCookieOptions(),
    maxAge: jwtTtlSeconds * 1000,        // maxAge is in milliseconds, but jwtTtlSeconds is in seconds, so we multiply by 1000 to convert to milliseconds
  });
}

export function clearAuthCookie(response: Response): void {
  response.clearCookie(
    AUTH_COOKIE_NAME,
    getBaseCookieOptions(),    // logout clears cookie using the same options as when it was set, so that the browser knows which cookie to clear
  );
}