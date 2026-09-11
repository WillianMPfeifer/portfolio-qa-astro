import { describe, expect, it } from 'vitest';
import { noteSchema } from './note';

describe('noteSchema', () => {
  const validNote = {
    title: 'Aprendendo violão',
    description: 'Primeiras semanas praticando escalas.',
    date: '2026-01-10',
    lang: 'pt' as const,
  };

  it('accepts a note with all required fields', () => {
    const result = noteSchema.safeParse(validNote);
    expect(result.success).toBe(true);
  });

  it('coerces a date string into a Date instance', () => {
    const result = noteSchema.parse(validNote);
    expect(result.date).toBeInstanceOf(Date);
  });

  it('rejects a note missing a required field', () => {
    const { description, ...missingDescription } = validNote;
    const result = noteSchema.safeParse(missingDescription);
    expect(result.success).toBe(false);
  });

  it('rejects an invalid lang value', () => {
    const result = noteSchema.safeParse({ ...validNote, lang: 'fr' });
    expect(result.success).toBe(false);
  });
});
