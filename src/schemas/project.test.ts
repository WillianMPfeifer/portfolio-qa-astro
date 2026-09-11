import { describe, expect, it } from 'vitest';
import { projectSchema } from './project';

describe('projectSchema', () => {
  const validProject = {
    title: 'Automação E2E mobile',
    role: 'QA Engineer',
    period: '2023–2024',
    date: new Date('2024-01-15'),
    stack: ['Appium', 'Python', 'BDD'],
    problem: 'Suite instável, muitos falsos negativos.',
    outcome: 'Taxa de flakiness caiu de 30% para 2%.',
    featured: true,
    lang: 'pt' as const,
    translationKey: 'flakiness-mobile-appium',
  };

  it('accepts a project with all required fields and no optional links', () => {
    const result = projectSchema.safeParse(validProject);
    expect(result.success).toBe(true);
  });

  it('accepts optional url and repo when present', () => {
    const result = projectSchema.safeParse({
      ...validProject,
      url: 'https://example.com',
      repo: 'https://github.com/example/repo',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a project missing a required field', () => {
    const { outcome, ...missingOutcome } = validProject;
    const result = projectSchema.safeParse(missingOutcome);
    expect(result.success).toBe(false);
  });

  it('rejects an invalid lang value', () => {
    const result = projectSchema.safeParse({ ...validProject, lang: 'fr' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-URL string in url', () => {
    const result = projectSchema.safeParse({ ...validProject, url: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects a project missing translationKey', () => {
    const { translationKey, ...missingTranslationKey } = validProject;
    const result = projectSchema.safeParse(missingTranslationKey);
    expect(result.success).toBe(false);
  });

  it('rejects a project missing date', () => {
    const { date, ...missingDate } = validProject;
    const result = projectSchema.safeParse(missingDate);
    expect(result.success).toBe(false);
  });
});
