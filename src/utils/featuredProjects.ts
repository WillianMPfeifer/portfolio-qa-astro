import type { CollectionEntry } from 'astro:content';

export function selectFeaturedProjects(
  entries: CollectionEntry<'projects'>[],
  lang: 'en' | 'pt',
): CollectionEntry<'projects'>[] {
  return entries
    .filter((entry) => entry.data.featured && entry.data.lang === lang)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
