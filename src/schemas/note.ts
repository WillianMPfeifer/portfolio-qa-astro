import { z } from 'astro/zod';

export const noteSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  lang: z.enum(['pt', 'en']),
});

export type Note = z.infer<typeof noteSchema>;
