import { describe, expect, it } from 'vitest';
import { getAdjacentProjects, getProjectsByLang, resolveAltLocaleHref } from './projectList';
import type { CollectionEntry } from 'astro:content';

function makeEntry(
  id: string,
  overrides: Partial<CollectionEntry<'projects'>['data']>,
): CollectionEntry<'projects'> {
  return {
    id,
    collection: 'projects',
    data: {
      title: 'Placeholder',
      role: 'QA Tester',
      period: '2025',
      date: new Date('2025-01-01'),
      stack: [],
      problem: '',
      outcome: '',
      featured: false,
      lang: 'en',
      translationKey: id,
      ...overrides,
    },
  } as CollectionEntry<'projects'>;
}

describe('getProjectsByLang', () => {
  it('returns only entries matching the requested language', () => {
    const en = makeEntry('a', { lang: 'en' });
    const pt = makeEntry('b', { lang: 'pt' });
    expect(getProjectsByLang([en, pt], 'en')).toEqual([en]);
  });

  it('sorts matching entries by date, most recent first', () => {
    const older = makeEntry('old', { date: new Date('2025-01-01') });
    const newer = makeEntry('new', { date: new Date('2025-06-01') });
    const result = getProjectsByLang([older, newer], 'en');
    expect(result.map((entry) => entry.id)).toEqual(['new', 'old']);
  });
});

describe('getAdjacentProjects', () => {
  const a = makeEntry('a', { date: new Date('2025-06-01') });
  const b = makeEntry('b', { date: new Date('2025-03-01') });
  const entries = [a, b];

  it('returns null prev and the older entry as next for the most recent entry', () => {
    const result = getAdjacentProjects(entries, 'en', 'a');
    expect(result.prev).toBeNull();
    expect(result.next?.id).toBe('b');
  });

  it('returns the more recent entry as prev and null next for the oldest entry', () => {
    const result = getAdjacentProjects(entries, 'en', 'b');
    expect(result.prev?.id).toBe('a');
    expect(result.next).toBeNull();
  });

  it('returns null for both when there is only one entry', () => {
    const result = getAdjacentProjects([a], 'en', 'a');
    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
  });

  it('returns null for both when the current id is not found in the list', () => {
    const result = getAdjacentProjects(entries, 'en', 'does-not-exist');
    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
  });
});

describe('resolveAltLocaleHref', () => {
  it('links the current language to itself and the other language to the sibling translation', () => {
    const en = makeEntry('cypress-en', { lang: 'en', translationKey: 'cypress' });
    const pt = makeEntry('cypress-pt', { lang: 'pt', translationKey: 'cypress' });
    const result = resolveAltLocaleHref(en, [en, pt]);
    expect(result.en).toBe('/projects/cypress-en/');
    expect(result.pt).toBe('/pt/projects/cypress-pt/');
  });

  it('falls back to the target language home page when no translation exists', () => {
    const en = makeEntry('solo-en', { lang: 'en', translationKey: 'solo' });
    const result = resolveAltLocaleHref(en, [en]);
    expect(result.en).toBe('/projects/solo-en/');
    expect(result.pt).toBe('/pt/');
  });

  it('works starting from the pt entry too', () => {
    const en = makeEntry('cypress-en', { lang: 'en', translationKey: 'cypress' });
    const pt = makeEntry('cypress-pt', { lang: 'pt', translationKey: 'cypress' });
    const result = resolveAltLocaleHref(pt, [en, pt]);
    expect(result.pt).toBe('/pt/projects/cypress-pt/');
    expect(result.en).toBe('/projects/cypress-en/');
  });

  it('throws when translationKey matches more than one entry in the other language', () => {
    const en = makeEntry('cypress-en', { lang: 'en', translationKey: 'cypress' });
    const ptA = makeEntry('cypress-pt-a', { lang: 'pt', translationKey: 'cypress' });
    const ptB = makeEntry('cypress-pt-b', { lang: 'pt', translationKey: 'cypress' });
    expect(() => resolveAltLocaleHref(en, [en, ptA, ptB])).toThrow();
  });
});
