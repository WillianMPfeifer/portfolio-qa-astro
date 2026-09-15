import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getDirectorySizeBytes } from './dirSize.ts';

export interface ScenarioFeatureSummary {
  feature: string;
  passed: number;
  total: number;
}

export interface PlaywrightSummary {
  scenarios: ScenarioFeatureSummary[];
  passed: number;
  total: number;
}

export interface A11ySummary {
  routesChecked: number;
  violations: number;
}

export interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export interface QualityReport {
  generatedAt: string | null;
  runUrl: string | null;
  commitSha: string | null;
  playwright: PlaywrightSummary | null;
  a11y: A11ySummary | null;
  lighthouse: LighthouseScores | null;
  bundleSizeBytes: number | null;
}

interface PWTestResult {
  status: string;
}
interface PWTest {
  results: PWTestResult[];
}
interface PWSpec {
  file: string;
  tests: PWTest[];
}
interface PWSuite {
  specs?: PWSpec[];
  suites?: PWSuite[];
}
export interface PlaywrightJsonReport {
  suites: PWSuite[];
}

function collectSpecs(suite: PWSuite): PWSpec[] {
  const own = suite.specs ?? [];
  const nested = (suite.suites ?? []).flatMap(collectSpecs);
  return [...own, ...nested];
}

function featureNameFromFile(file: string): string {
  const base = file.split(/[\\/]/).pop() ?? file;
  return base.replace(/\.feature\.spec\.[jt]s$/, '').replace(/\.spec\.[jt]s$/, '');
}

export function flattenPlaywrightReport(raw: PlaywrightJsonReport): PlaywrightSummary {
  const specs = raw.suites.flatMap(collectSpecs);
  const byFeature = new Map<string, { passed: number; total: number }>();

  for (const spec of specs) {
    const feature = featureNameFromFile(spec.file);
    const specPassed = spec.tests.some((t) => t.results.some((r) => r.status === 'passed'));
    const entry = byFeature.get(feature) ?? { passed: 0, total: 0 };
    entry.total += 1;
    if (specPassed) entry.passed += 1;
    byFeature.set(feature, entry);
  }

  const scenarios = Array.from(byFeature.entries()).map(([feature, counts]) => ({
    feature,
    passed: counts.passed,
    total: counts.total,
  }));

  return {
    scenarios,
    passed: scenarios.reduce((sum, s) => sum + s.passed, 0),
    total: scenarios.reduce((sum, s) => sum + s.total, 0),
  };
}

export function averageLighthouseScores(entries: LighthouseScores[]): LighthouseScores | null {
  if (entries.length === 0) return null;

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const avg = (key: keyof LighthouseScores) => round2(entries.reduce((sum, e) => sum + e[key], 0) / entries.length);

  return {
    performance: avg('performance'),
    accessibility: avg('accessibility'),
    bestPractices: avg('bestPractices'),
    seo: avg('seo'),
  };
}

export interface BuildQualityReportInputs {
  generatedAt: string;
  runUrl: string | null;
  commitSha: string | null;
  playwrightReport: PlaywrightSummary | null;
  a11ySummary: A11ySummary | null;
  lighthouseScores: LighthouseScores | null;
  bundleSizeBytes: number | null;
}

export function buildQualityReport(inputs: BuildQualityReportInputs): QualityReport {
  return {
    generatedAt: inputs.generatedAt,
    runUrl: inputs.runUrl,
    commitSha: inputs.commitSha,
    playwright: inputs.playwrightReport,
    a11y: inputs.a11ySummary,
    lighthouse: inputs.lighthouseScores,
    bundleSizeBytes: inputs.bundleSizeBytes,
  };
}

function readJsonIfExists<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return null;
  }
}

interface LighthouseManifestEntry {
  isRepresentativeRun: boolean;
  summary: Record<string, number>;
}

function readLighthouseScores(manifestPath: string): LighthouseScores | null {
  const manifest = readJsonIfExists<LighthouseManifestEntry[]>(manifestPath);
  if (!manifest) return null;

  const representative = manifest.filter((entry) => entry.isRepresentativeRun);
  if (representative.length === 0) return null;

  const scores = representative.map((entry) => ({
    performance: entry.summary.performance,
    accessibility: entry.summary.accessibility,
    bestPractices: entry.summary['best-practices'],
    seo: entry.summary.seo,
  }));

  return averageLighthouseScores(scores);
}

function main(): void {
  const playwrightRaw = readJsonIfExists<PlaywrightJsonReport>(path.join('test-results', 'playwright-report.json'));
  const playwrightSummary = playwrightRaw ? flattenPlaywrightReport(playwrightRaw) : null;

  const a11ySummary = readJsonIfExists<A11ySummary>(path.join('test-results', 'a11y-summary.json'));

  const lighthouseScores = readLighthouseScores(path.join('.lighthouseci', 'manifest.json'));

  const bundleSizeBytes = fs.existsSync('dist') ? getDirectorySizeBytes('dist') : null;

  const runId = process.env.GITHUB_RUN_ID;
  const serverUrl = process.env.GITHUB_SERVER_URL;
  const repository = process.env.GITHUB_REPOSITORY;
  const runUrl = runId && serverUrl && repository ? `${serverUrl}/${repository}/actions/runs/${runId}` : null;

  const report = buildQualityReport({
    generatedAt: new Date().toISOString(),
    runUrl,
    commitSha: process.env.GITHUB_SHA ?? null,
    playwrightReport: playwrightSummary,
    a11ySummary,
    lighthouseScores,
    bundleSizeBytes,
  });

  fs.mkdirSync(path.join('src', 'data'), { recursive: true });
  fs.writeFileSync(path.join('src', 'data', 'quality.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('Wrote src/data/quality.json:', JSON.stringify(report, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
