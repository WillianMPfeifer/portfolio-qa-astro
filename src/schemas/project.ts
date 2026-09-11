import { z } from 'astro/zod';

export const projectSchema = z.object({
  title: z.string(),
  role: z.string(),
  period: z.string(),
  date: z.coerce.date(),
  stack: z.array(z.string()),
  problem: z.string(),
  outcome: z.string(),
  featured: z.boolean(),
  lang: z.enum(['pt', 'en']),
  translationKey: z.string(),
  url: z.string().url().optional(),
  repo: z.string().url().optional(),
});

export type Project = z.infer<typeof projectSchema>;
