import { z } from "zod";
// Zod checks untrusted JSON before it reaches business logic

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254, "Email must not exceed 254 characters.")
  .transform((email) => email.toLowerCase());

const registrationPasswordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters.")
  .max(128, "Password is too long.")
  .refine(
    (password) =>
      Buffer.byteLength(password, "utf8") <= 72,
    "Password must not exceed 72 UTF-8 bytes.",
  );

const loginPasswordSchema = z
  .string()
  .min(1, "Password is required.")
  .max(128, "Password is too long.")
  .refine(
    (password) =>
      Buffer.byteLength(password, "utf8") <= 72,
    "Password must not exceed 72 UTF-8 bytes.",
  );

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters.")
      .max(80, "Name must not exceed 80 characters."),
    email: emailSchema,
    password: registrationPasswordSchema,
    confirmPassword: registrationPasswordSchema,
  })
  .strict() // rejects any extra/unexpected fields that are not specified in the schema
  .refine(
    ({ password, confirmPassword }) =>
      password === confirmPassword,
    {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    },
  );

export const loginSchema = z
  .object({
    email: emailSchema,
    password: loginPasswordSchema,
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;