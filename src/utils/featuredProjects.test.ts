import { describe, expect, it } from 'vitest';
import { selectFeaturedProjects } from './featuredProjects';
import type { CollectionEntry } from 'astro:content';

function makeEntry(overrides: Partial<CollectionEntry<'projects'>['data']>): CollectionEntry<'projects'> {
  return {
    id: overrides.translationKey ?? 'placeholder',
    collection: 'projects',
    data: {
      title: 'Placeholder',
      role: 'QA Engineer',
      period: '2024',
      date: new Date('2024-01-01'),
      stack: [],
      problem: '',
      outcome: '',
      featured: true,
      lang: 'en',
      translationKey: 'placeholder',
      ...overrides,
    },
  } as unknown as CollectionEntry<'projects'>;
}

describe('selectFeaturedProjects', () => {
  it('returns an empty array when there are no entries', () => {
    expect(selectFeaturedProjects([], 'en')).toEqual([]);
  });

  it('excludes entries where featured is false', () => {
    const entries = [makeEntry({ translationKey: 'a', featured: false })];
    expect(selectFeaturedProjects(entries, 'en')).toEqual([]);
  });

  it('excludes entries in a different language', () => {
    const entries = [makeEntry({ translationKey: 'a', lang: 'pt' })];
    expect(selectFeaturedProjects(entries, 'en')).toEqual([]);
  });

  it('includes only featured entries matching the requested language', () => {
    const match = makeEntry({ translationKey: 'a', featured: true, lang: 'en' });
    const wrongLang = makeEntry({ translationKey: 'b', featured: true, lang: 'pt' });
    const notFeatured = makeEntry({ translationKey: 'c', featured: false, lang: 'en' });
    const result = selectFeaturedProjects([match, wrongLang, notFeatured], 'en');
    expect(result).toEqual([match]);
  });

  it('sorts matching entries by date, most recent first', () => {
    const older = makeEntry({ translationKey: 'old', date: new Date('2023-01-01') });
    const newer = makeEntry({ translationKey: 'new', date: new Date('2024-06-01') });
    const result = selectFeaturedProjects([older, newer], 'en');
    expect(result.map((entry) => entry.id)).toEqual(['new', 'old']);
  });
});
