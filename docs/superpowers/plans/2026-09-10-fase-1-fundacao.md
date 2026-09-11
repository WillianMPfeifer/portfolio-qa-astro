# Fase 1 — Fundação — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Colocar de pé o projeto Astro 5 com TypeScript strict, Starlight montado em `/docs`, i18n unificado pt/en, Content Collections tipadas (projects/notes), tokens visuais, fontes self-hosted e um layout base com header, alternador de idioma e alternador de tema.

**Architecture:** Um único projeto Astro. Starlight roda como integração interna montada em `/docs` via aninhamento de conteúdo (não via `base` do Astro, que prefixaria o site inteiro). Um só sistema de i18n para todo o projeto, configurado uma vez através do `locales`/`defaultLocale` do Starlight — as páginas do site principal em `src/pages` herdam essa mesma config de i18n do Astro por baixo. Ver [spec, §5.1 e §5.3](../specs/2026-09-10-portfolio-astro-design.md) para o raciocínio completo e as fontes da pesquisa que embasou essa decisão.

**Tech Stack:** Astro 5, `@astrojs/starlight`, Content Collections (`astro/loaders` + `astro/zod`), Vitest (testes unitários de schema), Fontsource (`@fontsource-variable/archivo`, `@fontsource/newsreader`, `@fontsource/jetbrains-mono`), CSS puro com custom properties, npm.

## Global Constraints

- Astro 5.x — instalar com `astro@^5` para não puxar uma major futura sem querer.
- TypeScript strict — `tsconfig.json` estende `astro/tsconfigs/strict`.
- Gerenciador de pacotes: npm. Não usar pnpm ou yarn.
- **Nenhum comando git nesta fase.** A pasta do projeto está dentro de uma sincronização do Google
  Drive; o usuário vai lidar com git separadamente depois (spec §2.1). Não rodar `git init`, `git add`,
  `git commit` em nenhum passo — os passos de "Commit" do template padrão de plano foram removidos
  desta fase por esse motivo.
- Sem Tailwind. CSS puro com custom properties (spec §2 e §4).
- Fontes self-hosted via Fontsource. Nunca Google Fonts via CDN (spec §2).
- Um só projeto Astro — Starlight roda como integração interna, nunca como app separado (spec §2).
- Um só sistema de i18n para o projeto inteiro, configurado via `locales`/`defaultLocale` do Starlight —
  nunca um bloco `i18n: {...}` manual em paralelo no `astro.config.mjs` (gera conflito de configuração,
  spec §5.1).
- Conteúdo do Starlight fica aninhado em `src/content/docs/docs/` para sair em `/docs/*` (spec §5.3).

**Critério de aceite da fase (spec §6):** `npm run build` limpo; `/` e `/docs` renderizam; trocar idioma
mantém a rota.

---

### Task 1: Scaffold do projeto Astro 5 com TypeScript strict

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `astro.config.mjs`
- Create: `src/pages/index.astro`
- Create: `.gitignore`

**Interfaces:**
- Consumes: nada (primeira tarefa).
- Produces: scripts npm `dev`, `build`, `preview`, `check` em `package.json`; `astro.config.mjs`
  exportando `defineConfig({})` (Task 2 adiciona a integração Starlight a este mesmo arquivo);
  `src/pages/index.astro` como página placeholder (Task 5 substitui o corpo para usar o `BaseLayout`).

- [ ] **Step 1: Inicializar o projeto npm**

Run: `npm init -y`
Expected: cria `package.json` na raiz do projeto.

- [ ] **Step 2: Instalar Astro 5 e as ferramentas de checagem de tipos**

Run: `npm install astro@^5`
Run: `npm install -D typescript @astrojs/check`
Expected: os três pacotes aparecem em `package.json` (astro em `dependencies`, os outros dois em
`devDependencies`).

- [ ] **Step 3: Configurar os scripts do package.json**

Editar o `package.json` gerado no Step 1 para que o campo `"scripts"` fique assim:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check"
  }
}
```

- [ ] **Step 4: Criar o tsconfig.json com strict**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: Criar o astro.config.mjs mínimo**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({});
```

- [ ] **Step 6: Criar a página placeholder**

`src/pages/index.astro`:

```astro
---
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Willian — QA/SDET</title>
  </head>
  <body>
    <h1>Willian — QA/SDET</h1>
  </body>
</html>
```

- [ ] **Step 7: Criar o .gitignore**

Ainda sem repositório git nesta fase (ver Global Constraints), mas o arquivo já fica pronto pra quando o
usuário adicionar:

```
node_modules/
dist/
.astro/
.env
.DS_Store
```

- [ ] **Step 8: Rodar o build e verificar a saída**

Run: `npm run build && grep -o "Willian" dist/index.html`
Expected: o comando imprime `Willian` (o texto foi encontrado no HTML gerado), sem erros de build antes
disso.

- [ ] **Step 9: Rodar a checagem de tipos**

Run: `npm run check`
Expected: `0 errors`.

---

### Task 2: Integração Starlight com i18n unificado, montada em `/docs`

**Files:**
- Modify: `astro.config.mjs`
- Create: `src/content.config.ts`
- Create: `src/content/docs/docs/index.md`
- Create: `src/content/docs/docs/pt/index.md`

**Interfaces:**
- Consumes: `astro.config.mjs` do Task 1 (o `defineConfig({})` vazio ganha a integração aqui).
- Produces: rotas `/docs/` (inglês, locale raiz) e `/docs/pt/` (português); `src/content.config.ts`
  exportando `collections` com a entrada `docs` (Task 3 modifica este mesmo arquivo para adicionar
  `projects` e `notes`); config de i18n do projeto inteiro (locales `en`/`pt`, `en` sem prefixo) —
  herdada pelas páginas do site principal a partir daqui.

- [ ] **Step 1: Instalar o Starlight**

Run: `npm install @astrojs/starlight`

- [ ] **Step 2: Atualizar o astro.config.mjs com a integração e o i18n unificado**

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
    }),
  ],
});
```

- [ ] **Step 3: Criar o content.config.ts com a collection do Starlight**

```ts
import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
```

- [ ] **Step 4: Criar a home dos docs em inglês (locale raiz)**

`src/content/docs/docs/index.md`:

```md
---
title: Docs
description: Technical documentation and guides.
---

Technical documentation and guides.
```

- [ ] **Step 5: Criar a home dos docs em português**

`src/content/docs/docs/pt/index.md`:

```md
---
title: Docs
description: Documentação técnica e guias.
---

Documentação técnica e guias.
```

- [ ] **Step 6: Rodar o build e verificar as duas rotas de docs**

Run: `npm run build && test -f dist/docs/index.html && test -f dist/docs/pt/index.html && echo "ok"`
Expected: imprime `ok` (os dois arquivos existem), build sem erros.

- [ ] **Step 7: Verificar que a home do site principal continua de pé**

Run: `grep -o "Willian" dist/index.html`
Expected: imprime `Willian` — a config de i18n adicionada neste task não quebrou a rota `/` do Task 1.

---

### Task 3: Content Collections — projects e notes, com testes unitários de schema

**Amendment (2026-09-10, pós-retomada):** o schema de `projects` ganhou dois campos obrigatórios a mais
em relação à primeira versão deste plano: `date` (para ordenação cronológica das collections) e
`translationKey` (identifica qual par pt/en é a mesma case study — implementação concreta do "duas
versões compartilham o mesmo slug base" do spec §5.2; ver spec atualizado). Os Steps abaixo já refletem
essa versão final.

**Files:**
- Create: `src/schemas/project.ts`
- Create: `src/schemas/project.test.ts`
- Create: `src/schemas/note.ts`
- Create: `src/schemas/note.test.ts`
- Modify: `src/content.config.ts`
- Create: `src/content/projects/.keep`
- Create: `src/content/notes/.keep`

**Interfaces:**
- Consumes: `src/content.config.ts` do Task 2 (adiciona as collections `projects` e `notes` ao objeto
  `collections` já existente).
- Produces: `projectSchema` (export de `src/schemas/project.ts`, tipo `Project = z.infer<typeof
  projectSchema>`) e `noteSchema` (export de `src/schemas/note.ts`, tipo `Note = z.infer<typeof
  noteSchema>`) — Task 5 e fases futuras importam esses tipos ao renderizar listagens.

- [ ] **Step 1: Instalar o Vitest**

Run: `npm install -D vitest`

Editar `package.json` e adicionar ao `"scripts"`:

```json
"test:unit": "vitest run"
```

- [ ] **Step 2: Escrever o teste do schema de projects (vai falhar — o schema ainda não existe)**

`src/schemas/project.test.ts`:

```ts
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
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `npm run test:unit`
Expected: FAIL — `Cannot find module './project'` (o arquivo ainda não existe).

- [ ] **Step 4: Criar o schema de projects**

`src/schemas/project.ts`:

```ts
import { z } from 'astro/zod';

export const projectSchema = z.object({
  title: z.string(),
  role: z.string(),
  period: z.string(),
  date: z.coerce.date(),
  stack: z.array(z.string()),
  problem: z.string(),
  outcome: z.string(),
  featured: z.boolean(),
  lang: z.enum(['pt', 'en']),
  translationKey: z.string(),
  url: z.string().url().optional(),
  repo: z.string().url().optional(),
});

export type Project = z.infer<typeof projectSchema>;
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `npm run test:unit`
Expected: PASS — 7 testes verdes.

- [ ] **Step 6: Escrever o teste do schema de notes (vai falhar)**

`src/schemas/note.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { noteSchema } from './note';

describe('noteSchema', () => {
  const validNote = {
    title: 'Aprendendo violão',
    description: 'Primeiras semanas praticando escalas.',
    date: '2026-01-10',
    lang: 'pt' as const,
  };

  it('accepts a note with all required fields', () => {
    const result = noteSchema.safeParse(validNote);
    expect(result.success).toBe(true);
  });

  it('coerces a date string into a Date instance', () => {
    const result = noteSchema.parse(validNote);
    expect(result.date).toBeInstanceOf(Date);
  });

  it('rejects a note missing a required field', () => {
    const { description, ...missingDescription } = validNote;
    const result = noteSchema.safeParse(missingDescription);
    expect(result.success).toBe(false);
  });

  it('rejects an invalid lang value', () => {
    const result = noteSchema.safeParse({ ...validNote, lang: 'fr' });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 7: Rodar o teste e confirmar que falha**

Run: `npm run test:unit`
Expected: FAIL — `Cannot find module './note'` (o arquivo ainda não existe). Os testes de `project`
continuam passando.

- [ ] **Step 8: Criar o schema de notes**

`src/schemas/note.ts`:

```ts
import { z } from 'astro/zod';

export const noteSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  lang: z.enum(['pt', 'en']),
});

export type Note = z.infer<typeof noteSchema>;
```

- [ ] **Step 9: Rodar os testes e confirmar que os dois arquivos passam**

Run: `npm run test:unit`
Expected: PASS — 11 testes verdes (7 de project + 4 de note).

- [ ] **Step 10: Registrar as duas collections no content.config.ts**

`src/content.config.ts` (arquivo completo, substituindo o do Task 2):

```ts
import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { glob } from 'astro/loaders';
import { noteSchema } from './schemas/note';
import { projectSchema } from './schemas/project';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  projects: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
    schema: projectSchema,
  }),
  notes: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
    schema: noteSchema,
  }),
};
```

- [ ] **Step 11: Criar os diretórios de conteúdo (ainda vazios nesta fase)**

`src/content/projects/.keep` (conteúdo: uma linha de texto simples, ex: `placeholder para manter o
diretório antes da Fase 3`). Importante: o nome do arquivo **não pode terminar em `.md`**, senão o
`glob` loader do Step 10 tenta validar esse arquivo contra o `projectSchema` e o build quebra por falta
de frontmatter.

`src/content/notes/.keep` — mesma ideia, mesmo conteúdo adaptado.

- [ ] **Step 12: Rodar o build completo e confirmar que passa com as collections vazias**

Run: `npm run build`
Expected: build sem erros — collections `projects` e `notes` vazias não quebram o build (o `.keep` não é
`.md`, então não é validado contra o schema).

---

### Task 4: Tokens visuais, fontes self-hosted e layout base (header, idioma, tema)

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/ThemeToggle.astro`

**Interfaces:**
- Consumes: nada de tasks anteriores diretamente (mas Task 5 vai consumir tudo que este task produz).
- Produces: `BaseLayout` com `Props: { title: string }`, renderiza `<Header />` seguido de `<slot />`
  dentro de `<body>`; `Header` (sem props, lê `Astro.currentLocale` e `Astro.url` sozinho); `ThemeToggle`
  (sem props, injeta seu próprio `<script>` de clique); tokens CSS (`--paper`, `--ink`, `--ink-soft`,
  `--passed`, `--failed`, `--skipped`, `--font-display`, `--font-body`, `--font-mono`, `--measure`)
  disponíveis globalmente em qualquer página que use `BaseLayout`.

- [ ] **Step 1: Instalar as fontes via Fontsource**

Run: `npm install @fontsource-variable/archivo @fontsource/newsreader @fontsource/jetbrains-mono`

- [ ] **Step 2: Criar os tokens CSS**

`src/styles/tokens.css`:

```css
:root {
  color-scheme: light;

  --paper: #EDEFEE;
  --ink: #16211D;
  --ink-soft: #5C6B66;
  --passed: #1F5F3F;
  --failed: #8C2B22;
  --skipped: #9A6B1F;

  --font-display: 'Archivo Variable', sans-serif;
  --font-body: 'Newsreader', serif;
  --font-mono: 'JetBrains Mono', monospace;

  --measure: 72ch;
}

:root[data-theme='dark'] {
  color-scheme: dark;

  --paper: #121614;
  --ink: #E4E8E6;
  --ink-soft: #9AAAA4;
  --passed: #3FA871;
  --failed: #C1604A;
  --skipped: #CDA050;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  line-height: 1.6;
}

h1,
h2,
h3 {
  font-family: var(--font-display);
  font-weight: 700;
  font-variation-settings: 'wdth' 125;
  line-height: 1.15;
}

code,
pre,
.gherkin {
  font-family: var(--font-mono);
}
```

- [ ] **Step 3: Criar o ThemeToggle**

**Amendment (2026-09-10, pós-retomada):** a chave de localStorage é `starlight-theme`, não `theme` — é a
mesma chave que o `ThemeSelect.astro` do próprio Starlight usa (`storeTheme`), então a escolha de tema
feita no site principal persiste ao visitar `/docs` e vice-versa. Se fosse uma chave própria, cada seção
do site guardaria o tema separado, quebrando a ilusão de "um site só" que é a decisão central do spec §2.

`src/components/ThemeToggle.astro`:

```astro
---
---
<button id="theme-toggle" aria-label="Toggle color theme" type="button">☾</button>

<style>
  #theme-toggle {
    background: none;
    border: 1px solid var(--ink-soft);
    border-radius: 4px;
    color: var(--ink);
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    padding: 0.35rem 0.6rem;
  }
</style>

<script>
  // Mesma chave de localStorage que o ThemeSelect.astro do Starlight
  // (storeTheme), para o tema ficar sincronizado entre o site principal e /docs.
  const storageKey = 'starlight-theme';

  const button = document.getElementById('theme-toggle');
  button?.addEventListener('click', () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    localStorage.setItem(storageKey, next);
  });
</script>
```

- [ ] **Step 4: Criar o Header**

`src/components/Header.astro`:

```astro
---
import { getRelativeLocaleUrl } from 'astro:i18n';
import ThemeToggle from './ThemeToggle.astro';

const currentLocale = Astro.currentLocale ?? 'en';
const pathWithoutLocale =
  currentLocale === 'en'
    ? Astro.url.pathname
    : Astro.url.pathname.replace(new RegExp(`^/${currentLocale}(?=/|$)`), '') || '/';

const ptHref = getRelativeLocaleUrl('pt', pathWithoutLocale);
const enHref = getRelativeLocaleUrl('en', pathWithoutLocale);
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

- [ ] **Step 5: Criar o BaseLayout**

`src/layouts/BaseLayout.astro`:

```astro
---
import '@fontsource-variable/archivo/full.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/jetbrains-mono/400.css';
import '../styles/tokens.css';
import Header from '../components/Header.astro';

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
        // Mesma chave de localStorage que o ThemeProvider.astro do Starlight,
        // para o tema ficar sincronizado entre o site principal e /docs.
        const stored = localStorage.getItem('starlight-theme');
        const theme =
          stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.dataset.theme = theme;
      })();
    </script>
  </head>
  <body>
    <Header />
    <main>
      <slot />
    </main>
  </body>
</html>
```

- [ ] **Step 6: Rodar o build e verificar que os arquivos de fonte foram gerados**

Run: `npm run build && ls dist/_astro/*.woff2 | head -3`
Expected: lista pelo menos um arquivo `.woff2` (as fontes Fontsource foram processadas e embutidas nos
assets do build).

- [ ] **Step 7: Rodar a checagem de tipos**

Run: `npm run check`
Expected: `0 errors`.

---

### Task 5: Rota `/pt/` do site principal e verificação final da Fase 1

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/pages/pt/index.astro`

**Interfaces:**
- Consumes: `BaseLayout` (`Props: { title: string }`) do Task 4; i18n unificado do Task 2 (o roteamento
  `src/pages/pt/*` só funciona porque o Astro já reconhece `pt` como locale configurado).
- Produces: rotas finais `/` e `/pt/` do site principal, usando `BaseLayout` — fecha o critério de
  aceite da Fase 1.

- [ ] **Step 1: Atualizar a home em inglês para usar o BaseLayout**

`src/pages/index.astro` (substitui o placeholder do Task 1):

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Willian — QA/SDET">
  <h1>Willian — QA/SDET</h1>
  <p>Quality engineer and test automation.</p>
</BaseLayout>
```

- [ ] **Step 2: Criar a home em português**

`src/pages/pt/index.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
---

<BaseLayout title="Willian — QA/SDET">
  <h1>Willian — QA/SDET</h1>
  <p>Engenheiro de qualidade e automação de testes.</p>
</BaseLayout>
```

- [ ] **Step 3: Rodar o build completo**

Run: `npm run build`
Expected: build sem erros.

- [ ] **Step 4: Verificar que a home em inglês marca "en" como locale atual**

Run: `grep -o 'aria-current="page">en' dist/index.html`
Expected: imprime `aria-current="page">en` — o link "en" do Header está marcado como página atual em
`/`.

- [ ] **Step 5: Verificar que o link "pt" na home em inglês aponta pra `/pt/`**

Run: `grep -o 'href="/pt/*"[^>]*>pt' dist/index.html`
Expected: encontra um link cujo `href` é `/pt` ou `/pt/`, apontando pra rota em português.

- [ ] **Step 6: Verificar que a home em português marca "pt" como locale atual**

Run: `grep -o 'aria-current="page">pt' dist/pt/index.html`
Expected: imprime `aria-current="page">pt`.

- [ ] **Step 7: Verificar que o link "en" na home em português aponta de volta pra `/`**

Run: `grep -o 'href="/"[^>]*>en' dist/pt/index.html`
Expected: encontra o link "en" apontando pra `/` — confirma que trocar de idioma preserva a rota (home
↔ home), não redireciona pra uma página diferente.

- [ ] **Step 8: Verificar as quatro rotas da fase de ponta a ponta**

Run: `test -f dist/index.html && test -f dist/pt/index.html && test -f dist/docs/index.html && test -f dist/docs/pt/index.html && echo "ok"`
Expected: imprime `ok`.

- [ ] **Step 9: Rodar a suíte de testes unitários e a checagem de tipos uma última vez**

Run: `npm run test:unit && npm run check`
Expected: `test:unit` com 9 testes verdes; `check` com `0 errors`.

- [ ] **Step 10: Conferir o critério de aceite da Fase 1 (spec §6)**

Nenhum comando novo — os Steps 3, 8 e 9 já cobrem, juntos, os três pontos do critério: `npm run build`
limpo (Step 3 e 9), `/` e `/docs` renderizam (Step 8, junto com `/pt/` e `/docs/pt/` que fazem parte do
i18n desta mesma fase), trocar idioma mantém a rota (Steps 4–7).

---

## Self-Review

**Cobertura do spec:** i18n unificado (§5.1) → Task 2 e Task 5. Conteúdo do Starlight aninhado em
`/docs/docs` (§5.3) → Task 2. Schema de `projects` com `url`/`repo` opcionais (§5.2) → Task 3. Tokens de
cor e tipografia (§4) → Task 4. Fontes self-hosted, sem Google Fonts (§2) → Task 4. TypeScript strict
(escopo da fase) → Task 1, verificado de novo em Tasks 4 e 5. Header com alternador de idioma e tema
(escopo da fase) → Task 4 e Task 5. Nenhum comando git em nenhuma task, conforme Global Constraints.

**Placeholders:** nenhum "TBD"/"TODO" nos steps. Os únicos arquivos "vazios" (`.keep`) têm um motivo
técnico explícito (Step 11 do Task 3) e não são conteúdo de verdade — Fase 3 preenche isso.

**Consistência de tipos:** `projectSchema`/`Project` (Task 3) e `noteSchema`/`Note` (Task 3) usados sem
variação de nome em nenhum outro task. `BaseLayout` sempre chamado com `Props: { title: string }` (Task
4 define, Task 5 usa exatamente essa forma nas duas páginas).

**Nota sobre retomada (2026-09-10):** este plano foi escrito, e a implementação começou, numa sessão que
foi perdida antes de terminar (pasta do projeto estava numa sincronização do Google Drive na época — já
resolvido, projeto agora vive fora de qualquer sync). Boa parte do código-fonte sobreviveu num diretório
órfão e revelou duas decisões de implementação melhores que a primeira versão deste plano, incorporadas
nos Steps acima antes de retomar: `date`/`translationKey` no schema de `projects` (Task 3) e a chave de
localStorage `starlight-theme` compartilhada com o Starlight (Task 4). Os arquivos de configuração da
raiz (`package.json`, `tsconfig.json`, `astro.config.mjs`) não sobreviveram e foram recriados do zero
seguindo este plano. Um bug real também foi encontrado no build órfão — o conteúdo de `/docs` em
português tinha sido colocado em `content/docs/pt/docs/` em vez de `content/docs/docs/pt/` (Task 2),
gerando a rota errada `/pt/docs/` em vez de `/docs/pt/` — o Step correspondente do Task 2 já está correto
neste documento; o desvio existiu só na implementação órfã, não no texto do plano.

**Nota sobre risco técnico residual:** a mecânica de herança de i18n do Starlight para as páginas do site
principal (§5.1 do spec) foi verificada via documentação oficial e discussões públicas do Starlight/Astro,
mas não existe um exemplo oficial testado ponta-a-ponta idêntico a este projeto. Por isso o Task 5 termina
com verificação explícita do HTML gerado (Steps 4–7) em vez de assumir que a config funciona — se algo
não bater com o esperado, é nesse ponto que aparece, com o build inteiro ainda pequeno o bastante pra
depurar rápido.
