import { describe, expect, it } from 'vitest';
import { getNotesByLang } from './notesList';
import type { CollectionEntry } from 'astro:content';

function makeEntry(id: string, overrides: Partial<CollectionEntry<'notes'>['data']>): CollectionEntry<'notes'> {
  return {
    id,
    collection: 'notes',
    data: {
      title: 'Placeholder',
      description: 'Placeholder description.',
      date: new Date('2025-01-01'),
      lang: 'en',
      ...overrides,
    },
  } as CollectionEntry<'notes'>;
}

describe('getNotesByLang', () => {
  it('returns only entries matching the requested language', () => {
    const en = makeEntry('a', { lang: 'en' });
    const pt = makeEntry('b', { lang: 'pt' });
    expect(getNotesByLang([en, pt], 'en')).toEqual([en]);
  });

  it('sorts matching entries by date, most recent first', () => {
    const older = makeEntry('old', { date: new Date('2025-01-01') });
    const newer = makeEntry('new', { date: new Date('2025-06-01') });
    const result = getNotesByLang([older, newer], 'en');
    expect(result.map((entry) => entry.id)).toEqual(['new', 'old']);
  });

  it('returns an empty array when there are no entries for the language', () => {
    expect(getNotesByLang([], 'en')).toEqual([]);
  });
});
