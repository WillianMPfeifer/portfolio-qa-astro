# Fase 4 — Suíte de testes (Playwright + BDD + a11y) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Fase 4 test suite for the portfolio site — Playwright + `playwright-bdd` (Gherkin, English) with a Page Object Model, plus an axe accessibility sweep — covering site health (every route responds, no broken links), theme persistence, and the translationKey-based language switch, using a crawler so `tests/` never needs editing when content is added.

**Architecture:** A transitive crawler (`tests/support/crawler.ts`) walks the built site from `/`, following internal `<a href>`s, and returns every discovered route plus every link it found (with status). Three `.feature` files drive scenarios through a small Page Object Model (`BasePage` → `HomePage`/`ProjectDetailPage`, each pairing with an `elements/*.elements.ts` file of `getByRole`/`getByText` locators). `a11y.spec.ts` reuses the same crawler to run axe against every discovered route. Everything runs against `astro build && astro preview`, never `astro dev`.

**Tech Stack:** `@playwright/test`, `playwright-bdd`, `@axe-core/playwright`, TypeScript strict (existing `tsconfig`), Vitest (for the crawler's pure-logic unit test).

## Global Constraints

- Gherkin scenarios and step text: English only (spec §6.4.1 — deliberate decision, does not affect the site's own pt-BR content).
- Route/link discovery: crawler only, never a hardcoded route list (spec §5.7, §6.4.1) — running against `astro build && astro preview`, not `astro dev`.
- Locators: `getByRole`/`getByText` only — no `data-testid` added to any Astro component (spec §6.4.1).
- Architecture: Page Object Model with a separate `elements/*.elements.ts` file per page holding only locators; `pages/*.ts` only orchestrates actions (spec §6.4.1).
- File structure is fixed by spec §6.4.2 — do not rename or relocate the files listed there without flagging it back to the plan owner.
- `tests/` must never need to change when a new case study or doc page is added later (spec §5.7) — this is why the crawler exists; do not special-case specific routes inside it.
- All four existing case-study URLs already end with a trailing slash (`projectHref` in `src/utils/projectList.ts`) — don't assume otherwise when normalizing crawled paths.

---

## File Structure

```
playwright.config.ts                    # root, not inside tests/ — see Task 1 note
package.json                            # modified: devDependencies + "test:e2e" script
.gitignore                              # modified: playwright artifacts
tests/
  support/
    crawler.ts                          # crawlSite(page, baseUrl) — transitive crawl
    crawler.test.ts                     # Vitest unit test, fake Page double
  pages/
    BasePage.ts                         # shared locators (theme, language) + actions
    HomePage.ts
    ProjectDetailPage.ts
  elements/
    HomePage.elements.ts
    ProjectDetailPage.elements.ts
  features/
    site-health.feature
    theme-toggle.feature
    language-switch.feature
  steps/
    site-health.steps.ts
    theme-toggle.steps.ts
    language-switch.steps.ts
  a11y.spec.ts
```

---

### Task 1: Toolchain — Playwright, playwright-bdd, axe, config, BasePage

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Create: `playwright.config.ts`
- Create: `tests/pages/BasePage.ts`

**Interfaces:**
- Produces: `BasePage` class — constructor `(page: Page)`, properties `page: Page`, `themeToggleButton: Locator`, `languageLinkPt: Locator`, `languageLinkEn: Locator`; methods `goto(path: string): Promise<void>`, `getTheme(): Promise<string | null>`, `toggleTheme(): Promise<void>`. Every later `pages/*.ts` extends this.

- [ ] **Step 1: Install the test dependencies**

```bash
npm install -D @playwright/test playwright-bdd @axe-core/playwright
```

If any of these resolve to an API that doesn't match what later steps in this plan show (this happened with Fontsource in Fase 1 — the package's actual file layout differed from the original brief), adapt the code to the installed version's real API and note the discrepancy when reporting the task, rather than blocking on it.

- [ ] **Step 2: Install the Playwright browser binary**

```bash
npx playwright install chromium
```

- [ ] **Step 3: Add npm scripts**

Edit `package.json` — add to `"scripts"`:

```json
    "test:e2e": "playwright test"
```

Full `scripts` block after the edit:

```json
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test:unit": "vitest run",
    "test:e2e": "playwright test"
  },
```

- [ ] **Step 4: Ignore Playwright's generated artifacts**

Add to `.gitignore`:

```
test-results/
playwright-report/
blob-report/
.features-gen/
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
```

- [ ] **Step 5: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'tests/features/**/*.feature',
  steps: 'tests/steps/**/*.steps.ts',
});

export default defineConfig({
  testDir,
  fullyParallel: false,
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:4321',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

`fullyParallel: false` because the crawler-driven scenarios (`site-health.feature`, `a11y.spec.ts`) each walk the whole site — running them in parallel workers against the same preview server wastes the crawl instead of speeding it up, and the suite is small enough that this doesn't matter for run time.

Note on placement: spec §6.4.2 sketched `tests/playwright.config.ts` but flagged the exact location as "a decidir" — this plan puts it at the project root, which is where every Playwright CLI command (`npx playwright test`, `npx playwright install`) looks for it by default without extra flags. This is the only deviation from the spec's file diagram; it's cosmetic (a config file's location), not a scenario or architecture change.

- [ ] **Step 6: Write `tests/pages/BasePage.ts`**

```ts
import type { Locator, Page } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly themeToggleButton: Locator;
  readonly languageLinkPt: Locator;
  readonly languageLinkEn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.themeToggleButton = page.getByRole('button', { name: 'Toggle color theme' });
    this.languageLinkPt = page.getByRole('link', { name: 'pt', exact: true });
    this.languageLinkEn = page.getByRole('link', { name: 'en', exact: true });
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async getTheme(): Promise<string | null> {
    return this.page.evaluate(() => document.documentElement.dataset.theme ?? null);
  }

  async toggleTheme(): Promise<void> {
    await this.themeToggleButton.click();
  }
}
```

These locators target `Header.astro`'s language nav (`getByRole('link', { name: 'pt' | 'en', exact: true })` — the header always renders both as plain text links) and `ThemeToggle.astro`'s button (`aria-label="Toggle color theme"`), both unchanged since Fase 1/3.

- [ ] **Step 7: Verify the config parses and the runner starts cleanly**

Run: `npx playwright test --list`
Expected: exits 0, prints "Total: 0 tests in 0 files" (or equivalent — no scenarios exist yet, this only proves `playwright.config.ts` and `defineBddConfig` are wired correctly).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json .gitignore playwright.config.ts tests/pages/BasePage.ts
git commit -m "$(cat <<'EOF'
Adiciona toolchain de testes E2E: Playwright, playwright-bdd, axe

Config base (playwright.config.ts) e BasePage com os locators
compartilhados de tema e idioma do Header. Ainda sem cenarios.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Crawler + `site-health.feature`

**Files:**
- Create: `tests/support/crawler.ts`
- Create: `tests/support/crawler.test.ts`
- Create: `tests/features/site-health.feature`
- Create: `tests/steps/site-health.steps.ts`

**Interfaces:**
- Consumes: nothing from Task 1 directly (crawler is standalone; `playwright.config.ts` just needs to exist for the e2e run in Step 6).
- Produces: `crawlSite(page: Page, baseUrl: string): Promise<CrawlResult>`, `RouteCheck { path: string; status: number; ok: boolean }`, `LinkCheck { from: string; href: string; status: number; ok: boolean }`, `CrawlResult { routes: RouteCheck[]; links: LinkCheck[] }` — `a11y.spec.ts` (Task 5) reuses `crawlSite` and `CrawlResult.routes`.

- [ ] **Step 1: Write the crawler's unit test first**

```ts
// tests/support/crawler.test.ts
import { describe, expect, it } from 'vitest';
import { crawlSite } from './crawler';

interface FakeRoute {
  status: number;
  hrefs: string[];
}

function createFakePage(routes: Record<string, FakeRoute>) {
  const requestedUrls: string[] = [];

  const page = {
    async goto(url: string) {
      const path = new URL(url).pathname;
      const route = routes[path];
      requestedUrls.push(url);
      const status = route?.status ?? 404;
      return { status: () => status, ok: () => status < 400 };
    },
    async $$eval(_selector: string, _fn: unknown) {
      const lastUrl = requestedUrls[requestedUrls.length - 1];
      const path = new URL(lastUrl).pathname;
      return routes[path]?.hrefs ?? [];
    },
    request: {
      async get(url: string) {
        const path = new URL(url).pathname;
        const status = routes[path]?.status ?? 404;
        return { status: () => status, ok: () => status < 400 };
      },
    },
  };

  return page;
}

describe('crawlSite', () => {
  it('discovers every route reachable by internal links, following them transitively', async () => {
    const baseUrl = 'http://localhost:4321';
    const page = createFakePage({
      '/': { status: 200, hrefs: ['/projects/', 'https://external.example/'] },
      '/projects/': { status: 200, hrefs: ['/projects/case-a/', '/'] },
      '/projects/case-a/': { status: 200, hrefs: ['/'] },
    });

    const result = await crawlSite(page as any, baseUrl);

    expect(result.routes.map((route) => route.path).sort()).toEqual(
      ['/', '/projects/', '/projects/case-a/'].sort(),
    );
  });

  it('records a broken internal link without following external links', async () => {
    const baseUrl = 'http://localhost:4321';
    const page = createFakePage({
      '/': { status: 200, hrefs: ['/missing/', 'https://external.example/'] },
      '/missing/': { status: 404, hrefs: [] },
    });

    const result = await crawlSite(page as any, baseUrl);

    const brokenLink = result.links.find((link) => link.href === '/missing/');
    expect(brokenLink?.ok).toBe(false);
    expect(result.links.some((link) => link.href.includes('external.example'))).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:unit -- crawler`
Expected: FAIL — `crawler.ts` does not exist yet (`Cannot find module './crawler'`).

- [ ] **Step 3: Write `tests/support/crawler.ts`**

```ts
import type { Page } from '@playwright/test';

export interface RouteCheck {
  path: string;
  status: number;
  ok: boolean;
}

export interface LinkCheck {
  from: string;
  href: string;
  status: number;
  ok: boolean;
}

export interface CrawlResult {
  routes: RouteCheck[];
  links: LinkCheck[];
}

const SKIPPED_HREF_PREFIXES = ['#', 'mailto:', 'tel:'];

export async function crawlSite(page: Page, baseUrl: string): Promise<CrawlResult> {
  const origin = new URL(baseUrl).origin;
  const visited = new Set<string>();
  const queue: string[] = ['/'];
  const routes: RouteCheck[] = [];
  const links: LinkCheck[] = [];

  while (queue.length > 0) {
    const path = queue.shift() as string;
    if (visited.has(path)) continue;
    visited.add(path);

    const pageUrl = new URL(path, baseUrl).toString();
    const response = await page.goto(pageUrl);
    routes.push({
      path,
      status: response?.status() ?? 0,
      ok: response?.ok() ?? false,
    });

    const hrefs = await page.$$eval('a[href]', (anchors) =>
      anchors.map((anchor) => anchor.getAttribute('href')).filter((href): href is string => href !== null),
    );

    for (const href of hrefs) {
      if (SKIPPED_HREF_PREFIXES.some((prefix) => href.startsWith(prefix))) continue;

      const resolved = new URL(href, pageUrl);
      if (resolved.origin !== origin) continue;

      const linkResponse = await page.request.get(resolved.toString());
      links.push({
        from: path,
        href,
        status: linkResponse.status(),
        ok: linkResponse.ok(),
      });

      const normalizedPath = resolved.pathname + resolved.search;
      if (!visited.has(normalizedPath) && !queue.includes(normalizedPath)) {
        queue.push(normalizedPath);
      }
    }
  }

  return { routes, links };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:unit -- crawler`
Expected: PASS, 2 tests.

- [ ] **Step 5: Write `tests/features/site-health.feature`**

```gherkin
Feature: Site health

  Scenario: All internal routes resolve
    Given the site has been crawled from the home page
    Then every internal route that was found responds with an ok status

  Scenario: No broken links are left behind
    Given the site has been crawled from the home page
    Then every internal link that was found points to an ok response
```

- [ ] **Step 6: Write `tests/steps/site-health.steps.ts`**

```ts
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { crawlSite, type CrawlResult } from '../support/crawler';

const { Given, Then } = createBdd();

let crawlResult: CrawlResult;

Given('the site has been crawled from the home page', async ({ page, baseURL }) => {
  crawlResult = await crawlSite(page, baseURL ?? 'http://localhost:4321');
});

Then('every internal route that was found responds with an ok status', () => {
  const failed = crawlResult.routes.filter((route) => !route.ok);
  expect(failed, `Routes that did not respond ok: ${JSON.stringify(failed)}`).toEqual([]);
});

Then('every internal link that was found points to an ok response', () => {
  const broken = crawlResult.links.filter((link) => !link.ok);
  expect(broken, `Broken links: ${JSON.stringify(broken)}`).toEqual([]);
});
```

- [ ] **Step 7: Run the scenario against the built site**

Run: `npm run test:e2e -- --grep "Site health"`
Expected: PASS, 2 scenarios (this builds and previews the site automatically via `webServer` in `playwright.config.ts`).

- [ ] **Step 8: Commit**

```bash
git add tests/support/crawler.ts tests/support/crawler.test.ts tests/features/site-health.feature tests/steps/site-health.steps.ts
git commit -m "$(cat <<'EOF'
Adiciona crawler transitivo e o cenario de site health

crawlSite() descobre rotas e links internos a partir de "/" (testado
com um Page fake no Vitest). site-health.feature cobre "toda rota
responde 200" e "nenhum link quebrado" com o mesmo crawler.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `HomePage` + `theme-toggle.feature`

**Files:**
- Create: `tests/elements/HomePage.elements.ts`
- Create: `tests/pages/HomePage.ts`
- Create: `tests/features/theme-toggle.feature`
- Create: `tests/steps/theme-toggle.steps.ts`

**Interfaces:**
- Consumes: `BasePage` (Task 1) — extends it, inherits `goto`, `getTheme`, `toggleTheme`, `themeToggleButton`, `languageLinkPt`, `languageLinkEn`.
- Produces: `HomePageElements` class — constructor `(page: Page)`, method `featuredProjectLink(title: string): Locator`. `HomePage` class — constructor `(page: Page)`, property `elements: HomePageElements`, methods `open(locale?: 'en' | 'pt'): Promise<void>`, `openFeaturedProject(title: string): Promise<void>`. Task 4's `language-switch.steps.ts` uses `HomePage.open` and `HomePage.openFeaturedProject`.

- [ ] **Step 1: Write `tests/elements/HomePage.elements.ts`**

```ts
import type { Page } from '@playwright/test';

export class HomePageElements {
  constructor(private readonly page: Page) {}

  featuredProjectLink(title: string) {
    return this.page.getByRole('link', { name: title });
  }
}
```

`getByRole('link', { name: title })` matches by substring against the link's full accessible name — in `FeaturedProjects.astro` the `<a>` wraps the title, the `StackList` tags, and the "read the case"/"leia o caso" text together, so matching on the title alone is enough to identify the right link without needing an exact match.

- [ ] **Step 2: Write `tests/pages/HomePage.ts`**

```ts
import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { HomePageElements } from '../elements/HomePage.elements';

export class HomePage extends BasePage {
  readonly elements: HomePageElements;

  constructor(page: Page) {
    super(page);
    this.elements = new HomePageElements(page);
  }

  async open(locale: 'en' | 'pt' = 'en'): Promise<void> {
    await this.goto(locale === 'pt' ? '/pt/' : '/');
  }

  async openFeaturedProject(title: string): Promise<void> {
    await this.elements.featuredProjectLink(title).click();
  }
}
```

- [ ] **Step 3: Write `tests/features/theme-toggle.feature`**

```gherkin
Feature: Theme toggle

  Scenario: Switching the theme persists across a reload
    Given I am on the home page
    When I note the current theme
    And I toggle the theme
    Then the theme should have changed
    When I reload the page
    Then the theme should still be the toggled value
```

- [ ] **Step 4: Write `tests/steps/theme-toggle.steps.ts`**

```ts
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

const { Given, When, Then } = createBdd();

let homePage: HomePage;
let initialTheme: string | null;
let toggledTheme: string | null;

Given('I am on the home page', async ({ page }) => {
  homePage = new HomePage(page);
  await homePage.open('en');
});

When('I note the current theme', async () => {
  initialTheme = await homePage.getTheme();
});

When('I toggle the theme', async () => {
  await homePage.toggleTheme();
});

Then('the theme should have changed', async () => {
  toggledTheme = await homePage.getTheme();
  expect(toggledTheme).not.toBe(initialTheme);
  expect(['light', 'dark']).toContain(toggledTheme);
});

When('I reload the page', async ({ page }) => {
  await page.reload();
});

Then('the theme should still be the toggled value', async () => {
  const themeAfterReload = await homePage.getTheme();
  expect(themeAfterReload).toBe(toggledTheme);
});
```

- [ ] **Step 5: Run the scenario**

Run: `npm run test:e2e -- --grep "Theme toggle"`
Expected: PASS, 1 scenario.

- [ ] **Step 6: Commit**

```bash
git add tests/elements/HomePage.elements.ts tests/pages/HomePage.ts tests/features/theme-toggle.feature tests/steps/theme-toggle.steps.ts
git commit -m "$(cat <<'EOF'
Adiciona HomePage (POM) e o cenario de troca de tema

HomePage encapsula abrir a home e clicar num projeto em destaque.
theme-toggle.feature cobre alternar o tema e persistir apos reload.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `ProjectDetailPage` + `language-switch.feature`

**Files:**
- Create: `tests/elements/ProjectDetailPage.elements.ts`
- Create: `tests/pages/ProjectDetailPage.ts`
- Create: `tests/features/language-switch.feature`
- Create: `tests/steps/language-switch.steps.ts`

**Interfaces:**
- Consumes: `BasePage` (Task 1, via extension), `HomePage` (Task 3) — `open('en')` and `openFeaturedProject(title)`.
- Produces: `ProjectDetailPageElements` class — constructor `(page: Page)`, getter `heading: Locator`. `ProjectDetailPage` class — constructor `(page: Page)`, property `elements: ProjectDetailPageElements`, methods `switchToPortuguese(): Promise<void>`, `getTitle(): Promise<string | null>`.

- [ ] **Step 1: Write `tests/elements/ProjectDetailPage.elements.ts`**

```ts
import type { Page } from '@playwright/test';

export class ProjectDetailPageElements {
  constructor(private readonly page: Page) {}

  get heading() {
    return this.page.getByRole('heading', { level: 1 });
  }
}
```

`getByRole('heading', { level: 1 })` matches the `<h1>{project.data.title}</h1>` in both `src/pages/projects/[...slug].astro` and `src/pages/pt/projects/[...slug].astro` (Fase 3) — same locator works on either locale's page.

- [ ] **Step 2: Write `tests/pages/ProjectDetailPage.ts`**

```ts
import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ProjectDetailPageElements } from '../elements/ProjectDetailPage.elements';

export class ProjectDetailPage extends BasePage {
  readonly elements: ProjectDetailPageElements;

  constructor(page: Page) {
    super(page);
    this.elements = new ProjectDetailPageElements(page);
  }

  async switchToPortuguese(): Promise<void> {
    await this.languageLinkPt.click();
  }

  async getTitle(): Promise<string | null> {
    return this.elements.heading.textContent();
  }
}
```

- [ ] **Step 3: Write `tests/features/language-switch.feature`**

```gherkin
Feature: Language switch on a case study page

  Scenario: Switching language keeps the same case study, not the home page
    Given I start from the home page
    When I open the featured case study "Optimizing the Cypress test pipeline"
    And I switch the language to Portuguese
    Then I should land on the Portuguese case study "Otimizando o pipeline de testes Cypress"
```

Uses the two real, human-approved case studies from Fase 3 (`cypress-pipeline-optimization` / `otimizacao-pipeline-cypress`, `translationKey: "cypress-pipeline-optimization"`) — this is the exact pairing whose slugs deliberately diverge between pt/en, so this scenario exercises `resolveAltLocaleHref` (`src/utils/projectList.ts`), the Fase 3 fix for the language switcher.

- [ ] **Step 4: Write `tests/steps/language-switch.steps.ts`**

```ts
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';

const { Given, When, Then } = createBdd();

let homePage: HomePage;
let detailPage: ProjectDetailPage;

Given('I start from the home page', async ({ page }) => {
  homePage = new HomePage(page);
  await homePage.open('en');
});

When('I open the featured case study {string}', async ({ page }, title: string) => {
  await homePage.openFeaturedProject(title);
  detailPage = new ProjectDetailPage(page);
});

When('I switch the language to Portuguese', async () => {
  await detailPage.switchToPortuguese();
});

Then('I should land on the Portuguese case study {string}', async ({ page }, title: string) => {
  expect(await detailPage.getTitle()).toBe(title);
  await expect(page).toHaveURL(/\/pt\/projects\//);
});
```

The `Given` step text here ("I start from the home page") is deliberately different from `theme-toggle.steps.ts`'s "I am on the home page" — `playwright-bdd` (like Cucumber) requires step text to be globally unique across every `steps/*.ts` file, since all step files are loaded together regardless of which `.feature` uses them. Two different Given implementations with identical text would conflict at load time.

- [ ] **Step 5: Run the scenario**

Run: `npm run test:e2e -- --grep "Language switch"`
Expected: PASS, 1 scenario.

- [ ] **Step 6: Run the full e2e suite so far**

Run: `npm run test:e2e`
Expected: PASS, all scenarios from Tasks 2-4 green (5 scenarios total).

- [ ] **Step 7: Commit**

```bash
git add tests/elements/ProjectDetailPage.elements.ts tests/pages/ProjectDetailPage.ts tests/features/language-switch.feature tests/steps/language-switch.steps.ts
git commit -m "$(cat <<'EOF'
Adiciona ProjectDetailPage (POM) e o cenario de troca de idioma

Usa os dois case studies reais da Fase 3 (slugs pt/en divergentes de
proposito) pra confirmar que trocar de idioma numa pagina de detalhe
cai no case study traduzido, nao na home — cobre a correcao do
Header.astro feita na Fase 3.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `a11y.spec.ts`

**Files:**
- Create: `tests/a11y.spec.ts`

**Interfaces:**
- Consumes: `crawlSite` and `CrawlResult` (Task 2, from `tests/support/crawler.ts`).
- Produces: nothing consumed by later tasks — this is the last test file.

- [ ] **Step 1: Write `tests/a11y.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { crawlSite } from './support/crawler';

test('every discovered route has no serious accessibility violations', async ({ page, baseURL }) => {
  const { routes } = await crawlSite(page, baseURL ?? 'http://localhost:4321');

  for (const route of routes) {
    await page.goto(route.path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  }
});
```

This is a plain Playwright test, not a Gherkin scenario — spec §6.4.2 specifies `a11y.spec.ts` as "axe puro (não-Gherkin)". It runs its own crawl (rather than sharing `site-health.feature`'s result) because Playwright test files and `playwright-bdd`-generated specs don't share in-memory state across files; re-crawling here is cheap (the site is small) and keeps this file independent of the BDD step registry.

- [ ] **Step 2: Run it**

Run: `npm run test:e2e -- --grep "accessibility violations"`
Expected: PASS. If it fails, read the violation JSON in the failure output — it names the exact rule and the element selector — and fix the underlying markup in the relevant `.astro` file before re-running. Do not silence a real violation by narrowing the `withTags` filter or excluding a route.

- [ ] **Step 3: Run the entire e2e suite**

Run: `npm run test:e2e`
Expected: PASS, all 6 tests (5 BDD scenarios + this a11y spec).

- [ ] **Step 4: Commit**

```bash
git add tests/a11y.spec.ts
git commit -m "$(cat <<'EOF'
Adiciona a11y.spec.ts com axe em todas as rotas descobertas

Reusa o mesmo crawler de site-health.feature. Zero violacao
WCAG2A/WCAG2AA e o criterio de aceite.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Verificação final + demonstração do link quebrado

**Files:** none created or modified permanently — this task runs verification and a reversible demonstration.

**Interfaces:** none — this is the closing task for the phase, not a dependency of anything else.

- [ ] **Step 1: Rodar a suíte completa do zero**

Run: `npm run build && npm run test:unit && npm run test:e2e`
Expected: `build` limpo, `test:unit` com todos os testes verdes (os pré-existentes mais os 2 novos de `crawler.test.ts`), `test:e2e` com os 6 testes verdes.

- [ ] **Step 2: Demonstração reproduzível — quebrar um link real de propósito**

Esta etapa não cria um teste permanente (spec §6.4.1: não faz sentido commitar um link quebrado no histórico). É um procedimento manual, executado uma vez, como evidência de que o crawler realmente detecta um link morto.

Editar temporariamente `src/components/FeaturedProjects.astro`. A linha atual é:

```astro
<a class="see-all" href={locale === 'pt' ? '/pt/projects/' : '/projects/'}>
```

Trocar por uma rota que não existe, hardcoded (sem o ternário de idioma, só pra essa demonstração):

```astro
<a class="see-all" href="/projects-that-does-not-exist/">
```

- [ ] **Step 3: Rodar a suíte de site health e observar a falha**

Run: `npm run test:e2e -- --grep "Site health"`
Expected: FALHA — o cenário "No broken links are left behind" (ou "All internal routes resolve", dependendo de qual link a home ainda expõe) reporta o link/rota quebrado no corpo da mensagem de erro (`Broken links: [...]` ou `Routes that did not respond ok: [...]`), com o `href` inventado aparecendo explicitamente.

Guardar a saída do terminal dessa execução (colar no ledger da SDD/no relatório final da tarefa) como evidência da demonstração — não precisa virar arquivo no repositório.

- [ ] **Step 4: Reverter a quebra de propósito**

```bash
git checkout -- src/components/FeaturedProjects.astro
```

Confirmar que voltou ao original:

Run: `git status`
Expected: `nothing to commit, working tree clean` (ou equivalente, sem `FeaturedProjects.astro` modificado).

- [ ] **Step 5: Rodar a suíte inteira de novo pra confirmar que voltou a ficar verde**

Run: `npm run test:e2e`
Expected: PASS, 6 testes, incluindo os 2 cenários de `site-health.feature`.

- [ ] **Step 6: Nada para commitar nesta tarefa**

Esta tarefa não gera commit — a reversão do Step 4 já deixou a árvore de trabalho limpa. O relatório desta tarefa (ledger da SDD) deve registrar a saída do Step 3 como a evidência do critério de aceite da Fase 4 ("um teste falha de propósito quando um link é quebrado").
