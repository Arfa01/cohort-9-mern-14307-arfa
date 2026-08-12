// http input -> service call -> http output. this is where we handle http req/res. no business logic here, just input validation and calling the service layer to do the actual work.

import type { RequestHandler } from "express";

import {
  getUserById,
  loginUser,
  registerUser,
} from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";
import {
  clearAuthCookie,
  setAuthCookie,
} from "../utils/auth-cookie.js";
import { createAuthToken } from "../utils/jwt.js";
import {
  loginSchema,
  registerSchema,
} from "../validation/auth.schemas.js";

function createValidationError(
  issues: ReadonlyArray<{
    path: ReadonlyArray<PropertyKey>;
    message: string;
  }>,
): AppError {
  return new AppError(
    400,
    "VALIDATION_ERROR",
    "The submitted data is invalid.",
    {
      details: issues.map((issue) => ({
        field:
          issue.path.length === 0
            ? "body"
            : issue.path.map(String).join("."),
        message: issue.message,
      })),
    },
  );
}

export const registerHandler: RequestHandler = async (    // express (requesthandler) automatically forwards rejected async handlers to the global error middleware.
  request,
  response,
): Promise<void> => {
  const result = registerSchema.safeParse(request.body);

  if (!result.success) {
    throw createValidationError(result.error.issues);
  }

  const user = await registerUser(result.data);
  const token = createAuthToken(user.id);

  setAuthCookie(response, token);

  request.log.info(
    { userId: user.id },
    "User registered",
  );

  response.status(201).json({
    success: true,
    data: {
      user,
    },
  });
};

export const loginHandler: RequestHandler = async (
  request,
  response,
): Promise<void> => {
  const result = loginSchema.safeParse(request.body);  // safeParse validated the body's structure/type (having email and pass) without throwing raw Zod error.

  if (!result.success) {
    throw createValidationError(result.error.issues);
  }

  const user = await loginUser(result.data);
  const token = createAuthToken(user.id);

  setAuthCookie(response, token);

  request.log.info(
    { userId: user.id },
    "User logged in", // controller logs just the userID, no other credential.
  );

  response.status(200).json({
    success: true,
    data: {
      user,       
    },
  });
};

export const getCurrentUserHandler: RequestHandler = async (
  request,
  response,
): Promise<void> => {
  const userId = request.auth?.userId;

  if (userId === undefined) {
    throw new AppError(
      401,
      "UNAUTHENTICATED",
      "Authentication is required.",
    );
  }

  const user = await getUserById(userId);

  response.status(200).json({
    success: true,
    data: {
      user,
    },
  });
};

export const logoutHandler: RequestHandler = (
  request,
  response,
): void => {
  clearAuthCookie(response);

  request.log.info("User logged out");

  response.status(200).json({
    success: true,
    data: {
      message: "Logged out successfully.",
    },
  });
};
