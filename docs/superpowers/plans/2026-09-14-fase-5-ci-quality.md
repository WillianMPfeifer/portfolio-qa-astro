# Fase 5 — CI e /quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GitHub Actions CI workflow that runs the full test suite plus Lighthouse CI, and a `/quality` page that renders real numbers from the last run — never a hardcoded or stale value.

**Architecture:** Each CI stage (Playwright, axe, Lighthouse, bundle size) writes a real artifact to disk. `scripts/build-quality-report.ts` reads whatever artifacts exist — treating a missing one as `null`, never inventing a value — and writes `src/data/quality.json`. `src/pages/quality.astro` (and its `/pt/` mirror) import that JSON at build time and render it; a `null` field renders as "indisponível" (or "unavailable"). Because the site isn't deployed anywhere yet, the CI workflow commits the freshly generated `quality.json` back to `master` after a successful push-triggered run, so the *next* build (local or a future deploy) already has real data.

**Tech Stack:** GitHub Actions, `@lhci/cli` (Lighthouse CI), Node 24's built-in TypeScript execution (no `tsx`/`ts-node` needed — verified empirically, see Task 4), Vitest for the report-building logic, the existing Playwright/playwright-bdd/axe suite from Fase 4.

## Global Constraints

- Nothing in `/quality` may be hardcoded or invented (spec §3). A stage that didn't run, or an artifact that doesn't exist, becomes `null` in `quality.json` and renders as "indisponível" — never a placeholder number, never silently omitted from the JSON shape.
- a11y stays zero-tolerance: `tests/a11y.spec.ts` still fails the build on any violation (unchanged from Fase 4). It gains an artifact write for reporting, not a behavior change.
- Lighthouse thresholds: Performance / Accessibility / Best Practices / SEO ≥ 0.9 each, checked against `dist/index.html` and `dist/pt/index.html`, via `assert.assertions` (a failure fails the CI job).
- Bundle size = total bytes of everything under `dist/` (all file types), not just `dist/_astro`.
- CI trigger: `push` to `master` and `pull_request` — but the "commit `quality.json` back" step runs **only** when the event is a push to `master`, never on a PR.
- The workflow must not let a failed step silently skip `build-quality-report.ts` or the commit-back step — both run with `if: always()`, and a final gate step re-fails the job if anything upstream failed. See Task 6 for the exact mechanism.
- Playwright/axe are unchanged in behavior from Fase 4 — this phase only adds artifact output, not new scenarios.

---

## File Structure

```
.github/workflows/ci.yml                # the CI workflow (Task 6)
lighthouserc.json                       # root, Lighthouse CI config (Task 2)
.gitignore                              # modified: .lighthouseci/ (Task 2)
package.json                            # modified: @lhci/cli devDependency (Task 2)
playwright.config.ts                    # modified: JSON reporter (Task 1)
tests/
  a11y.spec.ts                          # modified: writes a11y-summary.json (Task 1)
scripts/
  dirSize.ts                            # getDirectorySizeBytes(dirPath) (Task 3)
  dirSize.test.ts
  build-quality-report.ts               # types, pure buildQualityReport(), wrapper main() (Task 4)
  build-quality-report.test.ts
src/
  data/
    quality.json                        # initial, all-null (Task 4)
  utils/
    formatQuality.ts                    # formatBundleSize, formatDate, formatLighthouseScore (Task 5)
    formatQuality.test.ts
  pages/
    quality.astro                       # (Task 5)
    pt/
      quality.astro                     # (Task 5)
```

---

### Task 1: Playwright JSON reporter + a11y summary artifact

**Files:**
- Modify: `playwright.config.ts`
- Modify: `tests/a11y.spec.ts`

**Interfaces:**
- Produces: two artifact files on disk after a `npm run test:e2e` run — `test-results/playwright-report.json` (Playwright's built-in JSON reporter output) and `test-results/a11y-summary.json` (`{ routesChecked: number, violations: number }`, only written if the a11y test passed). Task 4's wrapper reads both by these exact paths.

- [ ] **Step 1: Add the JSON reporter to `playwright.config.ts`**

Current file:

```ts
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const bddTestDir = defineBddConfig({
  features: 'tests/features/**/*.feature',
  steps: 'tests/steps/**/*.steps.ts',
});

export default defineConfig({
  fullyParallel: false,
  // one worker at a time — site-health.feature and a11y.spec.ts each independently crawl the whole site;
  // running them concurrently just duplicates the crawl against the same preview server for no speed benefit on a site this small
  workers: 1,
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:4321',
  },
  projects: [
    { name: 'bdd', testDir: bddTestDir, use: { ...devices['Desktop Chrome'] } },
    { name: 'plain', testDir: 'tests', testMatch: '**/*.spec.ts', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

Add a `reporter` option (only new lines shown in context below — add this one entry to the existing `defineConfig({...})` object, right after `workers: 1,`):

```ts
  reporter: [['list'], ['json', { outputFile: 'test-results/playwright-report.json' }]],
```

Full file after the edit:

```ts
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const bddTestDir = defineBddConfig({
  features: 'tests/features/**/*.feature',
  steps: 'tests/steps/**/*.steps.ts',
});

export default defineConfig({
  fullyParallel: false,
  // one worker at a time — site-health.feature and a11y.spec.ts each independently crawl the whole site;
  // running them concurrently just duplicates the crawl against the same preview server for no speed benefit on a site this small
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/playwright-report.json' }]],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:4321',
  },
  projects: [
    { name: 'bdd', testDir: bddTestDir, use: { ...devices['Desktop Chrome'] } },
    { name: 'plain', testDir: 'tests', testMatch: '**/*.spec.ts', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

`test-results/` is already gitignored (added in Fase 4) — no `.gitignore` change needed for this step.

- [ ] **Step 2: Add the a11y summary artifact write to `tests/a11y.spec.ts`**

Current file:

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { crawlSite } from './support/crawler';

test.use({ reducedMotion: 'reduce' });

test('every discovered route has no serious accessibility violations', async ({ page, baseURL }) => {
  const { routes } = await crawlSite(page, baseURL ?? 'http://localhost:4321');

  for (const route of routes) {
    await page.goto(route.path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  }
});
```

Replace it with (adds `fs`/`path` imports and a write after the loop — the write only runs if every iteration of the loop passed its assertion, since a thrown `expect` failure aborts the test before reaching it):

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
import { crawlSite } from './support/crawler';

test.use({ reducedMotion: 'reduce' });

test('every discovered route has no serious accessibility violations', async ({ page, baseURL }) => {
  const { routes } = await crawlSite(page, baseURL ?? 'http://localhost:4321');

  for (const route of routes) {
    await page.goto(route.path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  }

  const summary = { routesChecked: routes.length, violations: 0 };
  fs.mkdirSync('test-results', { recursive: true });
  fs.writeFileSync(path.join('test-results', 'a11y-summary.json'), JSON.stringify(summary, null, 2));
});
```

- [ ] **Step 3: Run the e2e suite and verify both artifacts are written**

Run: `npm run test:e2e`
Expected: PASS, 5 tests (same as Fase 4 — no scenario changed). Then verify the artifacts exist and look right:

Run: `cat test-results/playwright-report.json | head -c 300` (or open the file) — expect valid JSON starting with `{"config":...` or similar Playwright JSON-reporter shape (top-level keys typically include `config`, `suites`, `stats`).
Run: `cat test-results/a11y-summary.json` — expect exactly `{"routesChecked": <N>, "violations": 0}` where `<N>` is the number of routes the crawler found (8, per Fase 4's final review — this doesn't need to match a hardcoded number, just be a positive integer).

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/a11y.spec.ts
git commit -m "$(cat <<'EOF'
Adiciona reporter JSON do Playwright e artefato de resumo do a11y

playwright.config.ts grava test-results/playwright-report.json (mesmo
quando um cenario falha). a11y.spec.ts grava test-results/a11y-summary.json
depois da asercao — so existe se o teste passou, mantendo a
zero-tolerancia inalterada. Sao os dois artefatos que
build-quality-report.ts (proxima fase deste plano) vai consumir.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Lighthouse CI config

**Files:**
- Create: `lighthouserc.json`
- Modify: `package.json` (add `@lhci/cli` devDependency)
- Modify: `.gitignore` (add `.lighthouseci/`)

**Interfaces:**
- Produces: when `npx lhci autorun` runs against a built `dist/`, it writes `.lighthouseci/manifest.json` — an array of entries shaped `{ url: string, isRepresentativeRun: boolean, htmlPath: string, jsonPath: string, summary: Record<string, number> }`, where `summary` has keys `performance`, `accessibility`, `best-practices`, `seo` (Lighthouse's category ids, values 0-1). Task 4's wrapper reads this file and this exact shape — confirmed by reading `@lhci/cli`'s own source (`node_modules/@lhci/cli/src/upload/upload.js`, the `entry.summary = ...lhr.categories[key].score` line) during this plan's research, not guessed.

- [ ] **Step 1: Install `@lhci/cli`**

```bash
npm install -D @lhci/cli
```

**Expect `npm audit` to report new vulnerabilities after this install** — during this plan's research, installing `@lhci/cli` surfaced 10 (2 low, 1 moderate, 7 high), all inside `@lhci/cli`'s own bundled `lighthouse` → `puppeteer-core` → `@puppeteer/browsers` → `extract-zip`/`tmp`/`uuid` dependency chain (symlink path traversal in `extract-zip`/`tmp`, a buffer bounds issue in `uuid`). Confirmed via `npm audit --omit=dev` that **production dependencies remain at 0 vulnerabilities** — these are entirely inside dev tooling that only runs inside the CI container, never shipped to the built site. `npm audit fix --force` would downgrade `@lhci/cli` to `0.1.0` (ancient, defeats the point) — do not run it. This is a known, widely-reported situation for `@lhci/cli` across the ecosystem (Google's Lighthouse team bundles an old Puppeteer chain), not something introduced by this project. Note it in your task report; it does not block the task.

- [ ] **Step 2: Write `lighthouserc.json`**

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "dist",
      "url": ["http://localhost/index.html", "http://localhost/pt/index.html"],
      "settings": {
        "chromeFlags": "--no-sandbox --headless=new"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }]
      }
    },
    "upload": {
      "target": "filesystem",
      "outputDir": ".lighthouseci"
    }
  }
}
```

`staticDistDir` lets LHCI serve `dist/` itself with a static file server — no need to run `astro preview` concurrently with this. `--no-sandbox` is required in most CI containers (Chrome's sandbox needs kernel privileges CI runners don't grant); harmless locally too.

- [ ] **Step 3: Add `.lighthouseci/` to `.gitignore`**

Add this line to `.gitignore` (alongside the other generated-artifact entries from Fase 4):

```
.lighthouseci/
```

Full `.gitignore` after the edit:

```
.worktrees/
.superpowers/
.claude/
node_modules/
dist/
.astro/
.env
.DS_Store
test-results/
playwright-report/
blob-report/
.features-gen/
.lighthouseci/
```

- [ ] **Step 4: Verify the config is valid, and attempt a real local run**

Run: `npm run build` (produces `dist/`), then:

Run: `npx lhci healthcheck --fatal` (or just start `npx lhci autorun` and watch the first few lines)
Expected: `✅ .lighthouseci/ directory writable`, `✅ Configuration file found`. Chrome detection may need `CHROME_PATH` set to a real Chrome/Chromium binary if none is on `PATH` — Playwright's own installed Chromium works for this (find it under the Playwright browser cache directory, e.g. `~/.cache/ms-playwright/chromium-*/chrome-linux/chrome` on Linux/CI or the equivalent on your OS, then `export CHROME_PATH=<that path>`).

**Known limitation, confirmed during this plan's research, not something to debug further here:** on at least one Windows development machine, `npx lhci autorun` passes its healthcheck (config valid, Chrome found) but then fails the actual Lighthouse run itself with `Runtime error encountered: spawn UNKNOWN` from `chrome-launcher` — reproduced identically from both Git Bash and native PowerShell, with and without a sandbox, so it isn't specific to any one shell. This is a known category of Windows-specific `chrome-launcher`/Node `child_process.spawn` issue, unrelated to this config's correctness (the config's own healthcheck already validates it). **If you hit this exact symptom on Windows, don't chase it further — move on and treat Task 6's real GitHub Actions run (Ubuntu) as the authoritative verification for Lighthouse actually producing scores.** If you're on Linux/macOS, or the run succeeds, verify `.lighthouseci/manifest.json` exists and matches the shape documented in this task's Interfaces section.

- [ ] **Step 5: Commit**

```bash
git add lighthouserc.json package.json package-lock.json .gitignore
git commit -m "$(cat <<'EOF'
Adiciona configuracao do Lighthouse CI

lighthouserc.json roda contra dist/ estatico (staticDistDir, sem
precisar de servidor de preview em paralelo), amostrando / e /pt/,
com threshold >=0.9 nas 4 categorias. npm audit acusa vulnerabilidades
na cadeia interna do lighthouse/puppeteer do @lhci/cli (dev-only,
producao continua em 0 — ver nota no relatorio desta tarefa).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Bundle size utility

**Files:**
- Create: `scripts/dirSize.ts`
- Create: `scripts/dirSize.test.ts`

**Interfaces:**
- Produces: `getDirectorySizeBytes(dirPath: string): number` — recursively sums the byte size of every file under `dirPath`. Task 4's wrapper calls this with `'dist'` after a build.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/dirSize.test.ts
import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getDirectorySizeBytes } from './dirSize';

describe('getDirectorySizeBytes', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dirsize-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('sums the size of files at the top level', () => {
    fs.writeFileSync(path.join(tmpDir, 'a.txt'), 'hello'); // 5 bytes
    fs.writeFileSync(path.join(tmpDir, 'b.txt'), 'world!'); // 6 bytes

    expect(getDirectorySizeBytes(tmpDir)).toBe(11);
  });

  it('sums files in nested subdirectories', () => {
    fs.writeFileSync(path.join(tmpDir, 'a.txt'), 'hello'); // 5 bytes
    const nested = path.join(tmpDir, 'nested', 'deeper');
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(nested, 'b.txt'), 'world!'); // 6 bytes

    expect(getDirectorySizeBytes(tmpDir)).toBe(11);
  });

  it('returns 0 for an empty directory', () => {
    expect(getDirectorySizeBytes(tmpDir)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- dirSize`
Expected: FAIL — `Cannot find module './dirSize'` (the file doesn't exist yet).

- [ ] **Step 3: Write `scripts/dirSize.ts`**

```ts
import fs from 'node:fs';
import path from 'node:path';

export function getDirectorySizeBytes(dirPath: string): number {
  let total = 0;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += getDirectorySizeBytes(entryPath);
    } else if (entry.isFile()) {
      total += fs.statSync(entryPath).size;
    }
  }

  return total;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- dirSize`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/dirSize.ts scripts/dirSize.test.ts
git commit -m "$(cat <<'EOF'
Adiciona getDirectorySizeBytes para medir o tamanho do bundle

Soma recursiva de todos os arquivos em um diretorio (usado depois com
dist/ inteiro, nao so dist/_astro) — testado com diretorios temporarios
reais, sem mock de fs.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `build-quality-report.ts` + initial `quality.json`

**Files:**
- Create: `scripts/build-quality-report.ts`
- Create: `scripts/build-quality-report.test.ts`
- Create: `src/data/quality.json`

**Interfaces:**
- Consumes: `getDirectorySizeBytes` from `scripts/dirSize.ts` (Task 3, wrapper only).
- Produces (relied on by Task 5): the `QualityReport` type and the exact shape written to `src/data/quality.json` — `{ generatedAt: string | null, runUrl: string | null, commitSha: string | null, playwright: { scenarios: { feature: string, passed: number, total: number }[], passed: number, total: number } | null, a11y: { routesChecked: number, violations: number } | null, lighthouse: { performance: number, accessibility: number, bestPractices: number, seo: number } | null, bundleSizeBytes: number | null }`.

- [ ] **Step 1: Write the failing tests**

```ts
// scripts/build-quality-report.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- build-quality-report`
Expected: FAIL — `Cannot find module './build-quality-report'`.

- [ ] **Step 3: Write `scripts/build-quality-report.ts`**

```ts
import fs from 'node:fs';
import path from 'node:path';
import { getDirectorySizeBytes } from './dirSize';

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

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- build-quality-report`
Expected: PASS, 6 tests.

- [ ] **Step 5: Verify the script runs standalone via plain `node`**

Node 24 (the version this project uses locally — confirm with `node --version`) runs `.ts` files directly via built-in type-stripping, no `tsx`/`ts-node` needed. This was confirmed during this plan's research with a throwaway file; verify it still holds for this real file:

Run: `node scripts/build-quality-report.ts`
Expected: runs without a syntax/type error, prints `Wrote src/data/quality.json: {...}` (values will mostly be `null` unless `test-results/`, `.lighthouseci/`, and `dist/` already exist from earlier manual runs — that's fine, this step is only checking that the script executes, not checking specific values yet).

**If this fails with a syntax error** (e.g., because a CI runner ends up on an older Node that doesn't support type-stripping), note it in your report — Task 6 pins the Node version used in CI, and it must be ≥ 24 for this to work without adding `tsx` as a dependency.

- [ ] **Step 6: Write the initial `src/data/quality.json`**

```json
{
  "generatedAt": null,
  "runUrl": null,
  "commitSha": null,
  "playwright": null,
  "a11y": null,
  "lighthouse": null,
  "bundleSizeBytes": null
}
```

This is committed so `/quality` (Task 5) has something real to import and render as "indisponível" from the very first build, before any CI run has generated real data.

- [ ] **Step 7: Commit**

```bash
git add scripts/build-quality-report.ts scripts/build-quality-report.test.ts src/data/quality.json
git commit -m "$(cat <<'EOF'
Adiciona build-quality-report.ts e o quality.json inicial

Funcao pura buildQualityReport() monta o QualityReport a partir dos
artefatos ja parseados; flattenPlaywrightReport() e
averageLighthouseScores() sao as duas pecas de logica não-trivial,
testadas isoladamente. O wrapper (main(), so roda quando o arquivo e
executado diretamente) le os artefatos reais do disco e process.env,
sempre escrevendo null explicito pro que faltar — nunca omite a chave
nem inventa valor. quality.json inicial committado com tudo null, pra
/quality nascer funcional antes do primeiro run real de CI.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `/quality` pages

**Files:**
- Create: `src/utils/formatQuality.ts`
- Create: `src/utils/formatQuality.test.ts`
- Create: `src/pages/quality.astro`
- Create: `src/pages/pt/quality.astro`

**Interfaces:**
- Consumes: `QualityReport` type from `scripts/build-quality-report.ts` (Task 4), `src/data/quality.json` (Task 4).
- Produces: nothing consumed by a later task — this is the last content task.

- [ ] **Step 1: Write the failing tests for the format helpers**

```ts
// src/utils/formatQuality.test.ts
import { describe, expect, it } from 'vitest';
import { formatBundleSize, formatDate, formatScore } from './formatQuality';

describe('formatBundleSize', () => {
  it('returns "indisponível" for null', () => {
    expect(formatBundleSize(null)).toBe('indisponível');
  });

  it('formats bytes under 1 KB in bytes', () => {
    expect(formatBundleSize(512)).toBe('512 B');
  });

  it('formats kilobytes with one decimal', () => {
    expect(formatBundleSize(204_800)).toBe('200.0 KB');
  });

  it('formats megabytes with one decimal', () => {
    expect(formatBundleSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});

describe('formatDate', () => {
  it('returns "indisponível" for null', () => {
    expect(formatDate(null)).toBe('indisponível');
  });

  it('formats an ISO string as a readable UTC date/time', () => {
    expect(formatDate('2026-09-14T12:34:00.000Z')).toBe('2026-09-14 12:34 UTC');
  });
});

describe('formatScore', () => {
  it('returns "indisponível" for null', () => {
    expect(formatScore(null)).toBe('indisponível');
  });

  it('formats a 0-1 score as a rounded percentage', () => {
    expect(formatScore(0.95)).toBe('95');
    expect(formatScore(1)).toBe('100');
    expect(formatScore(0.904)).toBe('90');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- formatQuality`
Expected: FAIL — `Cannot find module './formatQuality'`.

- [ ] **Step 3: Write `src/utils/formatQuality.ts`**

```ts
export function formatBundleSize(bytes: number | null): string {
  if (bytes === null) return 'indisponível';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string | null): string {
  if (iso === null) return 'indisponível';
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const h = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  return `${y}-${m}-${d} ${h}:${min} UTC`;
}

export function formatScore(score: number | null): string {
  if (score === null) return 'indisponível';
  return String(Math.round(score * 100));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- formatQuality`
Expected: PASS, 8 tests.

- [ ] **Step 5: Write `src/pages/quality.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import quality from '../data/quality.json';
import { formatBundleSize, formatDate, formatScore } from '../utils/formatQuality';

const featureFileUrl = (feature: string) =>
  `https://github.com/WillianMPfeifer/portfolio-qa-astro/blob/master/tests/features/${feature}.feature`;

const LIGHTHOUSE_THRESHOLD = 0.9;
const scoreClass = (score: number) => (score >= LIGHTHOUSE_THRESHOLD ? 'value value--passed' : 'value value--failed');
---

<BaseLayout title="Willian — Quality">
  <article class="quality">
    <h1>Quality</h1>
    <p class="meta">
      Last run: {formatDate(quality.generatedAt)}
      {quality.runUrl && (
        <>
          {' — '}
          <a href={quality.runUrl}>view on GitHub</a>
        </>
      )}
    </p>

    <section aria-labelledby="scenarios-heading">
      <h2 id="scenarios-heading">Test scenarios</h2>
      {quality.playwright ? (
        <ul class="data-list">
          {quality.playwright.scenarios.map((scenario) => (
            <li>
              <span class="label">{scenario.feature}</span>
              <span class={scenario.passed === scenario.total ? 'value value--passed' : 'value value--failed'}>
                {scenario.passed}/{scenario.total}
              </span>
              {scenario.feature !== 'a11y' && (
                <a href={featureFileUrl(scenario.feature)}>.feature</a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p class="unavailable">indisponível</p>
      )}
    </section>

    <section aria-labelledby="a11y-heading">
      <h2 id="a11y-heading">Accessibility</h2>
      {quality.a11y ? (
        <p>
          {quality.a11y.violations} violations across {quality.a11y.routesChecked} routes
        </p>
      ) : (
        <p class="unavailable">indisponível</p>
      )}
    </section>

    <section aria-labelledby="lighthouse-heading">
      <h2 id="lighthouse-heading">Lighthouse</h2>
      {quality.lighthouse ? (
        <ul class="data-list">
          <li><span class="label">Performance</span><span class={scoreClass(quality.lighthouse.performance)}>{formatScore(quality.lighthouse.performance)}</span></li>
          <li><span class="label">Accessibility</span><span class={scoreClass(quality.lighthouse.accessibility)}>{formatScore(quality.lighthouse.accessibility)}</span></li>
          <li><span class="label">Best Practices</span><span class={scoreClass(quality.lighthouse.bestPractices)}>{formatScore(quality.lighthouse.bestPractices)}</span></li>
          <li><span class="label">SEO</span><span class={scoreClass(quality.lighthouse.seo)}>{formatScore(quality.lighthouse.seo)}</span></li>
        </ul>
      ) : (
        <p class="unavailable">indisponível</p>
      )}
    </section>

    <section aria-labelledby="bundle-heading">
      <h2 id="bundle-heading">Bundle size</h2>
      <p>{formatBundleSize(quality.bundleSizeBytes)}</p>
    </section>
  </article>
</BaseLayout>

<style>
  .quality {
    padding: 1.5rem;
    max-width: var(--measure);
  }

  .meta {
    color: var(--ink-soft);
    margin: 0.5rem 0 1.5rem;
  }

  section {
    margin-top: 2rem;
  }

  .data-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .data-list li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-top: 1px solid var(--ink-soft);
    padding: 0.6rem 0;
  }

  .data-list li:last-child {
    border-bottom: 1px solid var(--ink-soft);
  }

  .label {
    flex: 1;
  }

  .value {
    font-family: var(--font-mono);
  }

  .value--passed {
    color: var(--passed);
  }

  .value--failed {
    color: var(--failed);
  }

  .unavailable {
    color: var(--ink-soft);
    font-style: italic;
  }
</style>
```

Note: `quality.playwright.scenarios` filters out the `a11y` row from linking to a `.feature` file (that entry comes from `tests/a11y.spec.ts`, a plain Playwright spec, not a Gherkin feature — there's no `.feature` file for it).

- [ ] **Step 6: Write `src/pages/pt/quality.astro`**

Same structure, Portuguese labels:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import quality from '../../data/quality.json';
import { formatBundleSize, formatDate, formatScore } from '../../utils/formatQuality';

const featureFileUrl = (feature: string) =>
  `https://github.com/WillianMPfeifer/portfolio-qa-astro/blob/master/tests/features/${feature}.feature`;

const LIGHTHOUSE_THRESHOLD = 0.9;
const scoreClass = (score: number) => (score >= LIGHTHOUSE_THRESHOLD ? 'value value--passed' : 'value value--failed');
---

<BaseLayout title="Willian — Qualidade">
  <article class="quality">
    <h1>Qualidade</h1>
    <p class="meta">
      Última execução: {formatDate(quality.generatedAt)}
      {quality.runUrl && (
        <>
          {' — '}
          <a href={quality.runUrl}>ver no GitHub</a>
        </>
      )}
    </p>

    <section aria-labelledby="scenarios-heading">
      <h2 id="scenarios-heading">Cenários de teste</h2>
      {quality.playwright ? (
        <ul class="data-list">
          {quality.playwright.scenarios.map((scenario) => (
            <li>
              <span class="label">{scenario.feature}</span>
              <span class={scenario.passed === scenario.total ? 'value value--passed' : 'value value--failed'}>
                {scenario.passed}/{scenario.total}
              </span>
              {scenario.feature !== 'a11y' && (
                <a href={featureFileUrl(scenario.feature)}>.feature</a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p class="unavailable">indisponível</p>
      )}
    </section>

    <section aria-labelledby="a11y-heading">
      <h2 id="a11y-heading">Acessibilidade</h2>
      {quality.a11y ? (
        <p>
          {quality.a11y.violations} violações em {quality.a11y.routesChecked} rotas
        </p>
      ) : (
        <p class="unavailable">indisponível</p>
      )}
    </section>

    <section aria-labelledby="lighthouse-heading">
      <h2 id="lighthouse-heading">Lighthouse</h2>
      {quality.lighthouse ? (
        <ul class="data-list">
          <li><span class="label">Performance</span><span class={scoreClass(quality.lighthouse.performance)}>{formatScore(quality.lighthouse.performance)}</span></li>
          <li><span class="label">Acessibilidade</span><span class={scoreClass(quality.lighthouse.accessibility)}>{formatScore(quality.lighthouse.accessibility)}</span></li>
          <li><span class="label">Boas Práticas</span><span class={scoreClass(quality.lighthouse.bestPractices)}>{formatScore(quality.lighthouse.bestPractices)}</span></li>
          <li><span class="label">SEO</span><span class={scoreClass(quality.lighthouse.seo)}>{formatScore(quality.lighthouse.seo)}</span></li>
        </ul>
      ) : (
        <p class="unavailable">indisponível</p>
      )}
    </section>

    <section aria-labelledby="bundle-heading">
      <h2 id="bundle-heading">Tamanho do bundle</h2>
      <p>{formatBundleSize(quality.bundleSizeBytes)}</p>
    </section>
  </article>
</BaseLayout>

<style>
  .quality {
    padding: 1.5rem;
    max-width: var(--measure);
  }

  .meta {
    color: var(--ink-soft);
    margin: 0.5rem 0 1.5rem;
  }

  section {
    margin-top: 2rem;
  }

  .data-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .data-list li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-top: 1px solid var(--ink-soft);
    padding: 0.6rem 0;
  }

  .data-list li:last-child {
    border-bottom: 1px solid var(--ink-soft);
  }

  .label {
    flex: 1;
  }

  .value {
    font-family: var(--font-mono);
  }

  .value--passed {
    color: var(--passed);
  }

  .value--failed {
    color: var(--failed);
  }

  .unavailable {
    color: var(--ink-soft);
    font-style: italic;
  }
</style>
```

- [ ] **Step 7: Verify both pages render correctly with the all-null initial data**

Run: `npm run build`
Expected: build succeeds, `dist/quality/index.html` and `dist/pt/quality/index.html` exist.

Run: `npm run dev`, then open `http://localhost:4321/quality` and `http://localhost:4321/pt/quality` in a browser (or use `curl`/`get_page_text` if no browser is available in your environment).
Expected: every section shows "indisponível" (en) / "indisponível" (pt — same word is used in Portuguese too), no crash, no "undefined" or blank rendering — this is the honesty-rule fallback working correctly against the real initial `quality.json` from Task 4, not a simulated scenario.

- [ ] **Step 8: Commit**

```bash
git add src/utils/formatQuality.ts src/utils/formatQuality.test.ts src/pages/quality.astro src/pages/pt/quality.astro
git commit -m "$(cat <<'EOF'
Adiciona a pagina /quality e /pt/quality

Le src/data/quality.json via import estatico (sem chamada em runtime).
formatQuality.ts isola a logica de formatacao (bundle size, data,
score) com testes reais. Cada secao mostra "indisponivel" quando o
campo correspondente do JSON e null — verificado contra o quality.json
inicial (tudo null) da Task 4, nao simulado.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: CI workflow (`.github/workflows/ci.yml`)

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:** none — this is the integration point that runs everything from Tasks 1-5 in sequence. No later task depends on anything this task exports.

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:

permissions:
  contents: write

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browser
        run: npx playwright install --with-deps chromium

      - name: Build
        id: build
        continue-on-error: true
        run: npm run build

      - name: Unit tests
        id: unit
        continue-on-error: true
        run: npm run test:unit

      - name: E2E tests
        id: e2e
        continue-on-error: true
        run: npm run test:e2e

      - name: Find Playwright Chromium path for Lighthouse
        id: playwright-chrome-path
        run: echo "path=$(find ~/.cache/ms-playwright -maxdepth 2 -iname 'chrome' -o -iname 'headless_shell' | head -n1)" >> "$GITHUB_OUTPUT"

      - name: Lighthouse CI
        id: lighthouse
        continue-on-error: true
        run: npx lhci autorun
        env:
          CHROME_PATH: ${{ steps.playwright-chrome-path.outputs.path }}

      - name: Build quality report
        id: quality
        if: always()
        continue-on-error: true
        run: node scripts/build-quality-report.ts
        env:
          GITHUB_SHA: ${{ github.sha }}
          GITHUB_RUN_ID: ${{ github.run_id }}
          GITHUB_SERVER_URL: ${{ github.server_url }}
          GITHUB_REPOSITORY: ${{ github.repository }}

      - name: Commit quality.json
        if: always() && github.event_name == 'push' && github.ref == 'refs/heads/master'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add src/data/quality.json
          if git diff --cached --quiet; then
            echo "No changes to quality.json, skipping commit."
          else
            git commit -m "chore: atualiza quality.json [skip ci]"
            git push
          fi

      - name: Fail if any stage failed
        if: always()
        run: |
          if [ "${{ steps.build.outcome }}" != "success" ] || \
             [ "${{ steps.unit.outcome }}" != "success" ] || \
             [ "${{ steps.e2e.outcome }}" != "success" ] || \
             [ "${{ steps.lighthouse.outcome }}" != "success" ]; then
            echo "One or more stages failed — see the step logs above."
            exit 1
          fi
```

Notes on the trickier pieces (read before moving on to verification):

- **`Find Playwright Chromium path for Lighthouse` runs before `Lighthouse CI` and after `Install Playwright browser`**, and exposes its result as an output (`steps.playwright-chrome-path.outputs.path`) that `Lighthouse CI` reads via `env: CHROME_PATH: ${{ steps.playwright-chrome-path.outputs.path }}`. GitHub Actions steps run in file order, and a step can only reference an output from a step that already ran — this ordering is what makes that reference valid. If you ever reorder these two steps, this reference breaks silently (the env var would just be empty).
- **`continue-on-error: true` on `build`/`unit`/`e2e`/`lighthouse`** lets every later step still run even if one of these fails — otherwise `build-quality-report.ts` and the commit-back step would simply never execute on a failure, silently leaving `quality.json` stale (exactly the bug the spec's acceptance criterion calls out).
- **The final `Fail if any stage failed` step** reads each earlier step's `outcome` (available because each has an explicit `id`) and exits 1 if any wasn't `success` — this is what keeps the CI status accurately red even though the job "continued" past a failure to generate a report.
- **The commit-back step's guard is `if: always() && github.event_name == 'push' && github.ref == 'refs/heads/master'`** — it runs even after an upstream failure (so a broken run still gets its "here's what broke" reflected in `quality.json`), but never on a `pull_request` event.
- **`permissions: contents: write`** at the workflow level is required for the default `GITHUB_TOKEN` to be allowed to push a commit back to the repository — without it, the `git push` in the commit-back step fails with a permissions error.

- [ ] **Step 2: Read through the whole file once, by hand, checking step ordering and `if`/`id`/`continue-on-error` combinations**

This is a plain reading exercise, not a command to run. Confirm:
1. `playwright-chrome-path` runs before `Lighthouse CI` and after `Install Playwright browser` (it does, in the code above — just double-check you didn't reorder anything while typing it in).
2. Every step that later steps depend on for `outputs` or `outcome` has an explicit `id`.
3. `Build quality report` and `Commit quality.json` both have `if: always()` (or an `if` that still fires after a failure — `always() && ...` is fine, plain `always()` alone is also fine).
4. `Commit quality.json`'s `if` excludes `pull_request` — re-read the exact expression once more; a typo here (e.g. `==` vs `!=`, or the wrong ref string) would either commit to PR branches or silently never commit at all, and neither would be caught by a normal green CI run.

- [ ] **Step 3: Run every command the workflow invokes, locally, in the same order, to catch anything that isn't GitHub-Actions-specific**

This cannot fully validate the workflow (GitHub-Actions-specific behavior — `if: always()`, `continue-on-error`, `steps.<id>.outputs`/`outcome`, the `GITHUB_TOKEN` push permission — only proves itself out when the workflow actually runs on GitHub). But every individual command inside it is a plain local command; run them in sequence exactly as the workflow does, to at least confirm none of them is simply broken:

```bash
npm ci
npx playwright install --with-deps chromium
npm run build
npm run test:unit
npm run test:e2e
```

(Skip `npx lhci autorun` here if your local environment hit the Windows `spawn UNKNOWN` issue documented in Task 2 — that's a known local-only limitation, not a workflow bug.)

Then:

```bash
node scripts/build-quality-report.ts
```

Expected: `src/data/quality.json` now has real (non-null) `generatedAt`, `playwright`, `a11y`, and `bundleSizeBytes` — `lighthouse` and `runUrl`/`commitSha` will be `null` locally (no `.lighthouseci/manifest.json` if Lighthouse didn't run locally; no `GITHUB_*` env vars outside Actions). This is the *correct*, honest behavior, not a bug — it's exactly what should happen when those upstream artifacts don't exist.

**Revert this before committing** — this task doesn't produce a new `quality.json` value; the real first population happens when this workflow runs for real on `master`.

```bash
git checkout -- src/data/quality.json
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
Adiciona o workflow de CI (.github/workflows/ci.yml)

build/test:unit/test:e2e/lighthouse rodam com continue-on-error, e
build-quality-report.ts + o commit de volta do quality.json rodam com
if: always() — assim uma falha em qualquer etapa ainda gera um
relatorio honesto (campo vira null, nao fica com dado velho) em vez de
o job simplesmente parar. Um passo final falha o job explicitamente se
qualquer etapa nao foi sucesso, mantendo o status do CI vermelho de
verdade. O commit de volta so acontece em push direto pra master, nunca
em PR.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Verificação final + demonstração do critério de aceite

**Files:** none created or modified permanently.

**Interfaces:** none.

- [ ] **Step 1: Rodar a suíte completa do zero**

```bash
npm run build
npm run test:unit
npm run test:e2e
```

Expected: tudo verde (mesmos números da Fase 4 — 32 unit + 5 e2e — mais os testes novos desta fase: `dirSize` (3), `build-quality-report` (6), `formatQuality` (8), então `test:unit` deve reportar 32 + 3 + 6 + 8 = 49 testes).

- [ ] **Step 2: Demonstração reproduzível — um artefato ausente vira "indisponível", não dado velho**

Não é um teste automatizado permanente (mesmo raciocínio da Fase 4 para o link quebrado). Simula uma etapa que falhou sem gerar artefato:

```bash
mv test-results/a11y-summary.json test-results/a11y-summary.json.bak
node scripts/build-quality-report.ts
cat src/data/quality.json
```

Expected: o campo `"a11y"` no JSON impresso é `null` — mesmo com `test-results/playwright-report.json` presente e válido, a ausência específica do resumo de a11y não contamina nem trava o resto do relatório.

- [ ] **Step 3: Confirmar que a página reflete isso, não uma versão desatualizada**

```bash
npm run build
```

Expected: build sucede. Abra `dist/quality/index.html` (ou rode `npm run dev` e visite `/quality`) e confirme que a seção "Accessibility" mostra "indisponível", enquanto "Test scenarios" continua mostrando os números reais.

- [ ] **Step 4: Reverter tudo**

```bash
mv test-results/a11y-summary.json.bak test-results/a11y-summary.json
git checkout -- src/data/quality.json
git status
```

Expected: `git status` limpo — nenhuma mudança permanente ficou desta demonstração.

- [ ] **Step 5: Nada para commitar nesta tarefa**

O relatório desta tarefa (ledger da SDD) deve registrar a saída do Step 2 (o JSON com `"a11y": null`) como a evidência do critério de aceite da Fase 5.
