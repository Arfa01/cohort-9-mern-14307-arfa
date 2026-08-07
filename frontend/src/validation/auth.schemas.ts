
import { z } from 'zod'

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .max(254, 'Email must not exceed 254 characters.')
  .pipe(z.email({ error: 'Enter a valid email address.' }))

const bcryptCompatiblePassword = (message: string) =>
  z
    .string()
    .max(128, 'Password is too long.')
    .refine(
      (password) => new TextEncoder().encode(password).length <= 72,
      message,
    )

export const loginSchema = z.object({
  email: emailSchema,
  password: bcryptCompatiblePassword(
    'Password must not exceed 72 UTF-8 bytes.',
  ).min(1, 'Password is required.'),
})

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must contain at least 2 characters.')
      .max(80, 'Name must not exceed 80 characters.'),
    email: emailSchema,
    password: bcryptCompatiblePassword(
      'Password must not exceed 72 UTF-8 bytes.',
    ).min(8, 'Password must contain at least 8 characters.'),
    confirmPassword: bcryptCompatiblePassword(
      'Password must not exceed 72 UTF-8 bytes.',
    ).min(8, 'Password must contain at least 8 characters.'),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export type LoginFormInput = z.input<typeof loginSchema>
export type LoginFormValues = z.output<typeof loginSchema>
export type RegisterFormValues = z.input<typeof registerSchema>
