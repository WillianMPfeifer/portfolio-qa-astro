import type { CollectionEntry } from 'astro:content';

export function getNotesByLang(
  entries: CollectionEntry<'notes'>[],
  lang: 'en' | 'pt',
): CollectionEntry<'notes'>[] {
  return entries
    .filter((entry) => entry.data.lang === lang)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
