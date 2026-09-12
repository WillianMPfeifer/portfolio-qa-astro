# Fase 2 — Home e o bloco Gherkin — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o placeholder da home (`/` e `/pt/`) por um hero com o cenário Gherkin animado (CSS puro, sem JS), uma seção de projetos em destaque lendo da collection `projects`, e um rodapé com os links de contato — mantendo o site responsivo até 360px e totalmente legível com JS desligado.

**Architecture:** Três componentes novos (`GherkinHero`, `FeaturedProjects`, `Footer`), um arquivo de dados (`src/data/hero.ts`) e um utilitário puro e testável (`src/utils/featuredProjects.ts`) que isola a lógica de filtro/ordenação de projetos da consulta Astro em si. `Footer` entra no `BaseLayout` (não só nas páginas de home) para ficar disponível em qualquer página futura do site principal, do mesmo jeito que `Header` já funciona hoje — evita que cada fase futura (Fase 3 `/projects`, Fase 7 `/notes`/`/cv`) precise lembrar de adicionar o rodapé de novo. Ver [spec, §6.2](../specs/2026-09-10-portfolio-astro-design.md) para o design completo aprovado (texto do hero em pt/en, regras da animação, comportamento de lista vazia, links do rodapé).

**Tech Stack:** Astro 7 (Content Collections via `astro:content`), Vitest (testes unitários do utilitário de seleção de projetos e do conteúdo do hero), CSS puro com custom properties (sem biblioteca de animação).

## Global Constraints

- TypeScript strict — já configurado no projeto, nenhum arquivo novo pode introduzir erro de tipo.
- Gerenciador de pacotes: npm. Nenhuma dependência nova precisa ser instalada nesta fase.
- Zero JavaScript no cliente para a animação do hero — CSS puro (`@keyframes` + `animation-delay`), respeitando `prefers-reduced-motion: reduce` (spec §4, §6.2.2). O conteúdo do hero deve estar completo no HTML enviado pelo servidor, nunca dependente de script pra aparecer.
- Sem Tailwind, sem biblioteca de animação — CSS puro com custom properties, usando os tokens já definidos em `src/styles/tokens.css` (spec §2, §4).
- Regra de honestidade: nenhum conteúdo inventado ou placeholder. Se a collection `projects` não tiver nenhum item com `featured: true` no idioma da rota, a seção de projetos em destaque não renderiza nada — nem título, nem aviso de "em breve" (spec §3, §6.2.2).
- Regra de estilo de texto (decidida nesta fase, vale daqui pra frente): nunca usar travessão como pausa dramática no meio de frase em texto novo do site — é um tique de escrita gerada por IA. Usar vírgula, ponto, ou reestruturar a frase. Os textos do hero desta fase (§6.2.1 do spec) já seguem essa regra — não alterá-los ao implementar.
- Git: repositório já inicializado, sem restrição — commitar normalmente ao final de cada task (a restrição "nenhum comando git" do plano da Fase 1 foi superada depois que a fase terminou; não se aplica aqui).

**Critério de aceite da fase (spec §6, Fase 2):** animação do hero roda uma vez e some com
`prefers-reduced-motion: reduce`; conteúdo da home legível com JS desligado; layout responsivo até
360px de largura.

---

### Task 1: Conteúdo do hero em `src/data/hero.ts`

**Files:**
- Create: `src/data/hero.ts`
- Create: `src/data/hero.test.ts`

**Interfaces:**
- Consumes: nada (primeira task da fase).
- Produces: `export interface HeroContent { scenarioTitle: string; given: string; when: string; then: string; prose: string }` e `export const hero: Record<'en' | 'pt', HeroContent>` — Task 2 importa `hero` e o tipo `HeroContent` deste arquivo.

- [ ] **Step 1: Escrever o teste do conteúdo do hero (vai falhar — o arquivo ainda não existe)**

`src/data/hero.test.ts`:

```ts
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
```

Nota sobre a regra de nunca usar travessão como pausa dramática (Global Constraints): ela **não** virou
um teste automatizado de propósito. A prosa aprovada no spec §6.2.1 usa um travessão antes da cláusula de
fechamento (`"...na hora certa — isso não."`) — um uso estrutural válido, diferente do que foi rejeitado
(`"à frente da qualidade — manual e Cypress..."`, uma pausa no meio da frase). A diferença entre os dois
usos é de julgamento humano, não um padrão que um regex distingue de forma confiável — uma tentativa de
regex simples (tipo "letra minúscula, travessão, letra minúscula") pegaria os dois casos igual, incluindo
o uso já aprovado, e quebraria o teste à toa. A regra fica só como diretriz de estilo pra revisão humana
de texto novo, não como assert automatizado.

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm run test:unit -- hero`
Expected: FAIL — `Cannot find module './hero'` (o arquivo ainda não existe).

- [ ] **Step 3: Criar o conteúdo do hero**

`src/data/hero.ts`:

```ts
export interface HeroContent {
  scenarioTitle: string;
  given: string;
  when: string;
  then: string;
  prose: string;
}

export const hero: Record<'en' | 'pt', HeroContent> = {
  en: {
    scenarioTitle: 'a team that already automates needs backup',
    given:
      'a year and a half leading quality, manual testing and Cypress automation across three modules, and a two-person team',
    when: 'a team already has an automation process and needs someone who understands the client and adjusts whatever needs adjusting',
    then: 'that guy is me',
    prose:
      "Tests, an AI can write. Understanding the team and the client, adjusting for them, and bringing the right tool at the right time — that, it can't.",
  },
  pt: {
    scenarioTitle: 'time que já automatiza busca reforço',
    given:
      'um ano e meio à frente da qualidade, manual e Cypress em três módulos, e um time de duas pessoas',
    when: 'um time já tem processo de automação e precisa de alguém que entenda o cliente e ajuste o que for preciso',
    then: 'esse cara sou eu',
    prose:
      'Testes uma IA escreve. Entender o time e o cliente, ajustar pra eles, e trazer a ferramenta certa na hora certa — isso não.',
  },
};
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm run test:unit -- hero`
Expected: PASS — 4 testes verdes (2 locales × 1 "campos preenchidos" + 2 punchline).

- [ ] **Step 5: Commit**

```bash
git add src/data/hero.ts src/data/hero.test.ts
git commit -m "Adiciona conteúdo do hero Gherkin (pt/en) para a Fase 2

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Componente `GherkinHero.astro` com a animação CSS

**Files:**
- Create: `src/components/GherkinHero.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/pt/index.astro`

**Interfaces:**
- Consumes: `hero`/`HeroContent` de `src/data/hero.ts` (Task 1).
- Produces: `GherkinHero` — componente Astro sem props (lê `Astro.currentLocale`, mesmo padrão do
  `Header.astro` da Fase 1) — Task 5 não depende diretamente dele, mas ele fica antes de
  `FeaturedProjects` na ordem visual da home (Task 3 monta essa ordem nas páginas).

- [ ] **Step 1: Criar o componente GherkinHero**

`src/components/GherkinHero.astro`:

```astro
---
import { hero } from '../data/hero';

const locale = (Astro.currentLocale ?? 'en') as 'en' | 'pt';
const content = hero[locale];
---

<section class="hero" aria-label="QA Engineer scenario">
  <div class="gherkin">
    <p class="feature">Feature: QA Engineer</p>
    <p class="scenario">Scenario: {content.scenarioTitle}</p>
    <p class="line line-given"><span class="keyword">Given</span> {content.given}</p>
    <p class="line line-when"><span class="keyword">When</span> {content.when}</p>
    <p class="line line-then"><span class="keyword">Then</span> {content.then}</p>
  </div>
  <p class="prose">{content.prose}</p>
</section>

<style>
  .hero {
    padding: 2rem 1.5rem;
  }

  .gherkin {
    border-left: 3px solid var(--passed);
    padding: 1rem 1.25rem;
    max-width: var(--measure);
  }

  .feature,
  .scenario {
    margin: 0 0 0.5rem;
    color: var(--ink-soft);
  }

  .line {
    margin: 0.35rem 0;
  }

  .keyword {
    font-weight: 700;
    color: var(--passed);
    margin-right: 0.5ch;
  }

  .prose {
    max-width: var(--measure);
    margin-top: 1.25rem;
    color: var(--ink-soft);
  }

  @keyframes reveal-line {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .line-given,
  .line-when,
  .line-then {
    animation: reveal-line 0.35s ease-out both;
  }

  .line-given {
    animation-delay: 0s;
  }

  .line-when {
    animation-delay: 0.25s;
  }

  .line-then {
    animation-delay: 0.5s;
  }

  @media (prefers-reduced-motion: reduce) {
    .line-given,
    .line-when,
    .line-then {
      animation: none;
    }
  }
</style>
```

Nota de por que isso satisfaz "legível com JS desligado": as três linhas (`Given`/`When`/`Then`) já
existem no HTML gerado pelo servidor com o texto completo — a animação CSS só anima a opacidade/posição
de algo que já está no DOM, nunca insere o texto via script. Com JS desligado, o HTML e o CSS chegam do
mesmo jeito (CSS não depende de JS pra rodar), então a única diferença é que a animação ainda acontece
(CSS puro roda sem JavaScript) — o conteúdo é idêntico e legível em ambos os casos.

- [ ] **Step 2: Usar o componente na home em inglês**

`src/pages/index.astro` (substitui o placeholder do Task 5 da Fase 1):

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import GherkinHero from '../components/GherkinHero.astro';
---

<BaseLayout title="Willian — QA/SDET">
  <GherkinHero />
</BaseLayout>
```

- [ ] **Step 3: Usar o componente na home em português**

`src/pages/pt/index.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import GherkinHero from '../../components/GherkinHero.astro';
---

<BaseLayout title="Willian — QA/SDET">
  <GherkinHero />
</BaseLayout>
```

- [ ] **Step 4: Rodar o build e verificar o texto de fechamento em inglês**

Run: `npm run build && grep -o "that guy is me" dist/index.html`
Expected: imprime `that guy is me`, sem erro de build antes disso.

- [ ] **Step 5: Verificar o texto de fechamento em português**

Run: `grep -o "esse cara sou eu" dist/pt/index.html`
Expected: imprime `esse cara sou eu`.

- [ ] **Step 6: Verificar que a regra de `prefers-reduced-motion` está no CSS gerado**

Run: `grep -rl "prefers-reduced-motion" dist/_astro/*.css`
Expected: imprime o caminho de pelo menos um arquivo CSS (a regra foi incluída no bundle).

- [ ] **Step 7: Rodar a checagem de tipos**

Run: `npm run check`
Expected: `0 errors`.

- [ ] **Step 8: Commit**

```bash
git add src/components/GherkinHero.astro src/pages/index.astro src/pages/pt/index.astro
git commit -m "Adiciona o hero animado com o cenário Gherkin na home

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Seção de projetos em destaque (`FeaturedProjects.astro`)

**Files:**
- Create: `src/utils/featuredProjects.ts`
- Create: `src/utils/featuredProjects.test.ts`
- Create: `src/components/FeaturedProjects.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/pt/index.astro`

**Interfaces:**
- Consumes: `projectSchema`/`Project` de `src/schemas/project.ts` (Fase 1, Task 3); collection
  `projects` registrada em `src/content.config.ts` (Fase 1).
- Produces: `export function selectFeaturedProjects(entries: CollectionEntry<'projects'>[], lang: 'en' |
  'pt'): CollectionEntry<'projects'>[]` de `src/utils/featuredProjects.ts` — filtra por
  `featured === true` e `lang`, ordena por `date` decrescente (mais recente primeiro). `FeaturedProjects`
  — componente Astro sem props, usado depois de `GherkinHero` nas páginas de home.

A lógica de filtro/ordenação fica isolada num utilitário puro (não dentro do `.astro`) porque é a única
parte desta task que vale a pena testar de forma unitária de verdade — o resto é template Astro, que a
Fase 4 (Playwright) vai exercitar via build real.

- [ ] **Step 1: Escrever o teste do utilitário (vai falhar — o arquivo ainda não existe)**

`src/utils/featuredProjects.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { selectFeaturedProjects } from './featuredProjects';
import type { CollectionEntry } from 'astro:content';

function makeEntry(overrides: Partial<CollectionEntry<'projects'>['data']>): CollectionEntry<'projects'> {
  return {
    id: overrides.translationKey ?? 'placeholder',
    collection: 'projects',
    data: {
      title: 'Placeholder',
      role: 'QA Engineer',
      period: '2024',
      date: new Date('2024-01-01'),
      stack: [],
      problem: '',
      outcome: '',
      featured: true,
      lang: 'en',
      translationKey: 'placeholder',
      ...overrides,
    },
  } as unknown as CollectionEntry<'projects'>;
}

describe('selectFeaturedProjects', () => {
  it('returns an empty array when there are no entries', () => {
    expect(selectFeaturedProjects([], 'en')).toEqual([]);
  });

  it('excludes entries where featured is false', () => {
    const entries = [makeEntry({ translationKey: 'a', featured: false })];
    expect(selectFeaturedProjects(entries, 'en')).toEqual([]);
  });

  it('excludes entries in a different language', () => {
    const entries = [makeEntry({ translationKey: 'a', lang: 'pt' })];
    expect(selectFeaturedProjects(entries, 'en')).toEqual([]);
  });

  it('includes only featured entries matching the requested language', () => {
    const match = makeEntry({ translationKey: 'a', featured: true, lang: 'en' });
    const wrongLang = makeEntry({ translationKey: 'b', featured: true, lang: 'pt' });
    const notFeatured = makeEntry({ translationKey: 'c', featured: false, lang: 'en' });
    const result = selectFeaturedProjects([match, wrongLang, notFeatured], 'en');
    expect(result).toEqual([match]);
  });

  it('sorts matching entries by date, most recent first', () => {
    const older = makeEntry({ translationKey: 'old', date: new Date('2023-01-01') });
    const newer = makeEntry({ translationKey: 'new', date: new Date('2024-06-01') });
    const result = selectFeaturedProjects([older, newer], 'en');
    expect(result.map((entry) => entry.id)).toEqual(['new', 'old']);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm run test:unit -- featuredProjects`
Expected: FAIL — `Cannot find module './featuredProjects'` (o arquivo ainda não existe).

- [ ] **Step 3: Criar o utilitário**

`src/utils/featuredProjects.ts`:

```ts
import type { CollectionEntry } from 'astro:content';

export function selectFeaturedProjects(
  entries: CollectionEntry<'projects'>[],
  lang: 'en' | 'pt',
): CollectionEntry<'projects'>[] {
  return entries
    .filter((entry) => entry.data.featured && entry.data.lang === lang)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm run test:unit -- featuredProjects`
Expected: PASS — 5 testes verdes.

- [ ] **Step 5: Criar o componente FeaturedProjects**

`src/components/FeaturedProjects.astro`:

```astro
---
import { getCollection } from 'astro:content';
import { selectFeaturedProjects } from '../utils/featuredProjects';

const locale = (Astro.currentLocale ?? 'en') as 'en' | 'pt';
const allProjects = await getCollection('projects');
const featured = selectFeaturedProjects(allProjects, locale);

const readCaseLabel = locale === 'pt' ? 'leia o caso' : 'read the case';
const sectionTitle = locale === 'pt' ? 'Projetos' : 'Projects';
---

{
  featured.length > 0 && (
    <section class="featured-projects" aria-label={sectionTitle}>
      <h2>{sectionTitle}</h2>
      <ul>
        {featured.map((project) => (
          <li>
            <a href={project.data.url ?? '#'}>
              <span class="title">{project.data.title}</span>
              <span class="stack">{project.data.stack.join(' · ')}</span>
              <span class="cta">{readCaseLabel}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

<style>
  .featured-projects {
    padding: 1.5rem;
    max-width: var(--measure);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    border-top: 1px solid var(--ink-soft);
    padding: 1rem 0;
  }

  li:last-child {
    border-bottom: 1px solid var(--ink-soft);
  }

  li a {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.5rem;
    color: var(--ink);
    text-decoration: none;
  }

  .title {
    font-weight: 700;
  }

  .stack {
    color: var(--ink-soft);
    font-family: var(--font-mono);
    font-size: 0.85rem;
  }

  .cta {
    color: var(--ink-soft);
  }
</style>
```

Nota sobre `project.data.url ?? '#'`: o schema de `projects` (Fase 1, §5.2 do spec) não obriga `url` nem
`repo` — quando nenhum dos dois existir, o link real vai ser a própria página de detalhe do case study
(`/projects/[slug]`), que só existe a partir da Fase 3. Por enquanto (Fase 2, sem case studies reais
ainda), `#` é um valor temporário que nunca aparece em produção porque a seção some quando não há
projetos featured — a Fase 3 troca isso pelo link real de detalhe ao construir `/projects/[slug]`.

- [ ] **Step 6: Usar o componente nas duas páginas de home**

`src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import GherkinHero from '../components/GherkinHero.astro';
import FeaturedProjects from '../components/FeaturedProjects.astro';
---

<BaseLayout title="Willian — QA/SDET">
  <GherkinHero />
  <FeaturedProjects />
</BaseLayout>
```

`src/pages/pt/index.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import GherkinHero from '../../components/GherkinHero.astro';
import FeaturedProjects from '../../components/FeaturedProjects.astro';
---

<BaseLayout title="Willian — QA/SDET">
  <GherkinHero />
  <FeaturedProjects />
</BaseLayout>
```

- [ ] **Step 7: Rodar o build e confirmar que a seção não aparece com a collection vazia (estado real de hoje)**

Run: `npm run build && grep -c "featured-projects" dist/index.html; grep -c "featured-projects" dist/pt/index.html`
Expected: os dois comandos imprimem `0` (nenhuma ocorrência — a `projects` collection está vazia hoje,
então a seção não deve aparecer em nenhuma das duas páginas).

- [ ] **Step 8: Criar um projeto de teste temporário pra confirmar o caminho "com projeto"**

Crie `src/content/projects/_temp-test.md` (o nome começa com `_` só como convenção de "não é conteúdo
real", mas o que importa de verdade é que ele **será apagado no Step 10**, antes do commit):

```md
---
title: 'Temp test project'
role: 'QA Engineer'
period: '2024'
date: 2024-01-01
stack: ['Cypress']
problem: 'Placeholder problem.'
outcome: 'Placeholder outcome.'
featured: true
lang: 'en'
translationKey: 'temp-test'
---

Placeholder body.
```

- [ ] **Step 9: Rodar o build de novo e confirmar que a seção aparece**

Run: `npm run build && grep -o "Temp test project" dist/index.html`
Expected: imprime `Temp test project` (a seção renderizou o projeto temporário).

- [ ] **Step 10: Apagar o projeto de teste temporário**

```bash
rm src/content/projects/_temp-test.md
```

Este arquivo existiu só pra validar o Step 9 — **não deve ir para o commit**. Confirme com `git status`
que `src/content/projects/` está vazio de novo antes do Step 11.

- [ ] **Step 11: Rodar o build uma última vez e confirmar que a seção sumiu de novo**

Run: `npm run build && grep -c "featured-projects" dist/index.html`
Expected: imprime `0`.

- [ ] **Step 12: Rodar a checagem de tipos e os testes unitários**

Run: `npm run check && npm run test:unit`
Expected: `check` com `0 errors`; `test:unit` com todos os testes verdes (11 da Fase 1 + 4 do Task 1 + 5
deste task = 20).

- [ ] **Step 13: Commit**

```bash
git add src/utils/featuredProjects.ts src/utils/featuredProjects.test.ts src/components/FeaturedProjects.astro src/pages/index.astro src/pages/pt/index.astro
git status
git commit -m "Adiciona a seção de projetos em destaque na home

Some por completo quando a collection projects não tem nenhum item
featured no idioma da rota — nenhum placeholder ou aviso de 'em breve',
seguindo a regra de honestidade do spec.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

O `git status` do Step 13 é uma checagem deliberada: confirme que `src/content/projects/_temp-test.md`
não aparece na lista antes de rodar o `git add`/`commit` — se aparecer, volte ao Step 10.

---

### Task 4: Rodapé (`Footer.astro`)

**Files:**
- Create: `src/components/Footer.astro`
- Modify: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes: nada de tasks anteriores desta fase.
- Produces: `Footer` — componente Astro sem props, montado dentro do `BaseLayout` (não só nas páginas de
  home) para aparecer em qualquer página futura do site principal automaticamente.

- [ ] **Step 1: Criar o componente Footer**

`src/components/Footer.astro`:

```astro
---
const links = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/willian-menegazzo-pfeifer-22a62a2b4' },
  { label: 'Email', href: 'mailto:zepfeiferwillian@gmail.com' },
  { label: 'GitHub', href: 'https://github.com/WillianMPfeifer' },
  { label: 'Credly', href: 'https://www.credly.com/users/willian-menegazzo-pfeifer' },
];
---

<footer>
  <ul>
    {
      links.map((link) => (
        <li>
          <a href={link.href}>{link.label}</a>
        </li>
      ))
    }
  </ul>
</footer>

<style>
  footer {
    border-top: 1px solid var(--ink-soft);
    padding: 1.5rem;
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  a {
    color: var(--ink-soft);
    text-decoration: none;
  }

  a:hover {
    color: var(--ink);
  }
</style>
```

- [ ] **Step 2: Montar o Footer dentro do BaseLayout**

`src/layouts/BaseLayout.astro` — adicionar o import e a tag depois de `<slot />`, sem alterar mais nada
do arquivo:

```astro
---
import '@fontsource-variable/archivo/standard.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/jetbrains-mono/400.css';
import '../styles/tokens.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title: string;
}

const { title } = Astro.props;
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
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 3: Rodar o build e confirmar os quatro links nas duas páginas de home**

Run:
```bash
npm run build
grep -c "linkedin.com/in/willian-menegazzo-pfeifer-22a62a2b4" dist/index.html
grep -c "mailto:zepfeiferwillian@gmail.com" dist/index.html
grep -c "github.com/WillianMPfeifer" dist/index.html
grep -c "credly.com/users/willian-menegazzo-pfeifer" dist/index.html
grep -c "linkedin.com/in/willian-menegazzo-pfeifer-22a62a2b4" dist/pt/index.html
```
Expected: cada comando imprime `1` (cada link aparece exatamente uma vez em cada página verificada).

- [ ] **Step 4: Confirmar que `/docs` continua sem o Footer novo (ele usa o layout do Starlight, não o BaseLayout)**

Run: `grep -c "credly.com" dist/docs/index.html`
Expected: imprime `0` — `/docs` é renderizado pelo Starlight (layout próprio dele, não o `BaseLayout`
deste projeto), então o `Footer` novo não aparece lá. Isso é esperado e correto: o compartilhamento de
header/tokens entre o site principal e `/docs` é uma pendência já registrada pra Fase 6 (spec §6, nota
"Pendência herdada da Fase 1"), o rodapé não faz parte disso.

- [ ] **Step 5: Rodar a checagem de tipos**

Run: `npm run check`
Expected: `0 errors`.

- [ ] **Step 6: Commit**

```bash
git add src/components/Footer.astro src/layouts/BaseLayout.astro
git commit -m "Adiciona o rodapé (LinkedIn, Email, GitHub, Credly) ao BaseLayout

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Medida de linha, responsividade a 360px e verificação final da Fase 2

**Files:**
- Modify: `src/styles/tokens.css`

**Interfaces:**
- Consumes: `--measure` (já definido em `tokens.css` desde a Fase 1, mas sem nenhum seletor usando ele
  até agora — achado pendente da revisão final da Fase 1).
- Produces: nada consumido por tasks futuras — esta é a última task da fase.

- [ ] **Step 1: Aplicar a medida de linha ao conteúdo principal**

`src/styles/tokens.css` — adicionar ao final do arquivo (não remover nada do que já existe):

```css
main {
  padding-inline: 1rem;
}
```

Nota: `GherkinHero` e `FeaturedProjects` (Tasks 2 e 3) já aplicam `max-width: var(--measure)` nos seus
próprios blocos de texto — esta regra global cuida só do respiro lateral em telas estreitas, pra nenhum
texto colar na borda da viewport.

- [ ] **Step 2: Rodar o build e o servidor de preview pra checagem manual de responsividade**

Run: `npm run build && npm run preview`

Com o preview rodando, abra `http://localhost:4321/` (ou a porta que o comando imprimir) no navegador,
redimensione a janela (ou use o modo de dispositivo do DevTools) para 360px de largura, e confirme
visualmente: nenhum texto corta, nenhum elemento estoura a largura da tela, o header/hero/projetos/
rodapé continuam legíveis e sem scroll horizontal. Repita em `http://localhost:4321/pt/`. Pare o preview
(`Ctrl+C`) ao terminar.

Este é o único passo manual do plano — não existe automação de checagem visual até a Fase 4
(Playwright), então a confirmação visual aqui é a validação real do critério de aceite "responsivo até
360px".

- [ ] **Step 3: Confirmar que a home é legível com JavaScript desligado**

Run: `npm run build && grep -o "that guy is me" dist/index.html && grep -o "esse cara sou eu" dist/pt/index.html`
Expected: imprime as duas frases — elas já vieram prontas do Step 4/5 do Task 2, esta é só a
reconfirmação final de que nada nas Tasks 3-5 quebrou isso. Como o site é 100% estático (nenhum
componente usa hidratação de framework JS, só `<script is:inline>` pro tema, que não afeta o texto), o
HTML gerado é idêntico com ou sem JavaScript no navegador — não há passo adicional de "desligar JS" a
simular além de confirmar que o texto já está no HTML bruto, o que estes greps fazem.

- [ ] **Step 4: Rodar toda a suíte de verificação da fase**

Run: `npm run test:unit && npm run check && npm run build`
Expected: `test:unit` com 20 testes verdes (11 da Fase 1 + 4 do Task 1 + 5 do Task 3); `check` com `0
errors`; `build` sem erros, gerando `dist/index.html`, `dist/pt/index.html`, `dist/docs/index.html` e
`dist/docs/pt/index.html` (as mesmas quatro rotas da Fase 1, sem regressão).

- [ ] **Step 5: Conferir o critério de aceite da Fase 2 (spec §6)**

Nenhum comando novo — os Steps 2, 3 e 4 já cobrem, juntos, os três pontos do critério: animação roda uma
vez e some com `prefers-reduced-motion: reduce` (verificado no Task 2, Step 6, e reafirmado aqui por não
ter sido tocado desde então), conteúdo legível com JS desligado (Step 3 deste task), responsivo até
360px (Step 2 deste task, verificação manual).

- [ ] **Step 6: Commit**

```bash
git add src/styles/tokens.css
git commit -m "Aplica --measure ao main e fecha a verificação da Fase 2

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review

**Cobertura do spec:** conteúdo do hero pt/en (§6.2.1) → Task 1. Componentes `GherkinHero`,
`FeaturedProjects`, `Footer` e a mecânica de animação CSS pura (§6.2.2) → Tasks 2, 3, 4. Comportamento de
lista vazia sem placeholder (§6.2.2, regra de honestidade do §3) → Task 3, Steps 7-11. Os quatro links do
rodapé com URLs exatas (§6.2.2) → Task 4. Responsividade até 360px (critério de aceite da fase) → Task
5, Step 2. `--measure` (definido na Fase 1, sem uso até agora — achado da revisão final daquela fase) →
Task 5, Step 1.

**Placeholders:** nenhum "TBD"/"TODO" em nenhum step. O único arquivo temporário do plano
(`_temp-test.md` no Task 3) tem motivo técnico explícito, passo de criação e passo de remoção antes do
commit, com uma checagem de `git status` pra garantir que não vaza pro commit.

**Consistência de tipos:** `HeroContent`/`hero` (Task 1) usados sem variação de nome em Task 2.
`selectFeaturedProjects(entries: CollectionEntry<'projects'>[], lang: 'en' | 'pt')` (Task 3) — assinatura
usada de forma idêntica no teste (Step 1) e no componente (Step 5). `Astro.currentLocale ?? 'en'` como
`'en' | 'pt'` é o mesmo padrão em `GherkinHero` e `FeaturedProjects`, replicando o que `Header.astro` já
faz desde a Fase 1 (não introduz um terceiro jeito de detectar idioma).

**Nota sobre decisão de arquitetura não coberta literalmente pelo brainstorming:** o spec (§6.2.2)
descreve o `Footer` como parte da home, mas não diz explicitamente onde ele é montado no código. Este
plano monta o `Footer` dentro do `BaseLayout` (Task 4), não só nas páginas de home, para ficar disponível
em qualquer página futura do site principal sem esforço extra — mesmo padrão já usado pelo `Header` desde
a Fase 1. Isso não contradiz nada do spec (o rodapé aparece na home de qualquer jeito) e evita que Fases
3 e 7 precisem lembrar de adicionar rodapé às páginas novas que criarem.
