import { describe, expect, it } from 'vitest';
import { buildQualityReport, flattenPlaywrightReport, averageLighthouseScores } from './build-quality-report';

describe('flattenPlaywrightReport', () => {
  it('groups specs by feature file and counts passed vs total', () => {
    const raw = {
      suites: [
        {
          suites: [
            {
              specs: [
                { file: '.features-gen/tests/features/site-health.feature.spec.js', tests: [{ results: [{ status: 'passed' }] }] },
                { file: '.features-gen/tests/features/site-health.feature.spec.js', tests: [{ results: [{ status: 'failed' }] }] },
              ],
            },
          ],
        },
        {
          specs: [
            { file: 'tests/a11y.spec.ts', tests: [{ results: [{ status: 'passed' }] }] },
          ],
        },
      ],
    };

    const result = flattenPlaywrightReport(raw);

    expect(result.scenarios).toEqual(
      expect.arrayContaining([
        { feature: 'site-health', passed: 1, total: 2 },
        { feature: 'a11y', passed: 1, total: 1 },
      ]),
    );
    expect(result.passed).toBe(2);
    expect(result.total).toBe(3);
  });

  it('returns an empty summary for no suites', () => {
    expect(flattenPlaywrightReport({ suites: [] })).toEqual({ scenarios: [], passed: 0, total: 0 });
  });
});

describe('averageLighthouseScores', () => {
  it('averages scores across multiple entries, rounded to 2 decimals', () => {
    const result = averageLighthouseScores([
      { performance: 0.9, accessibility: 1, bestPractices: 0.95, seo: 1 },
      { performance: 0.8, accessibility: 0.9, bestPractices: 0.85, seo: 0.9 },
    ]);

    expect(result).toEqual({ performance: 0.85, accessibility: 0.95, bestPractices: 0.9, seo: 0.95 });
  });

  it('returns null for an empty list', () => {
    expect(averageLighthouseScores([])).toBeNull();
  });
});

describe('buildQualityReport', () => {
  it('carries every field through when all inputs are present', () => {
    const report = buildQualityReport({
      generatedAt: '2026-09-14T12:00:00.000Z',
      runUrl: 'https://github.com/example/repo/actions/runs/123',
      commitSha: 'abc1234',
      playwrightReport: { scenarios: [{ feature: 'site-health', passed: 2, total: 2 }], passed: 2, total: 2 },
      a11ySummary: { routesChecked: 8, violations: 0 },
      lighthouseScores: { performance: 0.95, accessibility: 1, bestPractices: 0.9, seo: 1 },
      bundleSizeBytes: 204800,
    });

    expect(report).toEqual({
      generatedAt: '2026-09-14T12:00:00.000Z',
      runUrl: 'https://github.com/example/repo/actions/runs/123',
      commitSha: 'abc1234',
      playwright: { scenarios: [{ feature: 'site-health', passed: 2, total: 2 }], passed: 2, total: 2 },
      a11y: { routesChecked: 8, violations: 0 },
      lighthouse: { performance: 0.95, accessibility: 1, bestPractices: 0.9, seo: 1 },
      bundleSizeBytes: 204800,
    });
  });

  it('turns every missing input into an explicit null, never omitting the key', () => {
    const report = buildQualityReport({
      generatedAt: '2026-09-14T12:00:00.000Z',
      runUrl: null,
      commitSha: null,
      playwrightReport: null,
      a11ySummary: null,
      lighthouseScores: null,
      bundleSizeBytes: null,
    });

    expect(Object.keys(report).sort()).toEqual(
      ['a11y', 'bundleSizeBytes', 'commitSha', 'generatedAt', 'lighthouse', 'playwright', 'runUrl'].sort(),
    );
    expect(report.playwright).toBeNull();
    expect(report.a11y).toBeNull();
    expect(report.lighthouse).toBeNull();
    expect(report.bundleSizeBytes).toBeNull();
    expect(report.runUrl).toBeNull();
    expect(report.commitSha).toBeNull();
  });
});
