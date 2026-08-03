// business logic and database access. nothing about http req/res here

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import {
  UserModel,
  type UserDocument,
} from "../models/user.model.js";
import { AppError } from "../utils/app-error.js";
import type {
  LoginInput,
  RegisterInput,
} from "../validation/auth.schemas.js";

const PASSWORD_HASH_ROUNDS = 12;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

function toPublicUser(user: UserDocument): PublicUser {  // this function converts a UserDocument (which includes sensitive information like passwordHash) into a PublicUser object that can be safely returned to the client without exposing sensitive data.
  return {                                               // a user in mongodb is never serialized directly. this function i the only object sent outside the service. 
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

function isDuplicateKeyError(error: unknown): boolean {    // this function checks if the error is a duplicate key error, which occurs when trying to create a user with an email that already exists in the database.
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error)                  // 11000 also means duplicate key error in mongodb.
  ) {
    return false;
  }

  return (error as { code?: unknown }).code === 11000;
}

function invalidCredentialsError(): AppError {
  return new AppError(
    401,
    "INVALID_CREDENTIALS",
    "Invalid email or password.",
  );
}

export async function registerUser({
  name,
  email,
  password,
}: RegisterInput): Promise<PublicUser> {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await UserModel.exists({
    email: normalizedEmail,
  });

  if (existingUser !== null) {
    throw new AppError(
      409,
      "EMAIL_ALREADY_REGISTERED",
      "An account with this email already exists.",
    );
  }

  const passwordHash = await bcrypt.hash(
    password,
    PASSWORD_HASH_ROUNDS,
  );

  try {
    const user = await UserModel.create({
      name,
      email: normalizedEmail,
      passwordHash,
    });

    return toPublicUser(user);
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(
        409,
        "EMAIL_ALREADY_REGISTERED",
        "An account with this email already exists.",
        { cause: error },
      );
    }

    throw error;
  }
}

export async function loginUser({
  email,
  password,
}: LoginInput): Promise<PublicUser> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await UserModel.findOne({
    email: normalizedEmail,
  })
    .select("+passwordHash")
    .exec();
   
  if (user === null) {     // deleted acc
    throw invalidCredentialsError();
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw invalidCredentialsError();
  }

  return toPublicUser(user);
}

export async function getUserById(
  userId: string,
): Promise<PublicUser> {
  if (!mongoose.isObjectIdOrHexString(userId)) {
    throw new AppError(
      401,
      "UNAUTHENTICATED",
      "Authentication is required.",
    );
  }

  const user = await UserModel.findById(userId).exec();

  if (user === null) {
    throw new AppError(
      401,
      "UNAUTHENTICATED",
      "Authentication is required.",
    );
  }

  return toPublicUser(user);
}

