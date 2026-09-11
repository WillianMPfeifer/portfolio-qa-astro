import { defineCollection } from 'astro:content';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { glob } from 'astro/loaders';
import { noteSchema } from './schemas/note';
import { projectSchema } from './schemas/project';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
  projects: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
    schema: projectSchema,
  }),
  notes: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
    schema: noteSchema,
  }),
};
