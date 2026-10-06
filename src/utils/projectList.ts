import type { CollectionEntry } from 'astro:content';

export function getProjectsByLang(
  entries: CollectionEntry<'projects'>[],
  lang: 'en' | 'pt',
): CollectionEntry<'projects'>[] {
  return entries
    .filter((entry) => entry.data.lang === lang)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function getAdjacentProjects(
  entries: CollectionEntry<'projects'>[],
  lang: 'en' | 'pt',
  currentId: string,
): { prev: CollectionEntry<'projects'> | null; next: CollectionEntry<'projects'> | null } {
  const sorted = getProjectsByLang(entries, lang);
  const index = sorted.findIndex((entry) => entry.id === currentId);
  return {
    prev: index > 0 ? sorted[index - 1] : null,
    next: index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null,
  };
}

export function projectHref(entry: CollectionEntry<'projects'>): string {
  const base = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '');
  const prefix = base ? `${base}/` : '/';
  return entry.data.lang === 'pt' ? `${prefix}pt/projects/${entry.id}/` : `${prefix}projects/${entry.id}/`;
}

export function resolveAltLocaleHref(
  current: CollectionEntry<'projects'>,
  allEntries: CollectionEntry<'projects'>[],
): { pt: string; en: string } {
  const siblings = allEntries.filter(
    (entry) =>
      entry.data.translationKey === current.data.translationKey && entry.data.lang !== current.data.lang,
  );
  if (siblings.length > 1) {
    throw new Error(
      `translationKey "${current.data.translationKey}" matches more than one entry with a different language — translationKey must be unique per language.`,
    );
  }
  const sibling = siblings[0] ?? null;
  const selfHref = projectHref(current);
  const siblingHref = sibling ? projectHref(sibling) : null;

  return {
    pt: current.data.lang === 'pt' ? selfHref : (siblingHref ?? '/pt/'),
    en: current.data.lang === 'en' ? selfHref : (siblingHref ?? '/'),
  };
}
