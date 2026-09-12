import { describe, expect, it } from 'vitest';
import { hero } from './hero';

describe('hero content', () => {
  const locales = ['en', 'pt'] as const;

  it.each(locales)('has every required field non-empty for locale "%s"', (locale) => {
    const content = hero[locale];
    expect(content.scenarioTitle.trim().length).toBeGreaterThan(0);
    expect(content.given.trim().length).toBeGreaterThan(0);
    expect(content.when.trim().length).toBeGreaterThan(0);
    expect(content.then.trim().length).toBeGreaterThan(0);
    expect(content.prose.trim().length).toBeGreaterThan(0);
  });

  it('closes the English scenario with the exact agreed punchline', () => {
    expect(hero.en.then).toBe('that guy is me');
  });

  it('closes the Portuguese scenario with the exact agreed punchline', () => {
    expect(hero.pt.then).toBe('esse cara sou eu');
  });
});
