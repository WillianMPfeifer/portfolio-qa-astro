import { describe, expect, it } from 'vitest';
import { home } from './home';

describe('home content', () => {
  const locales = ['en', 'pt'] as const;

  it.each(locales)('has no empty text for locale "%s"', (locale) => {
    const empty: string[] = [];
    const walk = (value: unknown, path: string) => {
      if (typeof value === 'string') {
        if (value.trim().length === 0) empty.push(path);
      } else if (Array.isArray(value)) {
        value.forEach((item, i) => walk(item, `${path}[${i}]`));
      } else if (value && typeof value === 'object') {
        Object.entries(value).forEach(([key, item]) => walk(item, `${path}.${key}`));
      }
    };
    walk(home[locale], locale);
    expect(empty).toEqual([]);
  });

  it('keeps the same number of items in pt and en for every list', () => {
    const { pt, en } = home;
    expect(pt.proof.items).toHaveLength(en.proof.items.length);
    expect(pt.incident.steps).toHaveLength(en.incident.steps.length);
    expect(pt.incident.table.rows).toHaveLength(en.incident.table.rows.length);
    expect(pt.beyond.items).toHaveLength(en.beyond.items.length);
    expect(pt.journey.items).toHaveLength(en.journey.items.length);
    expect(pt.tools.groups).toHaveLength(en.tools.groups.length);
    expect(pt.tools.certs).toHaveLength(en.tools.certs.length);
  });

  it.each(locales)('fills every number of the quality line for locale "%s"', (locale) => {
    const line = home[locale].contact.qualityLine({
      passed: 5,
      total: 5,
      violations: 0,
      routes: 13,
      performance: '98',
    });
    expect(line).toContain('5');
    expect(line).toContain('13');
    expect(line).toContain('98');
    expect(line).not.toMatch(/undefined|NaN/);
  });
});
