import { z } from 'zod'

export const noteFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(120, 'Title must not exceed 120 characters.'),
  content: z
    .string()
    .max(100_000, 'Note content must not exceed 100000 characters.'),
})

export type NoteFormValues = z.infer<typeof noteFormSchema>
