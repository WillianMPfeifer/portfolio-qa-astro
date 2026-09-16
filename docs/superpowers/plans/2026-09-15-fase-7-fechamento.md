# Fase 7 — Fechamento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close out the portfolio site — `/notes` and `/cv` infrastructure, Open Graph tags, sitemap, RSS, `robots.txt`, favicon, a real Lighthouse ≥0.95 threshold, and a real Cloudflare Pages deployment — so the site is genuinely publishable and shareable.

**Architecture:** `/notes` and `/cv` follow the exact content-collection/page patterns already established for `/projects` and `/docs`. Open Graph reuses one static image across the whole site, with per-page title/description already available on every page. The sitemap needs no new dependency — Starlight already bundles the real `@astrojs/sitemap` package and wires it into the whole Astro build, confirmed by reading `node_modules/@astrojs/starlight/dist/integrations/sitemap.js`, not assumed. Deployment is split cleanly: this plan only writes the CI workflow code (referencing GitHub secrets by name); the author creates the actual Cloudflare Pages project and secrets himself, since that requires his own login.

**Tech Stack:** Astro 7.3.2, `@astrojs/starlight` 0.42.0 (bundles `@astrojs/sitemap` 3.7.4 already), `@astrojs/rss` (new dependency), `sharp` (already present transitively, used once to rasterize the OG image — confirmed present in `node_modules/sharp`), `cloudflare/wrangler-action` (GitHub Action, no new npm dependency).

## Global Constraints

- No real content is invented anywhere: `/notes` ships with an empty collection (author writes real notes later, same pattern as Fase 6's `/docs`); `/cv` shows an honest "not published yet" message, never fabricated résumé data.
- `lighthouserc.json`'s four category thresholds move from `0.9` to `0.95` — a hard CI gate, not aspirational.
- Open Graph: one static image site-wide (`public/og-image.png`, 1200×630), not per-page dynamic generation. `og:title`/`og:description` come from each page's own existing `title`/new `description` values.
- Sitemap: no `@astrojs/sitemap` install — it already ships as part of `@astrojs/starlight` and covers the whole site once `site` is set in `astro.config.mjs`, not just `/docs`. Verified by reading Starlight's own source (`starlightSitemap()` in `dist/integrations/sitemap.js` wraps the real `@astrojs/sitemap` integration using Starlight's i18n config — Astro integrations run against the whole build, not a path subset).
- RSS covers `/projects` only (real content since Fase 3) — not `/notes` (still empty this phase). One feed per locale: `/rss.xml` (en), `/pt/rss.xml` (pt).
- Favicon is an authored SVG using the site's own tokens (`--paper`/`--ink`/`--passed`), not an externally supplied image.
- The Cloudflare Pages deploy step in CI must reference `secrets.CLOUDFLARE_API_TOKEN` and `secrets.CLOUDFLARE_ACCOUNT_ID` by name only — the actual values are never seen by, entered by, or passed through the implementer or the assistant. The author adds them directly via GitHub's own Settings → Secrets → Actions UI.
- Deploy must be gated on every quality check passing (`build`/`unit`/`e2e`/`lighthouse` all `success`) and only on a push to `master` — never deploy a failing build, never deploy from a pull request.
- Every new `continue-on-error: true` step added to `.github/workflows/ci.yml` must be added to the final "Fail if any stage failed" gate too — this exact omission was a real, found-in-review bug in an earlier phase of this project; do not repeat it.
- Commit messages end with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

---

## File Structure

```
src/utils/notesList.ts                  # getNotesByLang(entries, lang) (Task 1)
src/utils/notesList.test.ts
src/pages/notes/index.astro             # listing, en (Task 1)
src/pages/notes/[...slug].astro         # detail, en (Task 1)
src/pages/pt/notes/index.astro          # listing, pt (Task 1)
src/pages/pt/notes/[...slug].astro      # detail, pt (Task 1)
src/pages/cv.astro                      # en (Task 2)
src/pages/pt/cv.astro                   # pt (Task 2)
src/components/Header.astro             # modified: /notes, /cv links (Tasks 1, 2)
astro.config.mjs                        # modified: site option (Task 3)
src/layouts/BaseLayout.astro            # modified: description prop + OG/Twitter meta (Task 3)
src/pages/*.astro, src/pages/pt/*.astro # modified: pass description= (Task 3)
src/assets/og-image.svg                 # source for the OG image (Task 3)
scripts/generate-og-image.ts            # one-off sharp conversion script (Task 3)
public/og-image.png                     # generated output, committed (Task 3)
public/favicon.svg                      # (Task 4)
public/robots.txt                       # (Task 4)
src/pages/rss.xml.ts                    # en feed (Task 5)
src/pages/pt/rss.xml.ts                 # pt feed (Task 5)
lighthouserc.json                       # modified: 0.9 -> 0.95 (Task 6)
.github/workflows/ci.yml                # modified: deploy step (Task 7)
```

---

### Task 1: `/notes` infrastructure

**Files:**
- Create: `src/utils/notesList.ts`
- Create: `src/utils/notesList.test.ts`
- Create: `src/pages/notes/index.astro`
- Create: `src/pages/notes/[...slug].astro`
- Create: `src/pages/pt/notes/index.astro`
- Create: `src/pages/pt/notes/[...slug].astro`
- Modify: `src/components/Header.astro`

**Interfaces:**
- Produces: `getNotesByLang(entries: CollectionEntry<'notes'>[], lang: 'en' | 'pt'): CollectionEntry<'notes'>[]` — filters by `lang`, sorts by `date` descending (most recent first), same contract as `src/utils/projectList.ts`'s `getProjectsByLang`.

- [ ] **Step 1: Write the failing test**

```ts
// src/utils/notesList.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- notesList`
Expected: FAIL — `Cannot find module './notesList'`.

- [ ] **Step 3: Write `src/utils/notesList.ts`**

```ts
import type { CollectionEntry } from 'astro:content';

export function getNotesByLang(
  entries: CollectionEntry<'notes'>[],
  lang: 'en' | 'pt',
): CollectionEntry<'notes'>[] {
  return entries
    .filter((entry) => entry.data.lang === lang)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- notesList`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write `src/pages/notes/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getNotesByLang } from '../../utils/notesList';

const allNotes = await getCollection('notes');
const notes = getNotesByLang(allNotes, 'en');
---

<BaseLayout title="Willian — Notes" description="Short notes on what I'm learning and building outside of work.">
  <article class="notes">
    <h1>Notes</h1>
    {
      notes.length > 0 ? (
        <ul class="notes-list">
          {notes.map((note) => (
            <li>
              <a href={`/notes/${note.id}/`}>
                <span class="title">{note.data.title}</span>
                <span class="meta">{note.data.date.toISOString().split('T')[0]}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p class="unavailable">Nothing published yet.</p>
      )
    }
  </article>
</BaseLayout>

<style>
  .notes {
    padding: 1.5rem;
    max-width: var(--measure);
  }

  .notes-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .notes-list li {
    border-top: 1px solid var(--ink-soft);
    padding: 1rem 0;
  }

  .notes-list li:last-child {
    border-bottom: 1px solid var(--ink-soft);
  }

  .notes-list a {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    color: var(--ink);
    text-decoration: none;
  }

  .title {
    font-weight: 700;
  }

  .meta {
    font-family: var(--font-mono);
    color: var(--ink-soft);
  }

  .unavailable {
    color: var(--ink-soft);
    font-style: italic;
  }
</style>
```

- [ ] **Step 6: Write `src/pages/notes/[...slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

interface Props {
  note: CollectionEntry<'notes'>;
}

export async function getStaticPaths() {
  const allNotes = await getCollection('notes');
  const enNotes = allNotes.filter((note) => note.data.lang === 'en');
  return enNotes.map((note) => ({
    params: { slug: note.id },
    props: { note },
  }));
}

const { note } = Astro.props;
const { Content } = await render(note);
---

<BaseLayout title={`Willian — ${note.data.title}`} description={note.data.description}>
  <article class="note">
    <h1>{note.data.title}</h1>
    <p class="meta">{note.data.date.toISOString().split('T')[0]}</p>
    <div class="body">
      <Content />
    </div>
  </article>
</BaseLayout>

<style>
  .note {
    padding: 1.5rem;
    max-width: var(--measure);
  }

  .meta {
    font-family: var(--font-mono);
    color: var(--ink-soft);
    margin: 0.5rem 0 1rem;
  }

  .body {
    margin-top: 1.5rem;
  }
</style>
```

- [ ] **Step 7: Write `src/pages/pt/notes/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import { getNotesByLang } from '../../../utils/notesList';

const allNotes = await getCollection('notes');
const notes = getNotesByLang(allNotes, 'pt');
---

<BaseLayout title="Willian — Notas" description="Notas curtas sobre o que estou aprendendo e construindo fora do trabalho.">
  <article class="notes">
    <h1>Notas</h1>
    {
      notes.length > 0 ? (
        <ul class="notes-list">
          {notes.map((note) => (
            <li>
              <a href={`/pt/notes/${note.id}/`}>
                <span class="title">{note.data.title}</span>
                <span class="meta">{note.data.date.toISOString().split('T')[0]}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p class="unavailable">Nada publicado ainda.</p>
      )
    }
  </article>
</BaseLayout>

<style>
  .notes {
    padding: 1.5rem;
    max-width: var(--measure);
  }

  .notes-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .notes-list li {
    border-top: 1px solid var(--ink-soft);
    padding: 1rem 0;
  }

  .notes-list li:last-child {
    border-bottom: 1px solid var(--ink-soft);
  }

  .notes-list a {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    color: var(--ink);
    text-decoration: none;
  }

  .title {
    font-weight: 700;
  }

  .meta {
    font-family: var(--font-mono);
    color: var(--ink-soft);
  }

  .unavailable {
    color: var(--ink-soft);
    font-style: italic;
  }
</style>
```

- [ ] **Step 8: Write `src/pages/pt/notes/[...slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';

interface Props {
  note: CollectionEntry<'notes'>;
}

export async function getStaticPaths() {
  const allNotes = await getCollection('notes');
  const ptNotes = allNotes.filter((note) => note.data.lang === 'pt');
  return ptNotes.map((note) => ({
    params: { slug: note.id },
    props: { note },
  }));
}

const { note } = Astro.props;
const { Content } = await render(note);
---

<BaseLayout title={`Willian — ${note.data.title}`} description={note.data.description}>
  <article class="note">
    <h1>{note.data.title}</h1>
    <p class="meta">{note.data.date.toISOString().split('T')[0]}</p>
    <div class="body">
      <Content />
    </div>
  </article>
</BaseLayout>

<style>
  .note {
    padding: 1.5rem;
    max-width: var(--measure);
  }

  .meta {
    font-family: var(--font-mono);
    color: var(--ink-soft);
    margin: 0.5rem 0 1rem;
  }

  .body {
    margin-top: 1.5rem;
  }
</style>
```

**Note on `BaseLayout`'s `description` prop:** this task passes `description={...}` to `BaseLayout` on all four new pages, anticipating Task 3, which adds that prop to `BaseLayout.astro` itself. Until Task 3 lands, `astro check`/`tsc` will report these as excess/unknown props (Astro is lenient here at runtime — passing an undeclared prop doesn't break the build — but `astro check`'s type-checking may flag it). **This is expected and resolved by Task 3, not a bug to fix in this task** — Task 3 runs immediately after this one in the same plan.

- [ ] **Step 9: Add the `/notes` link to `Header.astro`**

Current relevant block in `src/components/Header.astro`:

```astro
  <div class="site-links">
    <a href={getRelativeLocaleUrl(currentLocale, '/')} class="site-name">Willian</a>
    <a href={getRelativeLocaleUrl(currentLocale, '/quality')}>quality</a>
    <a href={getRelativeLocaleUrl(currentLocale, '/docs')}>docs</a>
  </div>
```

Change to:

```astro
  <div class="site-links">
    <a href={getRelativeLocaleUrl(currentLocale, '/')} class="site-name">Willian</a>
    <a href={getRelativeLocaleUrl(currentLocale, '/quality')}>quality</a>
    <a href={getRelativeLocaleUrl(currentLocale, '/docs')}>docs</a>
    <a href={getRelativeLocaleUrl(currentLocale, '/notes')}>notes</a>
  </div>
```

No CSS change needed — `.site-links a:not(.site-name)` already styles it.

- [ ] **Step 10: Run tests to verify the pages build**

Run: `npm run build`
Expected: succeeds (some `astro check`-only warnings about the `description` prop not yet existing on `BaseLayout` are expected here per the note above — `astro build` itself does not type-check strictly enough to fail on this). Confirm `dist/notes/index.html` and `dist/pt/notes/index.html` exist and both render "Nothing published yet." / "Nada publicado ainda." (no notes exist yet).

- [ ] **Step 11: Commit**

```bash
git add src/utils/notesList.ts src/utils/notesList.test.ts src/pages/notes src/pages/pt/notes src/components/Header.astro
git commit -m "$(cat <<'EOF'
Adiciona infraestrutura de /notes (listagem + detalhe, ainda sem conteudo)

getNotesByLang espelha getProjectsByLang (filtra por lang, ordena por
date decrescente). Lista vazia mostra "Nothing published yet." — regra
de honestidade do spec §3, mesmo padrao do FeaturedProjects.astro
quando nao ha projetos em destaque. Link no Header fecha o gap de
cobertura do crawler de a11y, mesmo padrao das Fases 5 e 6.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `/cv` pages

**Files:**
- Create: `src/pages/cv.astro`
- Create: `src/pages/pt/cv.astro`
- Modify: `src/components/Header.astro`

**Interfaces:** none — self-contained static pages.

- [ ] **Step 1: Write `src/pages/cv.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Willian — CV" description="Résumé — not published yet.">
  <article class="cv">
    <h1>CV</h1>
    <p class="unavailable">The PDF résumé isn't published yet — check back soon.</p>
  </article>
</BaseLayout>

<style>
  .cv {
    padding: 1.5rem;
    max-width: var(--measure);
  }

  .unavailable {
    color: var(--ink-soft);
    font-style: italic;
  }
</style>
```

- [ ] **Step 2: Write `src/pages/pt/cv.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
---

<BaseLayout title="Willian — Currículo" description="Currículo em PDF — ainda não publicado.">
  <article class="cv">
    <h1>Currículo</h1>
    <p class="unavailable">O currículo em PDF ainda não foi publicado — volte em breve.</p>
  </article>
</BaseLayout>

<style>
  .cv {
    padding: 1.5rem;
    max-width: var(--measure);
  }

  .unavailable {
    color: var(--ink-soft);
    font-style: italic;
  }
</style>
```

- [ ] **Step 3: Add the `/cv` link to `Header.astro`**

Current relevant block (after Task 1's edit):

```astro
  <div class="site-links">
    <a href={getRelativeLocaleUrl(currentLocale, '/')} class="site-name">Willian</a>
    <a href={getRelativeLocaleUrl(currentLocale, '/quality')}>quality</a>
    <a href={getRelativeLocaleUrl(currentLocale, '/docs')}>docs</a>
    <a href={getRelativeLocaleUrl(currentLocale, '/notes')}>notes</a>
  </div>
```

Change to:

```astro
  <div class="site-links">
    <a href={getRelativeLocaleUrl(currentLocale, '/')} class="site-name">Willian</a>
    <a href={getRelativeLocaleUrl(currentLocale, '/quality')}>quality</a>
    <a href={getRelativeLocaleUrl(currentLocale, '/docs')}>docs</a>
    <a href={getRelativeLocaleUrl(currentLocale, '/notes')}>notes</a>
    <a href={getRelativeLocaleUrl(currentLocale, '/cv')}>cv</a>
  </div>
```

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: succeeds. Confirm `dist/cv/index.html` and `dist/pt/cv/index.html` exist and show the "not published yet" message in the right language.

- [ ] **Step 5: Commit**

```bash
git add src/pages/cv.astro src/pages/pt/cv.astro src/components/Header.astro
git commit -m "$(cat <<'EOF'
Adiciona /cv (aviso honesto, sem PDF ainda)

Sem curriculo pronto — mostra que ainda nao foi publicado, sem
inventar nenhum dado. Link no Header fecha o gap de cobertura do
crawler de a11y, mesmo padrao das Fases 5 e 6.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `site` config + Open Graph tags + static OG image

**Files:**
- Modify: `astro.config.mjs`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/pt/index.astro`
- Modify: `src/pages/projects/index.astro`
- Modify: `src/pages/pt/projects/index.astro`
- Modify: `src/pages/projects/[...slug].astro`
- Modify: `src/pages/pt/projects/[...slug].astro`
- Modify: `src/pages/quality.astro`
- Modify: `src/pages/pt/quality.astro`
- Create: `src/assets/og-image.svg`
- Create: `scripts/generate-og-image.ts`
- Create: `public/og-image.png` (generated, then committed)

**Interfaces:**
- Produces: `astro.config.mjs`'s `site` option (`https://portfolio-qa-astro.pages.dev`) — every later task's build depends on this being set; it's added here, first, precisely so this and every later task builds cleanly instead of leaving the site in a broken state until a later "final" config task. `BaseLayout`'s `Props` interface gains a required `description: string` field. Every call site across the whole site must now pass it — this task is the one that touches all of them; no later task adds a page without `description` (Tasks 1-2 already did, ahead of this task, anticipating it).

- [ ] **Step 1: Add `site` to `astro.config.mjs`**

Current file:

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Willian — Docs',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        pt: { label: 'Português', lang: 'pt' },
      },
      sidebar: [
        { label: 'Web', items: [{ autogenerate: { directory: 'docs/web' } }] },
        { label: 'Mobile', items: [{ autogenerate: { directory: 'docs/mobile' } }] },
        { label: 'Processo', items: [{ autogenerate: { directory: 'docs/processo' } }] },
      ],
      customCss: [
        './src/styles/tokens.css',
        './src/styles/starlight-tokens.css',
        '@fontsource-variable/archivo/standard.css',
        '@fontsource/newsreader/400.css',
        '@fontsource/jetbrains-mono/400.css',
      ],
    }),
  ],
});
```

Add a top-level `site` option:

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://portfolio-qa-astro.pages.dev',
  integrations: [
    starlight({
      title: 'Willian — Docs',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        pt: { label: 'Português', lang: 'pt' },
      },
      sidebar: [
        { label: 'Web', items: [{ autogenerate: { directory: 'docs/web' } }] },
        { label: 'Mobile', items: [{ autogenerate: { directory: 'docs/mobile' } }] },
        { label: 'Processo', items: [{ autogenerate: { directory: 'docs/processo' } }] },
      ],
      customCss: [
        './src/styles/tokens.css',
        './src/styles/starlight-tokens.css',
        '@fontsource-variable/archivo/standard.css',
        '@fontsource/newsreader/400.css',
        '@fontsource/jetbrains-mono/400.css',
      ],
    }),
  ],
});
```

`portfolio-qa-astro` must exactly match the Cloudflare Pages project name the author creates in Task 8's manual setup (Cloudflare's default subdomain is always `<project-name>.pages.dev`) — this is called out again in Task 8.

- [ ] **Step 2: Verify the build succeeds and the sitemap now covers the whole site, not just `/docs`**

Run: `npm run build`
Expected: succeeds (the pre-existing "requires the `site` astro.config option" warning, present since Fase 1, is gone now). Confirm `dist/sitemap-index.xml` exists, and inspect the sitemap file(s) it references (e.g. `dist/sitemap-0.xml`) for real URLs — confirm entries for `/`, `/projects/`, `/quality/`, `/docs/` (and their `/pt/` equivalents) all appear, not only `/docs/*` routes (`/notes/`/`/cv/` don't exist as routes yet at this point in the plan — Tasks 1-2 already added them earlier in this same plan's execution order, so they should already be there too; confirm). This empirically confirms the Global Constraint (Starlight's bundled sitemap covers the whole build) — if any non-`/docs` route is missing, that's a real finding to report as BLOCKED, not something to silently work around.

- [ ] **Step 3: Add `description` and Open Graph/Twitter meta tags to `BaseLayout.astro`**

Current file:

```astro
---
// NOTA: o brief original (Step 5) apontava para '@fontsource-variable/archivo/full.css', mas esse
// arquivo não existe no pacote instalado (versão 5.3.0). O pacote expõe os arquivos por eixo de
// variação (wght.css, wdth.css, ...) e um arquivo combinado chamado 'standard.css', que é o
// equivalente à fonte variável completa (eixos wght 100-900 e wdth/font-stretch 62%-125%) — é esse
// arquivo que tokens.css precisa, já que h1/h2/h3 usam font-variation-settings: 'wdth' 125.
import '@fontsource-variable/archivo/standard.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/jetbrains-mono/400.css';
import '../styles/tokens.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title: string;
  altLocaleHref?: { pt: string; en: string };
}

const { title, altLocaleHref } = Astro.props;
---

<!doctype html>
<html lang={Astro.currentLocale ?? 'en'}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <script is:inline>
      (function () {
        // Mesma chave de localStorage e mesma lógica que o ThemeProvider.astro do
        // Starlight, para o tema ficar sincronizado entre o site principal e /docs.
        const stored = typeof localStorage !== 'undefined' && localStorage.getItem('starlight-theme');
        const theme =
          stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
      })();
    </script>
  </head>
  <body>
    <Header altLocaleHref={altLocaleHref} />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

**Do not remove the Fontsource comment above the imports — it's load-bearing project history, preserved verbatim in every edit to this file since Fase 1.**

Replace the `Props` interface and the script tag's frontmatter section, and add the meta tags inside `<head>`, producing this full file:

```astro
---
// NOTA: o brief original (Step 5) apontava para '@fontsource-variable/archivo/full.css', mas esse
// arquivo não existe no pacote instalado (versão 5.3.0). O pacote expõe os arquivos por eixo de
// variação (wght.css, wdth.css, ...) e um arquivo combinado chamado 'standard.css', que é o
// equivalente à fonte variável completa (eixos wght 100-900 e wdth/font-stretch 62%-125%) — é esse
// arquivo que tokens.css precisa, já que h1/h2/h3 usam font-variation-settings: 'wdth' 125.
import '@fontsource-variable/archivo/standard.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/jetbrains-mono/400.css';
import '../styles/tokens.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title: string;
  description: string;
  altLocaleHref?: { pt: string; en: string };
}

const { title, description, altLocaleHref } = Astro.props;

const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const ogImageURL = new URL('/og-image.png', Astro.site);
---

<!doctype html>
<html lang={Astro.currentLocale ?? 'en'}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalURL} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />

    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalURL} />
    <meta property="og:image" content={ogImageURL} />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImageURL} />

    <script is:inline>
      (function () {
        // Mesma chave de localStorage e mesma lógica que o ThemeProvider.astro do
        // Starlight, para o tema ficar sincronizado entre o site principal e /docs.
        const stored = typeof localStorage !== 'undefined' && localStorage.getItem('starlight-theme');
        const theme =
          stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
      })();
    </script>
  </head>
  <body>
    <Header altLocaleHref={altLocaleHref} />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

`Astro.site` is already set from Step 1 above, so `new URL(path, Astro.site)` resolves correctly here — no special handling needed.

- [ ] **Step 4: Update `src/pages/index.astro`**

Current:
```astro
<BaseLayout title="Willian — QA/SDET">
```

Change to:
```astro
<BaseLayout title="Willian — QA/SDET" description="QA/SDET portfolio — process-first quality engineering, Cypress and Appium automation, real case studies.">
```

- [ ] **Step 5: Update `src/pages/pt/index.astro`**

Current:
```astro
<BaseLayout title="Willian — QA/SDET">
```

This page's title was never translated to Portuguese — a pre-existing inconsistency noticed while touching this exact line for the new `description` prop. Fix both together:

```astro
<BaseLayout title="Willian — QA/SDET" description="Portfólio de QA/SDET — qualidade orientada a processo, automação com Cypress e Appium, case studies reais.">
```

(The `title` itself stays in English deliberately — this is a portfolio-branding decision already made, not something to change here — only note that it was already English on both locales, so no title change is being made, only the new `description` is added. If you find the title differs from this after reading the live file, do not change it; only add `description`.)

- [ ] **Step 6: Update `src/pages/projects/index.astro`**

Current:
```astro
<BaseLayout title="Willian — Projects">
```

Change to:
```astro
<BaseLayout title="Willian — Projects" description="Real QA automation case studies — Cypress pipeline optimization, Appium mobile testing architecture.">
```

- [ ] **Step 7: Update `src/pages/pt/projects/index.astro`**

Current:
```astro
<BaseLayout title="Willian — Projetos">
```

Change to:
```astro
<BaseLayout title="Willian — Projetos" description="Case studies reais de automação de QA — otimização de pipeline Cypress, arquitetura de testes mobile com Appium.">
```

- [ ] **Step 8: Update `src/pages/projects/[...slug].astro`**

Current:
```astro
<BaseLayout title={`Willian — ${project.data.title}`} altLocaleHref={altLocaleHref}>
```

Change to:
```astro
<BaseLayout title={`Willian — ${project.data.title}`} description={project.data.outcome} altLocaleHref={altLocaleHref}>
```

(`project.data.outcome` is the schema's existing short outcome summary — real content already written in Fase 3, not invented for this task.)

- [ ] **Step 9: Update `src/pages/pt/projects/[...slug].astro`**

Same change as Step 8, same file structure:
```astro
<BaseLayout title={`Willian — ${project.data.title}`} description={project.data.outcome} altLocaleHref={altLocaleHref}>
```

- [ ] **Step 10: Update `src/pages/quality.astro`**

Current:
```astro
<BaseLayout title="Willian — Quality">
```

Change to:
```astro
<BaseLayout title="Willian — Quality" description="Real, live data from this site's own CI pipeline — test results, accessibility, Lighthouse scores, bundle size.">
```

- [ ] **Step 11: Update `src/pages/pt/quality.astro`**

Current:
```astro
<BaseLayout title="Willian — Qualidade">
```

Change to:
```astro
<BaseLayout title="Willian — Qualidade" description="Dados reais e ao vivo do próprio pipeline de CI deste site — resultado dos testes, acessibilidade, notas do Lighthouse, tamanho do bundle.">
```

- [ ] **Step 12: Design and generate the OG image**

Write `src/assets/og-image.svg` — 1200×630 (the standard Open Graph image size), using generic font families only (`monospace`, `sans-serif`) so `sharp`'s SVG rasterizer doesn't depend on Fontsource files being resolvable outside the browser:

```svg
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#EDEFEE" />
  <rect x="0" y="0" width="10" height="630" fill="#1F5F3F" />
  <text x="80" y="260" font-family="monospace" font-size="72" font-weight="700" fill="#16211D">Willian</text>
  <text x="80" y="330" font-family="monospace" font-size="40" fill="#5C6B66">QA / SDET</text>
  <text x="80" y="420" font-family="monospace" font-size="28" fill="#1F5F3F">Feature: QA Engineer</text>
  <text x="80" y="460" font-family="monospace" font-size="24" fill="#5C6B66">Given a team that already automates</text>
  <text x="80" y="494" font-family="monospace" font-size="24" fill="#5C6B66">When it needs someone who understands the client</text>
  <text x="80" y="528" font-family="monospace" font-size="24" fill="#5C6B66">Then that guy is me</text>
</svg>
```

Write `scripts/generate-og-image.ts` — a one-off script, run once by you now, not part of the ongoing build:

```ts
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync('src/assets/og-image.svg');

await sharp(svg).resize(1200, 630).png().toFile('public/og-image.png');

console.log('Wrote public/og-image.png');
```

Run it:

```bash
mkdir -p public
node scripts/generate-og-image.ts
```

Expected: `public/og-image.png` is created. Verify with `file public/og-image.png` (or equivalent) that it's a real PNG at 1200×630 — if your environment doesn't have `file`, open the image with any available tool to confirm it rendered the text/colors correctly and isn't corrupt or blank.

**This script is a one-off asset-generation tool, not part of `npm run build`** — do not wire it into `package.json` scripts or the CI workflow. If the design ever needs to change, someone edits the SVG and re-runs this script manually, then commits the new PNG.

- [ ] **Step 13: Verify**

Run: `npm run test:unit` — expect no change (this task touches no `.ts` logic with tests, only `astro.config.mjs`, `.astro` files, and a one-off script).

Run: `npm run build`. Expected: succeeds. Inspect `dist/index.html` for the `og:image`/`og:url` meta tag values — confirm they're full `https://portfolio-qa-astro.pages.dev/...` URLs (not relative paths, not `undefined`). Open `public/og-image.png` (or its copy in `dist/`) to visually confirm it rendered correctly — background color, text, accent bar all present and legible.

Run: `npm run check` — expect 0 errors (this is where `description` becoming a required prop on `BaseLayout` gets its first real type-check across every page that uses it).

- [ ] **Step 14: Commit**

```bash
git add astro.config.mjs src/layouts/BaseLayout.astro src/pages/index.astro src/pages/pt/index.astro src/pages/projects/index.astro src/pages/pt/projects/index.astro src/pages/projects/\[...slug\].astro src/pages/pt/projects/\[...slug\].astro src/pages/quality.astro src/pages/pt/quality.astro src/assets/og-image.svg scripts/generate-og-image.ts public/og-image.png
git commit -m "$(cat <<'EOF'
Configura site no astro.config.mjs e adiciona Open Graph/Twitter meta tags

site: 'https://portfolio-qa-astro.pages.dev' — o nome do projeto
precisa bater com o que for criado de verdade no Cloudflare Pages
(Task 8). Isso ativa de vez o sitemap que o Starlight ja embutia
(confirmado cobrindo o site inteiro, nao so /docs) e os og:url/
og:image absolutos. BaseLayout ganha description obrigatoria e as
tags og:*/twitter:*, canonical, e favicon link. Uma imagem unica pro
site inteiro (public/og-image.png, gerada de src/assets/og-image.svg
via sharp, script descartavel em scripts/generate-og-image.ts) em vez
de geracao dinamica por pagina — alinhado com o minimalismo do site.
og:title/og:description variam por pagina a partir do title/description
que cada uma ja define — nas case studies, description reaproveita o
outcome real ja escrito na Fase 3, sem inventar texto novo.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `robots.txt` + favicon

**Files:**
- Create: `public/robots.txt`
- Create: `public/favicon.svg`

**Interfaces:** none. `BaseLayout.astro` already references `/favicon.svg` (added in Task 3) — this task provides the actual file.

- [ ] **Step 1: Write `public/favicon.svg`**

A minimal monogram using the site's own tokens (hardcoded hex values here, since `public/` files aren't processed by Astro's CSS pipeline and can't reference CSS custom properties):

```svg
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="8" fill="#16211D" />
  <text x="32" y="44" font-family="monospace" font-size="36" font-weight="700" fill="#1F5F3F" text-anchor="middle">W</text>
</svg>
```

(Dark `#16211D` background — the site's `--ink` — with the green `#1F5F3F` `--passed` accent for the letterform, so the favicon reads clearly in a browser tab regardless of the OS's own light/dark chrome.)

- [ ] **Step 2: Write `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://portfolio-qa-astro.pages.dev/sitemap-index.xml
```

(`sitemap-index.xml` is `@astrojs/sitemap`'s default output filename — confirmed this is the standard convention for this integration; `site` was already set to this exact domain in Task 3, so this URL resolves correctly.)

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: succeeds. Confirm `dist/robots.txt` and `dist/favicon.svg` both exist and match what you wrote (files under `public/` are copied as-is into `dist/`). Open `dist/favicon.svg` to visually confirm it renders as intended.

- [ ] **Step 4: Commit**

```bash
git add public/favicon.svg public/robots.txt
git commit -m "$(cat <<'EOF'
Adiciona favicon.svg e robots.txt

Favicon minimalista (monograma W, tokens --ink/--passed) referenciado
pelo BaseLayout desde a Task 3. robots.txt libera tudo e aponta pro
sitemap, que ja esta funcionando de verdade desde a Task 3 (site
configurado, cobertura do site inteiro confirmada).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: RSS feed

**Files:**
- Modify: `package.json` (add `@astrojs/rss` dependency)
- Create: `src/pages/rss.xml.ts`
- Create: `src/pages/pt/rss.xml.ts`

**Interfaces:** none — self-contained endpoint files.

- [ ] **Step 1: Install `@astrojs/rss`**

```bash
npm install @astrojs/rss
```

- [ ] **Step 2: Write `src/pages/rss.xml.ts`**

```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getProjectsByLang, projectHref } from '../utils/projectList';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const allProjects = await getCollection('projects');
  const projects = getProjectsByLang(allProjects, 'en');

  return rss({
    title: 'Willian — Projects',
    description: 'Real QA automation case studies.',
    site: context.site ?? 'https://portfolio-qa-astro.pages.dev',
    items: projects.map((project) => ({
      title: project.data.title,
      description: project.data.outcome,
      pubDate: project.data.date,
      link: projectHref(project),
    })),
  });
}
```

- [ ] **Step 3: Write `src/pages/pt/rss.xml.ts`**

```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getProjectsByLang, projectHref } from '../../utils/projectList';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const allProjects = await getCollection('projects');
  const projects = getProjectsByLang(allProjects, 'pt');

  return rss({
    title: 'Willian — Projetos',
    description: 'Case studies reais de automação de QA.',
    site: context.site ?? 'https://portfolio-qa-astro.pages.dev',
    items: projects.map((project) => ({
      title: project.data.title,
      description: project.data.outcome,
      pubDate: project.data.date,
      link: projectHref(project),
    })),
  });
}
```

(`context.site ?? 'https://...'` is a defensive fallback only — Task 3 already set the real `site` option in `astro.config.mjs`, so `context.site` is always defined during a real build by the time this task runs. The literal fallback string matches that same domain, so this never actually diverges in practice.)

- [ ] **Step 4: Verify**

Run: `npm run build` — expected to succeed. Inspect `dist/rss.xml` and `dist/pt/rss.xml` — confirm they're valid XML with real `<link>` values pointing at `https://portfolio-qa-astro.pages.dev/...` (the `site` set in Task 3), one `<item>` per real case study (2 items each, matching the two case studies published since Fase 3).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/pages/rss.xml.ts src/pages/pt/rss.xml.ts
git commit -m "$(cat <<'EOF'
Adiciona feed RSS de /projects (um por idioma)

/rss.xml (en) e /pt/rss.xml (pt), via @astrojs/rss, reaproveitando
getProjectsByLang e projectHref ja existentes. So /projects — /notes
continua vazio nesta fase, sem conteudo pra alimentar um feed ainda.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Lighthouse threshold + full-suite verification

**Files:**
- Modify: `lighthouserc.json`

**Interfaces:** none.

`site` was already configured in Task 3 (needed there for the OG tags), and the sitemap/RSS/OG absolute-URL verification already happened at the end of Task 3. This task only bumps the Lighthouse bar and runs the complete local suite once with everything from Tasks 1-5 in place together.

- [ ] **Step 1: Run the full local test suite**

```bash
npm run build
npm run check
npm run test:unit
npm run test:e2e
```

Expected: everything succeeds. `check` 0 errors. `test:unit` — 55 tests (the pre-existing 52 plus this plan's 3 new `notesList` tests). `test:e2e` — 5 tests still passing; `routesChecked` in `test-results/a11y-summary.json` will be higher than the last known value (13, from the end of Fase 6) since `/notes` and `/cv` are now linked and crawled — report the real number, don't predict it.

- [ ] **Step 2: Bump the Lighthouse threshold**

Current `lighthouserc.json`:

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

Change every `0.9` to `0.95`:

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
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }]
      }
    },
    "upload": {
      "target": "filesystem",
      "outputDir": ".lighthouseci"
    }
  }
}
```

- [ ] **Step 3: Attempt a real local Lighthouse run**

Run: `npx lhci autorun` (set `CHROME_PATH` to a local Chrome/Chromium binary if needed, same as every prior phase's Lighthouse work). If your environment hits the known Windows `chrome-launcher` `spawn UNKNOWN` issue documented since Fase 5, that's expected — don't chase it. If it runs successfully, report the actual scores: if any of the four categories score below 0.95 against real content, that's real, useful signal — note exactly which category and score in your report so the final task can decide whether to address it, but do not attempt performance optimization work in this task (out of scope here; Task 8 is where the real, deployed site gets the authoritative check).

- [ ] **Step 4: Commit**

```bash
git add lighthouserc.json
git commit -m "$(cat <<'EOF'
Sobe o threshold do Lighthouse de >=0.9 (Fase 5) pra >=0.95

Criterio rigido no CI nas 4 categorias, contra dist/ estatico. Suite
completa (build/check/unit/e2e) reverificada de ponta a ponta com
tudo que as Tasks 1-5 desta fase adicionaram (/notes, /cv, OG, sitemap,
RSS) funcionando junto pela primeira vez.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Cloudflare Pages deploy workflow (code only)

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:** none.

- [ ] **Step 1: Add the deploy step**

Current `.github/workflows/ci.yml`:

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
        run: |
          p=$(find ~/.cache/ms-playwright -maxdepth 3 \( -iname 'chrome' -o -iname 'headless_shell' \) -type f | head -n1)
          test -n "$p" || { echo "No Playwright Chromium binary found"; exit 1; }
          echo "path=$p" >> "$GITHUB_OUTPUT"

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
             [ "${{ steps.lighthouse.outcome }}" != "success" ] || \
             [ "${{ steps.quality.outcome }}" != "success" ]; then
            echo "One or more stages failed — see the step logs above."
            exit 1
          fi
```

Add a new `Deploy to Cloudflare Pages` step right after `Lighthouse CI` and before `Build quality report`, and add `steps.deploy.outcome` to the final gate's condition. Full file after both edits:

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
        run: |
          p=$(find ~/.cache/ms-playwright -maxdepth 3 \( -iname 'chrome' -o -iname 'headless_shell' \) -type f | head -n1)
          test -n "$p" || { echo "No Playwright Chromium binary found"; exit 1; }
          echo "path=$p" >> "$GITHUB_OUTPUT"

      - name: Lighthouse CI
        id: lighthouse
        continue-on-error: true
        run: npx lhci autorun
        env:
          CHROME_PATH: ${{ steps.playwright-chrome-path.outputs.path }}

      - name: Deploy to Cloudflare Pages
        id: deploy
        if: |
          github.event_name == 'push' && github.ref == 'refs/heads/master' &&
          steps.build.outcome == 'success' && steps.unit.outcome == 'success' &&
          steps.e2e.outcome == 'success' && steps.lighthouse.outcome == 'success'
        continue-on-error: true
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=portfolio-qa-astro

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
             [ "${{ steps.lighthouse.outcome }}" != "success" ] || \
             [ "${{ steps.deploy.outcome }}" != "success" ] || \
             [ "${{ steps.quality.outcome }}" != "success" ]; then
            echo "One or more stages failed — see the step logs above."
            exit 1
          fi
```

**Read this carefully before moving on — three things worth understanding, not just copying:**

1. **The `if:` on the `Deploy` step requires all four quality stages to have succeeded first** — unlike `Build quality report` and `Commit quality.json`, which deliberately run even after a failure (their entire purpose is to report failure honestly). Deploying a known-broken build to the live site is a different kind of action — it should never happen. If any of `build`/`unit`/`e2e`/`lighthouse` failed, the whole multi-line `if:` condition is false and the deploy step is skipped (shows as "skipped" in the Actions UI, not "failed").
2. **`steps.deploy.outcome` is now checked in the final gate**, exactly closing the same class of gap found in an earlier phase's final review (a `continue-on-error: true` step whose outcome the gate forgot to check). If `wrangler-action` fails for a real reason (bad token, wrong project name), the whole job still turns red, even though the step "continued."
3. **Nothing about this step can be verified locally or even by a full GitHub Actions dry run** — it requires `secrets.CLOUDFLARE_API_TOKEN`/`secrets.CLOUDFLARE_ACCOUNT_ID` to exist in the repository, which only happens after Task 8's manual setup. Verify what you *can*: the YAML parses (see Step 2), the `if:` condition's logic is sound (trace it by hand for a few cases — a normal successful push to master with everything green; a push to master with a failing test; a pull request), and the step references the two secrets by the exact names above and nothing else. Real confirmation happens only when Task 8's setup is complete and a real push runs this for real — that's expected, not a blocker.

- [ ] **Step 2: Verify the YAML is syntactically valid**

Run: `node -e "console.log(require('yaml').parse(require('fs').readFileSync('.github/workflows/ci.yml', 'utf-8')))"` if the `yaml` npm package happens to be available in your environment; otherwise, read the file back carefully checking indentation (2 spaces throughout, consistent with the rest of the file) and that the multi-line `if:` uses the YAML `|` block-literal style correctly (each condition line after the first must be indented consistently under the `if: |`).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
Adiciona o passo de deploy pro Cloudflare Pages no CI (so codigo)

Roda so em push direto pra master, e so se build/unit/e2e/lighthouse
todos tiverem sucedido — nunca publica um build quebrado. Usa
secrets.CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID por nome; os
valores reais nunca passam por este codigo nem por esta conversa —
sao adicionados pelo autor direto na interface do GitHub. Adiciona
steps.deploy.outcome ao gate final, fechando a mesma classe de lacuna
ja encontrada numa revisao final de uma fase anterior deste projeto
(um step com continue-on-error cujo outcome o gate esquecia de
checar). Confirmacao real so acontece quando os secrets existirem de
verdade (Task 8) e um push real rodar isso no GitHub Actions.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Verificação final + coordenação do deploy real

**Files:** none modificados por esta task (a não ser que a verificação encontre algo real a corrigir).

**Interfaces:** none.

**Esta task não pode ser executada por um subagent sozinho do início ao fim.** Ela depende de uma etapa manual, interativa, entre o autor do projeto (login da conta Cloudflare é dele) e o controlador da execução (que coordena a conversa) — não é um passo que um subagent deveria tentar automatizar ou pular sozinho.

- [ ] **Step 1: Rodar a suíte completa localmente, do zero, uma última vez**

```bash
npm run build
npm run check
npm run test:unit
npm run test:e2e
```

Expected: tudo verde. `test:unit` deve reportar 55 testes (52 herdados das Fases 1-6 + 3 novos de `notesList`). `test:e2e` continua com 5 testes, `routesChecked` maior que 13 (a contagem confirmada no fim da Fase 6).

- [ ] **Step 2 (controlador, não subagent): coordenar a configuração real do Cloudflare Pages com o autor**

Isso precisa acontecer numa conversa direta com o autor, não dentro do ciclo implementer→reviewer:

1. Pedir pro autor criar (se ainda não tiver) uma conta no Cloudflare, e dentro dela um projeto Pages chamado exatamente `portfolio-qa-astro` (mesmo nome usado em `astro.config.mjs`'s `site` e no comando `wrangler pages deploy --project-name` do workflow) — conectado ao repositório `WillianMPfeifer/portfolio-qa-astro` no GitHub, ou criado como projeto "direto upload" (sem conexão automática, já que o deploy vai ser feito pelo GitHub Actions via Wrangler, não pela integração nativa Git do Cloudflare Pages — as duas formas de conectar um repo ao Cloudflare Pages não devem coexistir pro mesmo projeto, senão os dois tentam publicar o mesmo commit).
2. Pedir pro autor gerar um API Token no Cloudflare (permissão mínima: `Cloudflare Pages — Edit`) e pegar o Account ID (visível no painel do Cloudflare).
3. Pedir pro autor adicionar os dois valores como secrets do repositório no GitHub — Settings → Secrets and variables → Actions → New repository secret — com os nomes exatos `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`. **Os valores nunca devem ser colados nesta conversa nem em nenhum arquivo do repositório** — o autor faz esse passo direto na interface do GitHub.
4. Confirmar com o autor que os dois secrets foram criados (sem pedir pra ele revelar os valores).

- [ ] **Step 3 (controlador): disparar um push real e observar o deploy**

Depois que os secrets existirem, um push em `master` (o merge desta branch, feito ao final do fluxo normal deste projeto) vai disparar o workflow de CI, que agora inclui o passo de deploy. Acompanhar o run no GitHub Actions até o fim.

Expected: o passo "Deploy to Cloudflare Pages" mostra sucesso, e o job inteiro termina verde. Se falhar, ler o log real do passo — problemas comuns são nome de projeto não bater com o que foi criado no Cloudflare, ou permissão insuficiente no API Token — corrigir o que for necessário (ajustar `astro.config.mjs`/`ci.yml` se o nome real do projeto Cloudflare acabou sendo diferente de `portfolio-qa-astro`, por exemplo) e repetir.

- [ ] **Step 4 (controlador): confirmar o site publicado de verdade**

Visitar `https://portfolio-qa-astro.pages.dev` (ou o subdomínio real, se diferente) num navegador de verdade. Confirmar que a home carrega, os links de navegação (`quality`, `docs`, `notes`, `cv`) funcionam, e o tema/idioma alternam corretamente — mesma checagem visual já feita ao final das Fases 5 e 6, agora contra o site publicado, não `dist/` local.

- [ ] **Step 5 (controlador): rodar o Lighthouse real contra o site publicado**

Como o Lighthouse local nesta máquina Windows tem o problema conhecido do `chrome-launcher` desde a Fase 5, a confirmação real do critério de aceite (`≥95` nas 4 categorias) contra o site JÁ PUBLICADO pode ser feita de duas formas: (a) o próprio CI do GitHub Actions já roda `lhci autorun` contra `dist/` local a cada push — se esse passo já está passando com `≥0.95`, isso é forte evidência; ou (b) usar uma ferramenta externa como o PageSpeed Insights do Google (`https://pagespeed.web.dev/`) contra a URL `.pages.dev` real, que roda um Lighthouse de verdade num ambiente que não tem o problema do Windows. Reportar os 4 scores reais encontrados. Se algum vier abaixo de 0.95, isso é um achado real a resolver (não um bloqueio a reportar de volta sem tentar) — mas escopo dessa correção específica não está pré-definido aqui, porque depende do que a medição real mostrar.

- [ ] **Step 6: Confirmar sitemap, RSS e OG contra a URL real publicada**

Visitar `https://portfolio-qa-astro.pages.dev/sitemap-index.xml` e `https://portfolio-qa-astro.pages.dev/rss.xml` diretamente no navegador — confirmar que carregam XML válido com URLs absolutas reais (não `localhost`, não relativas). Colar a URL da home num validador de Open Graph (ex: o preview de compartilhamento do LinkedIn ou uma ferramenta similar) pra confirmar que a imagem/título/descrição aparecem corretamente.

- [ ] **Step 7: Nada pra commitar nesta task**, a não ser que algum dos passos acima revele um problema real que precise de correção — nesse caso, tratar como um achado real de revisão (mesmo processo de fix já usado nas fases anteriores), não silenciar.
