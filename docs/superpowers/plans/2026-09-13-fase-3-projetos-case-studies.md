# Fase 3 — Projetos e Case Studies — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar os dois case studies reais (mobile e web) em pt/en, com listagem em `/projects`, página de detalhe em `/projects/[slug]`, componente de stack sem violar a regra de "sem ponto do meio", navegação anterior/próximo, e corrigir o alternador de idioma pra funcionar com slugs pt/en divergentes via `translationKey`.

**Architecture:** Duas rotas novas por idioma (`/projects` e `/projects/[...slug]`, espelhadas em `/pt/projects` e `/pt/projects/[...slug]`), um componente `StackList` reutilizado pela listagem, pelo detalhe e pelo `FeaturedProjects` da Fase 2, um módulo de utilitários puro e testável (`src/utils/projectList.ts`) isolando toda a lógica de filtro/ordenação/navegação/idioma da camada de template Astro, e uma prop opcional nova em `Header`/`BaseLayout` que só entra em uso nas páginas de detalhe (todo o resto do site continua com o comportamento atual, sem mudança). Ver [spec, §6.3](../specs/2026-09-10-portfolio-astro-design.md) para o conteúdo completo aprovado dos dois case studies e o raciocínio da arquitetura.

**Tech Stack:** Astro 7 (Content Collections via `astro:content`, `render()` pra corpo de collection), Vitest (testes unitários do módulo de utilitários), CSS puro com custom properties.

## Global Constraints

- TypeScript strict, npm only, git commits normais (sem restrição).
- Regra de honestidade e de estilo: nenhum dado inventado; nenhum travessão como pausa dramática em texto novo; **nenhum "meta com ponto do meio" (ex: `A · B · C`)** — essa regra já foi violada uma vez sem querer no `FeaturedProjects.astro` da Fase 2 (`stack.join(' · ')`) e quase seria reintroduzida durante o brainstorming desta fase numa linha de meta "role · period" — usar vírgula (`role, period`) em vez de ponto do meio em qualquer lugar que precise combinar dois campos curtos.
- **Nenhuma seta `→`/`←` colada em link** (proibido no spec §4) — a navegação anterior/próximo usa só texto e posição espacial (anterior à esquerda, próximo à direita via `justify-content: space-between`), nunca um glifo de seta.
- Conteúdo dos dois case studies (pt/en) já está definido palavra por palavra no spec §6.3.1 — copiar exatamente, não parafrasear.
- `translationKey` liga as duas versões (pt/en) do mesmo projeto — os slugs de arquivo são **deliberadamente diferentes** entre pt/en (não espelhados), justamente pra provar que a correção do alternador de idioma funciona de verdade.
- Nenhum dos dois projetos tem `url`/`repo` (automação interna de cliente, sem site/repo público — spec §7).

**Critério de aceite da fase (spec §6, Fase 3):** build quebra se um projeto vier sem campo obrigatório — testado de propósito nesta fase (Task 1).

---

### Task 1: Conteúdo dos dois case studies + prova de que o build quebra sem campo obrigatório

**Files:**
- Create: `src/content/projects/cypress-pipeline-optimization.md` (en)
- Create: `src/content/projects/otimizacao-pipeline-cypress.md` (pt)
- Create: `src/content/projects/mobile-test-architecture-appium.md` (en)
- Create: `src/content/projects/arquitetura-testes-mobile-appium.md` (pt)
- Delete: `src/content/projects/.keep` (não é mais necessário — o diretório deixa de estar vazio)

**Interfaces:**
- Consumes: `projectSchema` (Fase 1, `src/schemas/project.ts`) — nenhuma mudança de schema nesta fase.
- Produces: 4 entradas reais na collection `projects`, consumidas por todas as tasks seguintes desta
  fase (listagem, detalhe, `FeaturedProjects`).

- [ ] **Step 1: Criar o case study "web" em inglês**

`src/content/projects/cypress-pipeline-optimization.md`:

```md
---
title: 'Optimizing the Cypress test pipeline'
role: 'QA Tester'
period: '2025'
date: 2025-03-01
stack: ['Cypress', 'JavaScript', 'Bitbucket Pipelines']
problem: 'Cypress suite was slow and barely running, taking ~2h to execute.'
outcome: 'Run time dropped to ~24 minutes (a ~80% reduction).'
featured: true
lang: 'en'
translationKey: 'cypress-pipeline-optimization'
---

## Context

A Cypress test suite existed but sat mostly idle, and took around 2 hours to run when it did.

## Problem

The slowness came from several causes: poorly sized memory/cache usage in the infrastructure,
validation functions running in loops, outdated business rules creating redundant checks, and a
general lack of optimization (static waits, UI-based login).

## Decisions

Adjusted infrastructure for memory and cache, reduced loop-based validation functions, updated
business rules to remove redundancy, replaced static waits with API interceptors, moved login to run
entirely through the API, and added a routine to clean up broken data before tests run. Upgraded
Cypress from version 6 to 13, which also brought more optimized test reporting.

## Outcome

Run time dropped from around 2 hours to around 24 minutes — roughly an 80% reduction.
```

- [ ] **Step 2: Criar o case study "web" em português**

`src/content/projects/otimizacao-pipeline-cypress.md`:

```md
---
title: 'Otimizando o pipeline de testes Cypress'
role: 'QA Tester'
period: '2025'
date: 2025-03-01
stack: ['Cypress', 'JavaScript', 'Bitbucket Pipelines']
problem: 'Suite Cypress lenta e praticamente parada, com ~2h de execução.'
outcome: 'Tempo de execução caiu para ~24 minutos (redução de ~80%).'
featured: true
lang: 'pt'
translationKey: 'cypress-pipeline-optimization'
---

## Contexto

Suite de testes Cypress existia mas ficava parada, sem rodar ativamente, e levava cerca de 2 horas
quando rodava.

## Problema

A lentidão vinha de várias causas: uso de memória e cache mal dimensionado na infraestrutura, funções
de validação rodando em loop, regras de negócio desatualizadas gerando redundância nos testes, e falta
geral de otimização (waits estáticos, login via UI).

## Decisões

Ajustou a infraestrutura pra memória/cache, reduziu funções em loop de validação, atualizou as regras
de negócio pra eliminar redundância, substituiu waits estáticos por interceptadores de API, passou o
login a ser feito totalmente via API, e adicionou uma rotina de limpeza de dados quebrados antes dos
testes. Atualizou o Cypress da versão 6 pra 13, o que também trouxe relatórios de teste mais
otimizados.

## Resultado

Tempo de execução caiu de cerca de 2 horas para cerca de 24 minutos — uma redução de aproximadamente
80%.
```

- [ ] **Step 3: Criar o case study "mobile" em inglês**

`src/content/projects/mobile-test-architecture-appium.md`:

```md
---
title: 'Mobile test architecture with Appium'
role: 'QA Tester'
period: '2025'
date: 2025-08-01
stack: ['Python', 'Appium', 'BDD']
problem: 'No mobile automation existed; every change required a full day of manual retesting.'
outcome: 'A working suite covering the main flows of the Education module.'
featured: true
lang: 'en'
translationKey: 'mobile-automation-appium'
---

## Context

No mobile automation existed. Every app change required a full manual regression test.

## Problem

A full manual retest took at least a full day of one person's time for every change. Automating
mobile also turned out to be slower than web — selecting elements was straightforward, but writing the
tests around them took much longer. The app has a sync function that pushes data to the web system,
and every test scenario had to trigger that sync and wait, adding extra time.

## Decisions

Chose Python for its development practicality and library ecosystem. Chose Appium for its wide
adoption and its fit with BDD, already part of the daily web automation workflow. For the sync
bottleneck, built a reusable BDD step that handles the tap-and-wait instead of repeating that logic in
every scenario.

## Outcome

A working automation suite covering the main flows of the Education module, with a reusable sync step
resolving the wait bottleneck across all scenarios.
```

- [ ] **Step 4: Criar o case study "mobile" em português**

`src/content/projects/arquitetura-testes-mobile-appium.md`:

```md
---
title: 'Arquitetura de testes mobile com Appium'
role: 'QA Tester'
period: '2025'
date: 2025-08-01
stack: ['Python', 'Appium', 'BDD']
problem: 'Nenhuma automação mobile existia; toda mudança exigia um dia inteiro de reteste manual.'
outcome: 'Suite funcional cobrindo os principais fluxos do módulo de Educação.'
featured: true
lang: 'pt'
translationKey: 'mobile-automation-appium'
---

## Contexto

Não existia automação mobile. Toda alteração no app exigia reteste manual completo.

## Problema

O reteste manual completo tomava pelo menos um dia inteiro de uma pessoa a cada mudança. Automatizar
mobile também se mostrou mais lento que web — selecionar elementos era tranquilo, mas desenvolver os
testes em cima deles levava bem mais tempo. O app tem uma função de sincronizar dados com o sistema
web, e cada cenário de teste precisava clicar em sincronizar e esperar, o que consumia tempo extra.

## Decisões

Python pela praticidade de desenvolvimento e disponibilidade de bibliotecas. Appium por ser amplamente
usado e combinar bem com BDD, que já fazia parte do dia a dia com automação web. Para o problema de
sincronização, criou um passo reutilizável no BDD que já cuida do clique e da espera, em vez de
repetir essa lógica em cada cenário.

## Resultado

Suite de automação funcional cobrindo os principais fluxos do módulo de Educação, com um passo
reutilizável de sincronização resolvendo o gargalo de espera em todos os cenários.
```

- [ ] **Step 5: Remover o `.keep`, que não é mais necessário**

```bash
git rm src/content/projects/.keep
```

- [ ] **Step 6: Rodar o build e confirmar que os 4 projetos entram sem erro**

Run: `npm run build`
Expected: build sem erros (as 4 entradas passam na validação do `projectSchema`).

- [ ] **Step 7: Provar o critério de aceite da fase — criar um projeto inválido temporário**

Crie `src/content/projects/_temp-invalid.md` (o nome com `_` sinaliza que é temporário — **será
apagado no Step 9**, antes do commit), faltando o campo obrigatório `outcome` de propósito:

```md
---
title: 'Projeto inválido de teste'
role: 'QA Tester'
period: '2025'
date: 2025-01-01
stack: ['Test']
problem: 'Teste de validação de schema.'
featured: false
lang: 'pt'
translationKey: 'temp-invalid'
---

Corpo de teste.
```

- [ ] **Step 8: Rodar o build e confirmar que ele quebra**

Run: `npm run build`
Expected: build **falha** com um erro de validação do Zod mencionando o campo `outcome` ausente em
`_temp-invalid.md` (ou caminho equivalente do arquivo). Esse é o critério de aceite da Fase 3 sendo
comprovado de propósito.

- [ ] **Step 9: Apagar o projeto inválido temporário**

```bash
rm src/content/projects/_temp-invalid.md
```

Confirme com `git status` que `_temp-invalid.md` não aparece antes do Step 11 — esse arquivo nunca deve
ir pro commit.

- [ ] **Step 10: Rodar o build de novo e confirmar que volta a passar**

Run: `npm run build`
Expected: build sem erros de novo, com as 4 entradas reais intactas.

- [ ] **Step 11: Commit**

```bash
git add src/content/projects/cypress-pipeline-optimization.md src/content/projects/otimizacao-pipeline-cypress.md src/content/projects/mobile-test-architecture-appium.md src/content/projects/arquitetura-testes-mobile-appium.md
git status
git commit -m "Adiciona os dois case studies reais (mobile e web) em pt/en

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

O `git status` antes do commit é uma checagem deliberada — confirme que nem `.keep` nem
`_temp-invalid.md` aparecem na lista (o primeiro já foi removido com `git rm` no Step 5, então some
sozinho; o segundo nunca deve ter sido adicionado).

---

### Task 2: Utilitário puro `src/utils/projectList.ts` (filtro, ordenação, navegação, idioma)

**Files:**
- Create: `src/utils/projectList.ts`
- Create: `src/utils/projectList.test.ts`

**Interfaces:**
- Consumes: `Project`/`projectSchema` (Fase 1, `src/schemas/project.ts`); `CollectionEntry<'projects'>`
  de `astro:content`.
- Produces: `getProjectsByLang(entries, lang)`, `getAdjacentProjects(entries, lang, currentId)`,
  `resolveAltLocaleHref(current, allEntries)` — consumidos pelas Tasks 4 e 5 (listagem e detalhe).

- [ ] **Step 1: Escrever os testes (vão falhar — o arquivo ainda não existe)**

`src/utils/projectList.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getAdjacentProjects, getProjectsByLang, resolveAltLocaleHref } from './projectList';
import type { CollectionEntry } from 'astro:content';

function makeEntry(
  id: string,
  overrides: Partial<CollectionEntry<'projects'>['data']>,
): CollectionEntry<'projects'> {
  return {
    id,
    collection: 'projects',
    data: {
      title: 'Placeholder',
      role: 'QA Tester',
      period: '2025',
      date: new Date('2025-01-01'),
      stack: [],
      problem: '',
      outcome: '',
      featured: false,
      lang: 'en',
      translationKey: id,
      ...overrides,
    },
  } as CollectionEntry<'projects'>;
}

describe('getProjectsByLang', () => {
  it('returns only entries matching the requested language', () => {
    const en = makeEntry('a', { lang: 'en' });
    const pt = makeEntry('b', { lang: 'pt' });
    expect(getProjectsByLang([en, pt], 'en')).toEqual([en]);
  });

  it('sorts matching entries by date, most recent first', () => {
    const older = makeEntry('old', { date: new Date('2025-01-01') });
    const newer = makeEntry('new', { date: new Date('2025-06-01') });
    const result = getProjectsByLang([older, newer], 'en');
    expect(result.map((entry) => entry.id)).toEqual(['new', 'old']);
  });
});

describe('getAdjacentProjects', () => {
  const a = makeEntry('a', { date: new Date('2025-06-01') });
  const b = makeEntry('b', { date: new Date('2025-03-01') });
  const entries = [a, b];

  it('returns null prev and the older entry as next for the most recent entry', () => {
    const result = getAdjacentProjects(entries, 'en', 'a');
    expect(result.prev).toBeNull();
    expect(result.next?.id).toBe('b');
  });

  it('returns the more recent entry as prev and null next for the oldest entry', () => {
    const result = getAdjacentProjects(entries, 'en', 'b');
    expect(result.prev?.id).toBe('a');
    expect(result.next).toBeNull();
  });

  it('returns null for both when there is only one entry', () => {
    const result = getAdjacentProjects([a], 'en', 'a');
    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
  });
});

describe('resolveAltLocaleHref', () => {
  it('links the current language to itself and the other language to the sibling translation', () => {
    const en = makeEntry('cypress-en', { lang: 'en', translationKey: 'cypress' });
    const pt = makeEntry('cypress-pt', { lang: 'pt', translationKey: 'cypress' });
    const result = resolveAltLocaleHref(en, [en, pt]);
    expect(result.en).toBe('/projects/cypress-en');
    expect(result.pt).toBe('/pt/projects/cypress-pt');
  });

  it('falls back to the target language home page when no translation exists', () => {
    const en = makeEntry('solo-en', { lang: 'en', translationKey: 'solo' });
    const result = resolveAltLocaleHref(en, [en]);
    expect(result.en).toBe('/projects/solo-en');
    expect(result.pt).toBe('/pt/');
  });

  it('works starting from the pt entry too', () => {
    const en = makeEntry('cypress-en', { lang: 'en', translationKey: 'cypress' });
    const pt = makeEntry('cypress-pt', { lang: 'pt', translationKey: 'cypress' });
    const result = resolveAltLocaleHref(pt, [en, pt]);
    expect(result.pt).toBe('/pt/projects/cypress-pt');
    expect(result.en).toBe('/projects/cypress-en');
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm run test:unit -- projectList`
Expected: FAIL — `Cannot find module './projectList'` (o arquivo ainda não existe).

- [ ] **Step 3: Criar o utilitário**

`src/utils/projectList.ts`:

```ts
import type { CollectionEntry } from 'astro:content';

export function getProjectsByLang(
  entries: CollectionEntry<'projects'>[],
  lang: 'en' | 'pt',
): CollectionEntry<'projects'>[] {
  return entries
    .filter((entry) => entry.data.lang === lang)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function getAdjacentProjects(
  entries: CollectionEntry<'projects'>[],
  lang: 'en' | 'pt',
  currentId: string,
): { prev: CollectionEntry<'projects'> | null; next: CollectionEntry<'projects'> | null } {
  const sorted = getProjectsByLang(entries, lang);
  const index = sorted.findIndex((entry) => entry.id === currentId);
  return {
    prev: index > 0 ? sorted[index - 1] : null,
    next: index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null,
  };
}

function projectHref(entry: CollectionEntry<'projects'>): string {
  return entry.data.lang === 'pt' ? `/pt/projects/${entry.id}` : `/projects/${entry.id}`;
}

export function resolveAltLocaleHref(
  current: CollectionEntry<'projects'>,
  allEntries: CollectionEntry<'projects'>[],
): { pt: string; en: string } {
  const sibling = allEntries.find(
    (entry) =>
      entry.data.translationKey === current.data.translationKey && entry.data.lang !== current.data.lang,
  );
  const selfHref = projectHref(current);
  const siblingHref = sibling ? projectHref(sibling) : null;

  return {
    pt: current.data.lang === 'pt' ? selfHref : (siblingHref ?? '/pt/'),
    en: current.data.lang === 'en' ? selfHref : (siblingHref ?? '/'),
  };
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm run test:unit -- projectList`
Expected: PASS — 8 testes verdes (2 de `getProjectsByLang` + 3 de `getAdjacentProjects` + 3 de
`resolveAltLocaleHref`).

- [ ] **Step 5: Rodar a checagem de tipos**

Run: `npm run check`
Expected: `0 errors`.

- [ ] **Step 6: Commit**

```bash
git add src/utils/projectList.ts src/utils/projectList.test.ts
git commit -m "Adiciona utilitário puro de listagem/navegação/idioma de projetos

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Componente `StackList` e prop de alternador de idioma em `Header`/`BaseLayout`

**Files:**
- Create: `src/components/StackList.astro`
- Modify: `src/components/Header.astro`
- Modify: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes: nada de tasks anteriores desta fase diretamente.
- Produces: `StackList` — `Props: { stack: string[] }`, sem estado, usado pela Task 4, Task 5 e pela
  Task 6 (que atualiza o `FeaturedProjects` da Fase 2). `Header` ganha `Props: { altLocaleHref?: { pt:
  string; en: string } }` (opcional — nenhuma página existente que já usa `Header`/`BaseLayout` precisa
  mudar). `BaseLayout` ganha o mesmo campo opcional em suas `Props` e repassa pro `Header`.

- [ ] **Step 1: Criar o componente StackList**

`src/components/StackList.astro`:

```astro
---
interface Props {
  stack: string[];
}

const { stack } = Astro.props;
---

<ul class="stack-list">
  {stack.map((tech) => (
    <li>{tech}</li>
  ))}
</ul>

<style>
  .stack-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    list-style: none;
    margin: 0;
    padding: 0;
    font-family: var(--font-mono);
    font-size: 0.8rem;
  }

  .stack-list li {
    border: 1px solid var(--ink-soft);
    border-radius: 3px;
    padding: 0.15rem 0.5rem;
    color: var(--ink-soft);
  }
</style>
```

Nota de design: cada tecnologia é uma tag com borda fina, sem cor de destaque — tecnologia não é
"estado" (`--passed`/`--failed`/`--skipped` são reservados pra isso, spec §4). Separadas por espaço
(`gap`), nunca por `·` — essa é a correção da violação que a Task 6 remove do `FeaturedProjects`.

- [ ] **Step 2: Adicionar a prop opcional no Header**

`src/components/Header.astro` (arquivo completo — adiciona só o bloco `interface Props` e usa
`altLocaleHref` como override quando presente; o resto do arquivo, incluindo o `<style>`, continua
idêntico ao que já existe):

```astro
---
import { getRelativeLocaleUrl } from 'astro:i18n';
import ThemeToggle from './ThemeToggle.astro';

interface Props {
  altLocaleHref?: { pt: string; en: string };
}

const { altLocaleHref } = Astro.props;

const currentLocale = Astro.currentLocale ?? 'en';
const pathWithoutLocale =
  currentLocale === 'en'
    ? Astro.url.pathname
    : Astro.url.pathname.replace(new RegExp(`^/${currentLocale}(?=/|$)`), '') || '/';

const ptHref = altLocaleHref?.pt ?? getRelativeLocaleUrl('pt', pathWithoutLocale);
const enHref = altLocaleHref?.en ?? getRelativeLocaleUrl('en', pathWithoutLocale);
---

<header>
  <a href={getRelativeLocaleUrl(currentLocale, '/')} class="site-name">Willian</a>
  <nav aria-label="Language">
    <a href={ptHref} aria-current={currentLocale === 'pt' ? 'page' : undefined}>pt</a>
    <span aria-hidden="true">·</span>
    <a href={enHref} aria-current={currentLocale === 'en' ? 'page' : undefined}>en</a>
  </nav>
  <ThemeToggle />
</header>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--ink-soft);
  }

  .site-name {
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--ink);
    text-decoration: none;
  }

  nav[aria-label='Language'] {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family: var(--font-mono);
    font-size: 0.85rem;
  }

  nav[aria-label='Language'] a {
    color: var(--ink-soft);
    text-decoration: none;
  }

  nav[aria-label='Language'] a[aria-current='page'] {
    color: var(--ink);
    font-weight: 700;
  }
</style>
```

Nota: o `·` entre "pt" e "en" no seletor de idioma do próprio Header **não muda** nesta task — ele já
existia desde a Fase 1 e é um separador de 2 itens num controle de navegação, não uma "meta line" de 3+
itens (o padrão que o spec proíbe). Não confundir com o `stack.join(' · ')` do `FeaturedProjects`
(Task 6), que é o problema real.

- [ ] **Step 3: Repassar a prop no BaseLayout**

`src/layouts/BaseLayout.astro` (arquivo completo — a única mudança é a `interface Props` ganhar o campo
opcional e o `<Header />` passar a receber `altLocaleHref`; **nada mais muda**, incluindo o comentário
do topo sobre `standard.css` e o `<Footer />` já existentes):

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

- [ ] **Step 4: Rodar o build e a checagem de tipos**

Run: `npm run build && npm run check`
Expected: build sem erros; `check` com `0 errors` (as páginas existentes — home, docs — continuam
funcionando idênticas, já que não passam `altLocaleHref`).

- [ ] **Step 5: Verificar que a home continua com o alternador de idioma normal (sem regressão)**

Run: `grep -o 'aria-current="page">en' dist/index.html`
Expected: encontra a ocorrência — o comportamento padrão do `Header` continua intacto na home.

- [ ] **Step 6: Commit**

```bash
git add src/components/StackList.astro src/components/Header.astro src/layouts/BaseLayout.astro
git commit -m "Adiciona StackList e prop altLocaleHref opcional em Header/BaseLayout

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Listagem (`/projects` e `/pt/projects`)

**Files:**
- Create: `src/pages/projects/index.astro`
- Create: `src/pages/pt/projects/index.astro`

**Interfaces:**
- Consumes: `getProjectsByLang` (Task 2, `src/utils/projectList.ts`); `StackList` (Task 3).
- Produces: rotas `/projects/` e `/pt/projects/` — Task 6 não depende diretamente destas páginas, mas
  o critério de aceite final da fase confirma as duas.

- [ ] **Step 1: Criar a listagem em inglês**

`src/pages/projects/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import StackList from '../../components/StackList.astro';
import { getProjectsByLang } from '../../utils/projectList';

const allProjects = await getCollection('projects');
const projects = getProjectsByLang(allProjects, 'en');
---

<BaseLayout title="Willian — Projects">
  <ul class="project-list">
    {
      projects.map((project) => (
        <li>
          <a href={`/projects/${project.id}`}>
            <span class="title">{project.data.title}</span>
            <span class="meta">
              {project.data.role}, {project.data.period}
            </span>
            <StackList stack={project.data.stack} />
          </a>
        </li>
      ))
    }
  </ul>
</BaseLayout>

<style>
  .project-list {
    list-style: none;
    margin: 0;
    padding: 1.5rem;
    max-width: var(--measure);
  }

  .project-list li {
    border-top: 1px solid var(--ink-soft);
    padding: 1rem 0;
  }

  .project-list li:last-child {
    border-bottom: 1px solid var(--ink-soft);
  }

  .project-list a {
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
    color: var(--ink-soft);
  }
</style>
```

Nota: `role, period` usa vírgula, não `·` — ver Global Constraints.

- [ ] **Step 2: Criar a listagem em português**

`src/pages/pt/projects/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import StackList from '../../../components/StackList.astro';
import { getProjectsByLang } from '../../../utils/projectList';

const allProjects = await getCollection('projects');
const projects = getProjectsByLang(allProjects, 'pt');
---

<BaseLayout title="Willian — Projetos">
  <ul class="project-list">
    {
      projects.map((project) => (
        <li>
          <a href={`/pt/projects/${project.id}`}>
            <span class="title">{project.data.title}</span>
            <span class="meta">
              {project.data.role}, {project.data.period}
            </span>
            <StackList stack={project.data.stack} />
          </a>
        </li>
      ))
    }
  </ul>
</BaseLayout>

<style>
  .project-list {
    list-style: none;
    margin: 0;
    padding: 1.5rem;
    max-width: var(--measure);
  }

  .project-list li {
    border-top: 1px solid var(--ink-soft);
    padding: 1rem 0;
  }

  .project-list li:last-child {
    border-bottom: 1px solid var(--ink-soft);
  }

  .project-list a {
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
    color: var(--ink-soft);
  }
</style>
```

- [ ] **Step 3: Rodar o build e verificar as duas listagens**

Run:
```bash
npm run build
grep -o "Optimizing the Cypress test pipeline" dist/projects/index.html
grep -o "Mobile test architecture with Appium" dist/projects/index.html
grep -o "Otimizando o pipeline de testes Cypress" dist/pt/projects/index.html
grep -o "Arquitetura de testes mobile com Appium" dist/pt/projects/index.html
```
Expected: os quatro comandos encontram o texto esperado — as duas listagens mostram os dois projetos
cada, no idioma certo.

- [ ] **Step 4: Confirmar que não sobrou nenhum `·` de separador de meta**

Run: `grep -c ' · ' dist/projects/index.html dist/pt/projects/index.html`
Expected: `0` nos dois arquivos (o `role, period` usa vírgula; o `StackList` usa `<li>` sem separador
visual de texto).

- [ ] **Step 5: Rodar a checagem de tipos**

Run: `npm run check`
Expected: `0 errors`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/projects/index.astro src/pages/pt/projects/index.astro
git commit -m "Adiciona a listagem de projetos em /projects e /pt/projects

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Página de detalhe (`/projects/[...slug]` e `/pt/projects/[...slug]`) com anterior/próximo e idioma correto

**Files:**
- Create: `src/pages/projects/[...slug].astro`
- Create: `src/pages/pt/projects/[...slug].astro`

**Interfaces:**
- Consumes: `getAdjacentProjects`, `resolveAltLocaleHref` (Task 2); `StackList` (Task 3); `BaseLayout`
  com `altLocaleHref` (Task 3).
- Produces: rotas `/projects/<slug>/` e `/pt/projects/<slug>/` pra cada uma das 4 entradas da Task 1 —
  fecha, junto com a Task 6, o critério de "leia o caso" apontar pro lugar certo.

- [ ] **Step 1: Criar a página de detalhe em inglês**

`src/pages/projects/[...slug].astro`:

```astro
---
import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import StackList from '../../components/StackList.astro';
import { getAdjacentProjects, resolveAltLocaleHref } from '../../utils/projectList';

interface Props {
  project: CollectionEntry<'projects'>;
}

export async function getStaticPaths() {
  const allProjects = await getCollection('projects');
  const enProjects = allProjects.filter((project) => project.data.lang === 'en');
  return enProjects.map((project) => ({
    params: { slug: project.id },
    props: { project },
  }));
}

const { project } = Astro.props;
const { Content } = await render(project);
const allProjects = await getCollection('projects');
const { prev, next } = getAdjacentProjects(allProjects, 'en', project.id);
const altLocaleHref = resolveAltLocaleHref(project, allProjects);
---

<BaseLayout title={project.data.title} altLocaleHref={altLocaleHref}>
  <article class="case-study">
    <h1>{project.data.title}</h1>
    <p class="meta">
      {project.data.role}, {project.data.period}
    </p>
    <StackList stack={project.data.stack} />
    <div class="body">
      <Content />
    </div>
    <nav class="prev-next" aria-label="Project navigation">
      <div class="prev">
        {
          prev && (
            <a href={`/projects/${prev.id}`}>
              <span class="direction">Previous</span>
              <span class="title">{prev.data.title}</span>
            </a>
          )
        }
      </div>
      <div class="next">
        {
          next && (
            <a href={`/projects/${next.id}`}>
              <span class="direction">Next</span>
              <span class="title">{next.data.title}</span>
            </a>
          )
        }
      </div>
    </nav>
  </article>
</BaseLayout>

<style>
  .case-study {
    padding: 1.5rem;
    max-width: var(--measure);
  }

  .meta {
    color: var(--ink-soft);
    margin: 0.5rem 0 1rem;
  }

  .body {
    margin-top: 1.5rem;
  }

  .body :global(h2) {
    margin-top: 2rem;
  }

  .prev-next {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--ink-soft);
  }

  .prev-next a {
    display: flex;
    flex-direction: column;
    color: var(--ink);
    text-decoration: none;
  }

  .next {
    text-align: right;
  }

  .next a {
    align-items: flex-end;
  }

  .direction {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--ink-soft);
  }
</style>
```

Nota: a direção da navegação é comunicada só por posição (`prev` à esquerda, `next` à direita via
`justify-content: space-between`) e pelo rótulo de texto "Previous"/"Next" — nenhuma seta `←`/`→`
(proibido, ver Global Constraints).

- [ ] **Step 2: Criar a página de detalhe em português**

`src/pages/pt/projects/[...slug].astro`:

```astro
---
import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import StackList from '../../../components/StackList.astro';
import { getAdjacentProjects, resolveAltLocaleHref } from '../../../utils/projectList';

interface Props {
  project: CollectionEntry<'projects'>;
}

export async function getStaticPaths() {
  const allProjects = await getCollection('projects');
  const ptProjects = allProjects.filter((project) => project.data.lang === 'pt');
  return ptProjects.map((project) => ({
    params: { slug: project.id },
    props: { project },
  }));
}

const { project } = Astro.props;
const { Content } = await render(project);
const allProjects = await getCollection('projects');
const { prev, next } = getAdjacentProjects(allProjects, 'pt', project.id);
const altLocaleHref = resolveAltLocaleHref(project, allProjects);
---

<BaseLayout title={project.data.title} altLocaleHref={altLocaleHref}>
  <article class="case-study">
    <h1>{project.data.title}</h1>
    <p class="meta">
      {project.data.role}, {project.data.period}
    </p>
    <StackList stack={project.data.stack} />
    <div class="body">
      <Content />
    </div>
    <nav class="prev-next" aria-label="Navegação de projetos">
      <div class="prev">
        {
          prev && (
            <a href={`/pt/projects/${prev.id}`}>
              <span class="direction">Anterior</span>
              <span class="title">{prev.data.title}</span>
            </a>
          )
        }
      </div>
      <div class="next">
        {
          next && (
            <a href={`/pt/projects/${next.id}`}>
              <span class="direction">Próximo</span>
              <span class="title">{next.data.title}</span>
            </a>
          )
        }
      </div>
    </nav>
  </article>
</BaseLayout>

<style>
  .case-study {
    padding: 1.5rem;
    max-width: var(--measure);
  }

  .meta {
    color: var(--ink-soft);
    margin: 0.5rem 0 1rem;
  }

  .body {
    margin-top: 1.5rem;
  }

  .body :global(h2) {
    margin-top: 2rem;
  }

  .prev-next {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--ink-soft);
  }

  .prev-next a {
    display: flex;
    flex-direction: column;
    color: var(--ink);
    text-decoration: none;
  }

  .next {
    text-align: right;
  }

  .next a {
    align-items: flex-end;
  }

  .direction {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--ink-soft);
  }
</style>
```

- [ ] **Step 3: Rodar o build e verificar as quatro páginas de detalhe**

Run:
```bash
npm run build
test -f dist/projects/cypress-pipeline-optimization/index.html && echo "ok en cypress"
test -f dist/projects/mobile-test-architecture-appium/index.html && echo "ok en mobile"
test -f dist/pt/projects/otimizacao-pipeline-cypress/index.html && echo "ok pt cypress"
test -f dist/pt/projects/arquitetura-testes-mobile-appium/index.html && echo "ok pt mobile"
```
Expected: imprime as quatro linhas "ok ...".

- [ ] **Step 4: Verificar que o corpo do case study renderizou (as quatro seções)**

Run: `grep -o "Decisions" dist/projects/cypress-pipeline-optimization/index.html`
Expected: encontra `Decisions` (heading `## Decisions` do markdown virou `<h2>`).

- [ ] **Step 5: Verificar a navegação anterior/próximo**

Com só 2 projetos, cada um tem exatamente 1 vizinho. `getProjectsByLang` ordena por `date`
decrescente (mais recente primeiro) — como `mobile` (2025-08-01) é mais recente que `web`
(2025-03-01), a lista ordenada é `[mobile, web]`. Isso faz `web` (índice 1, o último) ter `mobile`
como **Previous** (índice anterior) e nenhum **Next** (não tem próximo depois dele); `mobile` (índice
0, o primeiro) tem `web` como **Next** e nenhum **Previous**.

Run: `grep -o "Mobile test architecture with Appium" dist/projects/cypress-pipeline-optimization/index.html`
Expected: encontra o título do outro projeto — na página do cypress (web), ele aparece rotulado como
"Previous" (mobile é mais recente, então vem antes na ordenação decrescente).

- [ ] **Step 6: Verificar que nenhuma seta de navegação foi usada**

Run: `grep -c '→\|←\|&rarr;\|&larr;' dist/projects/cypress-pipeline-optimization/index.html`
Expected: `0`.

- [ ] **Step 7: Verificar a correção do alternador de idioma — o link "pt" na página em inglês aponta pro slug pt real (diferente do slug en)**

Run: `grep -o 'href="/pt/projects/otimizacao-pipeline-cypress/*"[^>]*>pt' dist/projects/cypress-pipeline-optimization/index.html`
Expected: encontra o link, confirmando que o alternador resolveu o par via `translationKey` (o slug pt
é `otimizacao-pipeline-cypress`, completamente diferente do slug en
`cypress-pipeline-optimization` — isso só funciona porque o Header não está mais reescrevendo o path).

- [ ] **Step 8: Rodar a checagem de tipos e os testes unitários**

Run: `npm run check && npm run test:unit`
Expected: `check` com `0 errors`; `test:unit` com 28 testes verdes (11 Fase 1 + 4 Task 1 Fase 2 + 5 Task
3 Fase 2 + 8 desta fase, Task 2).

- [ ] **Step 9: Commit**

```bash
git add src/pages/projects/[...slug].astro "src/pages/pt/projects/[...slug].astro"
git commit -m "Adiciona a página de detalhe dos case studies com navegação e idioma corrigido

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Corrige `FeaturedProjects` (StackList + link real) e verificação final da fase

**Files:**
- Modify: `src/components/FeaturedProjects.astro`

**Interfaces:**
- Consumes: `StackList` (Task 3); rotas `/projects/[slug]` e `/pt/projects/[slug]` (Task 5).
- Produces: nada consumido por task futura — última task da fase.

- [ ] **Step 1: Trocar `stack.join(' · ')` por `StackList`, e o link de `url ?? '#'` pelo link real da página de detalhe**

`src/components/FeaturedProjects.astro` (arquivo completo):

```astro
---
import { getCollection } from 'astro:content';
import { selectFeaturedProjects } from '../utils/featuredProjects';
import StackList from './StackList.astro';

const locale = (Astro.currentLocale ?? 'en') as 'en' | 'pt';
const allProjects = await getCollection('projects');
const featured = selectFeaturedProjects(allProjects, locale);

const readCaseLabel = locale === 'pt' ? 'leia o caso' : 'read the case';
const sectionTitle = locale === 'pt' ? 'Projetos' : 'Projects';

function projectHref(id: string): string {
  return locale === 'pt' ? `/pt/projects/${id}` : `/projects/${id}`;
}
---

{
  featured.length > 0 && (
    <section class="featured-projects" aria-labelledby="featured-projects-heading">
      <h2 id="featured-projects-heading">{sectionTitle}</h2>
      <ul>
        {featured.map((project) => (
          <li>
            <a href={projectHref(project.id)}>
              <span class="title">{project.data.title}</span>
              <StackList stack={project.data.stack} />
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
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    color: var(--ink);
    text-decoration: none;
  }

  .title {
    font-weight: 700;
  }

  .cta {
    color: var(--ink-soft);
  }
</style>
```

Nota: `project.data.url` deixou de ser usado neste componente — o link "leia o caso" agora sempre
aponta pra página de detalhe interna (`/projects/[slug]`), nunca pro site do produto/cliente. Isso
fecha o `TODO(Fase 3)` que a Fase 2 deixou. Se um projeto futuro tiver `url`/`repo`, esses campos
aparecem na própria página de detalhe (Task 5 já suporta isso via `project.data.url`/`project.data.repo`
— não implementado nesta task porque nenhum dos dois projetos desta fase os usa; deixar como próxima
melhoria natural quando um projeto real precisar).

- [ ] **Step 2: Rodar o build e confirmar a home com os dois projetos**

Run:
```bash
npm run build
grep -o "Optimizing the Cypress test pipeline" dist/index.html
grep -o "Mobile test architecture with Appium" dist/index.html
grep -o 'href="/projects/cypress-pipeline-optimization"' dist/index.html
```
Expected: os três comandos encontram o texto/atributo esperado.

- [ ] **Step 3: Confirmar que não sobrou nenhum `·` de separador de stack na home**

Run: `grep -c ' · ' dist/index.html dist/pt/index.html`
Expected: `0` nos dois arquivos.

- [ ] **Step 4: Rodar a suíte completa de verificação da fase**

Run: `npm run test:unit && npm run check && npm run build`
Expected: `test:unit` com 28 testes verdes; `check` com `0 errors`; `build` sem erros, gerando (além das
rotas já existentes das Fases 1-2) `dist/projects/index.html`, `dist/pt/projects/index.html`, e as
quatro páginas de detalhe.

- [ ] **Step 5: Conferir o critério de aceite da Fase 3 (spec §6)**

Nenhum comando novo — o critério ("build quebra se um projeto vier sem campo obrigatório") já foi
comprovado no Task 1, Steps 7-10, e reconfirmado aqui pelo Step 4 passando limpo com os 4 projetos
reais intactos.

- [ ] **Step 6: Commit**

```bash
git add src/components/FeaturedProjects.astro
git commit -m "Corrige FeaturedProjects: StackList sem ponto do meio, link real do case study

Fecha o TODO(Fase 3) deixado pela Fase 2 — 'leia o caso' agora aponta
pra /projects/[slug] em vez de project.data.url (site do produto).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review

**Cobertura do spec:** conteúdo dos dois case studies em pt/en (§6.3.1) → Task 1. Critério de aceite
"build quebra sem campo obrigatório" → Task 1, Steps 7-10. `StackList` corrigindo o "ponto do meio"
(§6.3.2) → Task 3 (criação) + Task 4/Task 6 (uso, substituindo `join(' · ')`). Listagem e detalhe
(§6.3.2) → Tasks 4 e 5. Anterior/próximo por `date` (§6.3.2) → Task 2 (`getAdjacentProjects`) + Task 5
(uso). Correção do alternador de idioma via `translationKey` com fallback pra home (§6.3.2 e a
pendência herdada da Fase 1) → Task 2 (`resolveAltLocaleHref`) + Task 3 (prop em `Header`/`BaseLayout`)
+ Task 5 (uso) + Task 5 Step 7 (verificação explícita com slugs divergentes de propósito). TODO da Fase
2 no `FeaturedProjects` → Task 6.

**Placeholders:** nenhum "TBD"/"TODO" novo introduzido (o único TODO mencionado, do `FeaturedProjects`
da Fase 2, é fechado, não criado, por esta fase). O único arquivo temporário do plano
(`_temp-invalid.md`, Task 1) tem motivo técnico explícito (provar o critério de aceite), passo de
criação e de remoção, com checagem de `git status` antes do commit.

**Consistência de tipos:** `getProjectsByLang`/`getAdjacentProjects`/`resolveAltLocaleHref` (Task 2)
usados com a mesma assinatura em todos os lugares que os consomem (Tasks 4 e 5). `StackList` sempre
chamado com `Props: { stack: string[] }` (Task 3 define, Tasks 4/5/6 usam exatamente essa forma).
`Header`/`BaseLayout` sempre com `altLocaleHref?: { pt: string; en: string }` — opcional em todo lugar
que não é página de detalhe, sem quebrar nenhuma chamada existente das Fases 1-2.

**Risco de estilo já mitigado nesta fase:** o brainstorming quase reintroduziu o "ponto do meio" numa
linha de meta "role · period" — corrigido pra vírgula antes mesmo de virar código (ver Global
Constraints). A navegação anterior/próximo foi desenhada desde o início sem seta, evitando o mesmo tipo
de achado de revisão tardia que aconteceu na Fase 2 (fix rounds pós-revisão final por causa de detalhes
de estilo do spec §4 que passaram batido na primeira escrita do plano).
