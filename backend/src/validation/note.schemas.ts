import { z } from "zod";

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required.")
  .max(120, "Title must not exceed 120 characters.");

const contentSchema = z
  .string()
  .max(
    100_000,
    "Note content must not exceed 100000 characters.",
  );

export const createNoteSchema = z
  .object({
    title: titleSchema,
    content: contentSchema.default(""),
  })
  .strict();

export const updateNoteSchema = z
  .object({
    title: titleSchema.optional(),
    content: contentSchema.optional(),
  })
  .strict()
  .refine(
    ({ title, content }) =>
      title !== undefined || content !== undefined,
    {
      message: "Provide at least one field to update.",
    },
  );

export type CreateNoteInput = z.infer<
  typeof createNoteSchema
>;
export type UpdateNoteInput = z.infer<
  typeof updateNoteSchema
>;
