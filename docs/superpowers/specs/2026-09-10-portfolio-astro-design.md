# Portfólio QA/SDET em Astro — Design

Status: aprovado para planejamento da Fase 1.
Escopo deste documento: visão geral do projeto inteiro (as 7 fases). O plano de implementação (writing-plans) é gerado fase a fase — este spec não é reescrito a cada fase, só revisitado se uma decisão aqui mudar.

## 1. Objetivo

Site pessoal de QA/SDET com uma seção de documentação técnica, mirando recrutamento internacional para vaga remota pleno.

Três leitores, nessa ordem de prioridade:

1. **Recrutador técnico gringo** — 40 segundos, quer saber o que a pessoa faz, em que nível, e se fala inglês.
2. **Engenheiro que vai entrevistar** — quer ver decisão técnica, não lista de ferramenta.
3. **Cliente local de landing page** — quer ver que a pessoa entrega coisa que funciona.

O que o site precisa provar, e não só afirmar: que o autor sabe construir e manter qualidade de software.

**Nome usado no site:** Willian (primeiro nome apenas; sobrenome fica como placeholder a definir depois, não bloqueia nenhuma fase).

## 2. Stack

| Camada | Escolha | Motivo |
|---|---|---|
| Framework | Astro 5 | Estático por padrão, zero JS no cliente sem pedir. Rápido é requisito, não bônus. |
| Docs | Starlight | Sidebar, busca e i18n prontos. Monta em `/docs`. |
| Conteúdo | Content Collections + Zod | Frontmatter tipado. Build quebra se faltar campo obrigatório. |
| Estilo | CSS puro com custom properties | Sem Tailwind. O site é pequeno e o CSS é parte do que está sendo demonstrado. |
| Testes | Playwright + BDD (Gherkin) via `playwright-bdd` | Playwright em vez de Cypress, de propósito — mostra que não é uma pessoa de ferramenta só. |
| Acessibilidade | `@axe-core/playwright` | Roda dentro da suíte, não como ferramenta separada. |
| CI | GitHub Actions | Build, suíte E2E, Lighthouse CI, e publica o resultado. |
| Deploy | Cloudflare Pages | Preview por PR, grátis, rápido no Brasil e fora. |
| Idiomas | pt-BR e en | `en` é o padrão da rota raiz. A vaga é fora. |

Decisão central: **o site inteiro é um só projeto Astro**. Starlight roda como integração dentro dele, não como app separado. Assim `/docs` compartilha o mesmo header, o mesmo domínio e o mesmo deploy.

### 2.1 Infraestrutura — estado atual e quando resolver

- **Git/GitHub:** ainda não é repositório git. Nenhuma inicialização de git, criação de repositório remoto ou push acontece nesta fase de design — isso é decidido explicitamente quando a Fase 1 (ou uma fase posterior que precise de CI) chegar nesse ponto, com confirmação do usuário antes de qualquer ação remota.
- **Cloudflare Pages / domínio:** não há conta nem domínio comprado ainda. Até lá, o plano assume o subdomínio padrão `*.pages.dev`. Domínio customizado é decisão futura, fora do escopo deste spec.

## 3. O conceito

A maioria dos portfólios de QA lista ferramentas. O diferencial aqui é outro:

> **O site é o sistema sob teste, e ele publica os próprios resultados.**

Isso aparece em três lugares:

- **`/quality`** — página que mostra os dados reais do último build: quantos cenários passaram, cobertura das rotas, score de Lighthouse, violações de a11y, tamanho do bundle. Gerada em build time a partir dos artefatos do CI. Se um teste quebrar, a página mostra quebrado.
- **Suíte pública** — os `.feature` ficam no repo e são linkados a partir da `/quality`. Escritos em Gherkin.
- **Hero da home** — um cenário Gherkin real que descreve o que a pessoa procura profissionalmente. É a única peça ousada do site.

Regra de honestidade: **nada em `/quality` pode ser hardcoded**. Se o dado não vier do CI, não entra na página.

## 4. Direção visual

Referência: **relatório de laboratório** — instrumento de medição, boletim de ensaio. Não "portfólio de dev com terminal falso".

### Cor

Cor forte só carrega estado, nunca decora. Verde não é "cor da marca", é `passed`.

```
--paper     #EDEFEE   base, cinza-papel levemente frio
--ink       #16211D   texto e traços
--ink-soft  #5C6B66   texto secundário
--passed    #1F5F3F   verde profundo
--failed    #8C2B22   vermelho tijolo
--skipped   #9A6B1F   âmbar queimado
```

Modo escuro: `--paper #121614`, `--ink #E4E8E6`, os três estados clareiam mantendo o mesmo matiz.

### Tipografia

- **Archivo** (peso 500–700, largura expandida nos títulos) — display.
- **Newsreader** — corpo de texto, case studies em prosa longa.
- **JetBrains Mono** — só onde o conteúdo é literalmente máquina (bloco Gherkin, saída de teste, trecho de código). Nunca em label, legenda ou número decorativo.

Medida de linha: máximo 72 caracteres no corpo. Alinhado à esquerda, sem centralizar bloco de texto.

Proibido (assinatura de site gerado): eyebrow em caixa alta espaçada acima de título; meta com ponto do meio (`A · B · C`); seta `→` colada no fim de link; palavra solta colorida no meio da headline; card arredondado idêntico com mesma sombra cinza.

### Layout

Coluna única, largura de leitura, respiro grande. Sem grid de cards na home. Lista com divisória fina em vez de cards para projetos.

Único momento de movimento: no carregamento da home, o bloco Gherkin escreve as linhas em sequência (Given → When → Then), rápido, uma vez só. Respeita `prefers-reduced-motion` e renderiza completo se o JS não rodar. Fora isso, nada de fade-and-slide-up por seção.

## 5. Arquitetura técnica

### 5.1 i18n

**Correção de 2026-09-10, verificada contra a documentação atual do Starlight:** a ideia original de dois
sistemas de i18n independentes (Astro nativo pro site principal + `locales` próprio do Starlight pro
`/docs`) não é suportada — quando o Starlight recebe `locales`, ele escreve isso na config de i18n do
próprio Astro por baixo dos panos, e ter também um bloco `i18n: {...}` manual em paralelo gera conflito
de configuração (confirmado em [withastro/astro#13551](https://github.com/withastro/astro/issues/13551)
e nas discussões do Starlight sobre i18n). Correto é: **um só sistema de i18n pro projeto inteiro**,
configurado uma única vez.

- Configurado via `locales`/`defaultLocale` passados ao integration `starlight({...})`:
  ```js
  starlight({
    defaultLocale: 'root',
    locales: {
      root: { label: 'English', lang: 'en' },
      pt: { label: 'Português', lang: 'pt' },
    },
  })
  ```
  Inglês como locale raiz (sem prefixo), português prefixado em `/pt/`.
- Essa config é herdada pelo roteamento nativo do Astro para **todas** as páginas do projeto, inclusive
  as do site principal em `src/pages` — não existe um bloco `i18n: {...}` manual separado no
  `astro.config.mjs`. As páginas do site principal seguem a convenção padrão de i18n do Astro em cima
  dessa mesma config herdada (`src/pages/index.astro` → `/`, `src/pages/pt/index.astro` → `/pt/`).
- Mesma UI de troca de idioma no header para as duas seções do site (`astro:i18n` / `Astro.currentLocale`
  funcionam igual nos dois casos, já que é a mesma config por baixo).
- Como o Astro/Starlight ainda não tem suporte de primeira classe pra confirmar 100% do comportamento de
  herança em todos os casos de borda, a Fase 1 inclui verificação de build explícita (rodar `npm run
  build` e inspecionar os arquivos gerados em `dist/`) antes de considerar essa mecânica fechada — ver
  plano de implementação da Fase 1.

### 5.2 Conteúdo

Content Collections (`projects`, `notes`) usam uma coleção única por tipo, com campo `lang: 'pt' | 'en'`
no frontmatter em vez de pastas separadas por idioma. Duas versões do mesmo projeto (pt/en) compartilham
o mesmo `translationKey`; a página de listagem/detalhe filtra pela coleção pelo idioma da rota atual.

**Amendment (2026-09-10):** o campo que liga as duas versões de um projeto é `translationKey` (string
livre, ex: `flakiness-mobile-appium`), não o `slug` do arquivo — mais explícito e independente do nome do
arquivo. O campo `date` também é obrigatório, para ordenação cronológica na listagem.

Schema de `projects`:

```ts
{
  title: string
  role: string
  period: string
  date: Date            // ordenação cronológica na listagem
  stack: string[]
  problem: string       // o que estava quebrado
  outcome: string        // resultado, com número quando existir
  featured: boolean
  lang: 'pt' | 'en'
  translationKey: string // liga as versões pt/en da mesma case study
  url?: string           // link do site/app publicado, quando existir (ex: landing page de cliente)
  repo?: string          // link do repositório público, quando existir (ex: projeto pessoal aberto)
}
```

`url` e `repo` são opcionais e independentes — um projeto pode ter só um dos dois, os dois, ou nenhum
(ex: automação feita para um sistema de cliente normalmente não tem nem site público nem repo público;
nesse caso o case study é só texto + trecho de código anonimizado).

Os quatro campos de conteúdo do corpo, nessa ordem fixa, em todos os case studies:
**Contexto → Problema → Decisões → Resultado**. Sem exceção.

### 5.3 Estrutura de diretórios

```
src/
  content/
    projects/        # case studies (md)
    notes/            # textos curtos, hobbies, aprendizado
    docs/
      docs/           # aninhado propositalmente — ver nota abaixo
        index.md      # inglês (locale raiz), rota final: /docs/
        pt/
          index.md    # português, rota final: /docs/pt/
  content.config.ts   # schemas Zod
  layouts/
  pages/
    index.astro
    projects/[...slug].astro
    quality.astro
    notes/
  styles/tokens.css
tests/
  features/           # .feature em Gherkin
  steps/
  a11y.spec.ts
scripts/
  build-quality-report.ts   # lê artefatos do CI → src/data/quality.json
.github/workflows/ci.yml
```

**Por que `content/docs/docs/`, aninhado:** o Starlight não tem suporte oficial pra rodar num subpath
(`/docs`) sem afetar o site inteiro — a opção `base` do Astro prefixaria todas as rotas do projeto, não
só as do Starlight (confirmado nas discussões
[withastro/starlight#966](https://github.com/withastro/starlight/discussions/966) e
[#1447](https://github.com/withastro/starlight/discussions/1447)). O workaround documentado pela
comunidade é: como as rotas do Starlight espelham a estrutura de pastas dentro da collection `docs`
relativa à raiz dela, aninhar o conteúdo uma pasta a mais (`docs/docs/...` em vez de `docs/...`) faz
todas as rotas saírem prefixadas com `/docs/...`. Feio no disco, mas sem custo de manutenção — é só onde
o arquivo mora, o autor nunca vê esse detalhe ao editar um doc.

**Limitação conhecida e aceita (confirmada na Fase 1, Task 2):** como a detecção de locale do Starlight
olha o primeiro segmento da pasta dentro da collection `docs` (não um segmento interno), o conteúdo em
`docs/docs/pt/` sai na URL certa (`/docs/pt/`) mas **não** é reconhecido pelo Starlight como locale `pt`
de verdade — a página gera `<html lang="en">` mesmo com texto em português. Efeito colateral: o build
também gera duas páginas órfãs em `/pt/docs/*` e `/pt/docs/pt/*` (cópias de fallback automáticas do
Starlight, não linkadas em nenhum lugar do site nem indexadas na busca). Decisão: manter a URL
`/docs/pt/` (consistência de "tudo sob /docs" pesa mais que o atributo `lang` de uma página) e aceitar as
páginas órfãs como ruído inofensivo do build. Alternativa rejeitada: mover o conteúdo pt para
`docs/pt/docs/` resolveria o `lang` e eliminaria as páginas órfãs, mas geraria a URL `/pt/docs/` em vez
de `/docs/pt/`, quebrando a consistência que motivou o aninhamento em primeiro lugar. Tradução do
conteúdo continua manual (arquivo por arquivo, como qualquer conteúdo bilíngue do site) — essa decisão
não afeta isso.

### 5.4 Rotas

| Rota | O que é |
|---|---|
| `/` | Quem sou, o que procuro, projetos em destaque |
| `/projects` | Lista completa |
| `/projects/[slug]` | Case study |
| `/docs` | Starlight — guias técnicos |
| `/quality` | Dashboard do próprio site |
| `/notes` | Violão, horta, o que está sendo estudado |
| `/cv` | Currículo em inglês, PDF e HTML |

### 5.5 Testes — BDD sobre Playwright

Runner: **`playwright-bdd`**, não `@cucumber/cucumber` puro.

- Gera specs do Playwright Test a partir dos `.feature` — Gherkin real, arquivo fica exatamente como
  descrito, mas roda no test runner do Playwright: paralelização, retry, trace viewer.
- Resultado (JSON do Playwright) alimenta diretamente `scripts/build-quality-report.ts` sem adaptador
  de saída do Cucumber — essa costura é peça central da Fase 5 (`/quality`), então usar o relatório
  nativo do Playwright evita ter que escrever um parser próprio para o formato do Cucumber puro.

Cenários cobertos: navegação principal, troca de idioma, troca de tema, cada rota responde 200,
links não quebrados. Mais `a11y.spec.ts` com axe em todas as rotas.

### 5.6 `/quality` — pipeline de dados

1. CI roda: build → Playwright (via playwright-bdd) → axe → Lighthouse CI.
2. `scripts/build-quality-report.ts` lê os artefatos de cada etapa (relatório JSON do Playwright,
   violações do axe, scores do Lighthouse CI) e escreve `src/data/quality.json`.
3. O **próximo** build do site lê esse `quality.json` estático e renderiza `/quality` a partir dele —
   não há geração dinâmica em runtime, o site continua estático.
4. Se qualquer etapa não rodar ou falhar sem gerar artefato, o campo correspondente fica ausente/marcado
   como indisponível na página — nunca um valor inventado ou de exemplo.

### 5.7 Fluxo de manutenção — como adicionar conteúdo novo

Regra geral: `tests/` e `/quality` testam **só o portfólio em si** (site principal + `/docs`) e nunca
mudam quando conteúdo novo é adicionado a `/projects` ou `/docs`. Isso evita que o site vire algo que
precisa de manutenção de pipeline toda vez que a pessoa termina um trabalho novo — adicionar conteúdo é
sempre "criar um arquivo", nunca "mexer em CI".

**Novo doc técnico (`/docs`):** criar `src/content/docs/docs/<slug>.md` (rota final `/docs/<slug>/` —
ver §5.3 sobre o aninhamento) e, se for traduzir, o espelho em `src/content/docs/docs/pt/<slug>.md`
(rota `/docs/pt/<slug>/`). Adicionar uma linha no array de `sidebar` em `astro.config.mjs`, no grupo
temático certo. Duas edições, nenhuma outra.

**Novo case study — landing page, automação de cliente, projeto pessoal, o que for:** criar
`src/content/projects/<slug>.md` (e o espelho em outro idioma se for o caso) com o schema de §5.2,
seguindo a ordem fixa Contexto → Problema → Decisões → Resultado. Preencher `url` se houver site/app no
ar, `repo` se houver código público — nenhum dos dois é obrigatório. Uma suíte de testes E2E escrita
para um sistema de terceiro (trabalho, freelance) **não entra em `tests/`** — ela vira conteúdo desse
case study: um trecho do `.feature` real (anonimizado) colado como bloco de código na página, e/ou um
link pro repo público se existir. Isso mantém a regra de honestidade do `/quality` intacta (ele só fala
do próprio site) sem impedir que o trabalho externo apareça no portfólio.

## 6. Fases

Cada fase vira seu próprio plano de implementação (writing-plans) quando chegar a vez. Não pular fase
antes do critério de aceite da anterior passar.

### Fase 1 — Fundação
Projeto Astro 5 com TypeScript strict, integração Starlight em `/docs`, i18n pt/en (nativo Astro +
Starlight, ver §5.1), Content Collections com os schemas, tokens CSS, fontes via Fontsource
(self-hosted, sem Google Fonts), layout base com header e alternador de idioma e tema.

*Aceite:* `npm run build` limpo, `/` e `/docs` renderizam, trocar idioma mantém a rota.

### Fase 2 — Home e o bloco Gherkin
Hero com o bloco animado, seção de projetos em destaque lendo da collection, rodapé. Responsivo até
360px.

*Aceite:* animação roda uma vez, some com `prefers-reduced-motion: reduce`, conteúdo legível com JS
desligado.

### Fase 3 — Projetos e case studies
Listagem, página de detalhe, componente de stack, navegação anterior/próximo. Dois case studies
escritos de verdade (mobile e web).

*Aceite:* build quebra se um projeto vier sem campo obrigatório — testar de propósito.

### Fase 4 — Suíte de testes
Playwright + Gherkin via playwright-bdd (ver §5.5). Cenários: navegação principal, troca de idioma,
troca de tema, cada rota responde 200, links não quebrados. Mais `a11y.spec.ts` com axe em todas as
rotas.

*Aceite:* `npm run test:e2e` verde local, e um teste falha de propósito quando um link é quebrado.

### Fase 5 — CI e `/quality`
Workflow: build → Playwright → axe → Lighthouse CI (ver §5.6 para o pipeline de dados completo).
Página `/quality` com os números, data do último run, link pro run no GitHub e link pros `.feature`.

*Aceite:* quebrar um teste de propósito → a página mostra falha, não some com o dado.

### Fase 6 — Docs
Migrar a Wiki do GitHub pro Starlight. Sidebar por tema, não por ordem de criação.

*Aceite:* busca funciona, sem link morto.

### Fase 7 — Fechamento
`/notes`, `/cv`, Open Graph por página, sitemap, RSS, `robots.txt`, favicon.

*Aceite:* Lighthouse ≥ 95 nas quatro categorias, zero violação séria no axe.

## 7. Conteúdo a escrever

Material que já existe e vira case study forte:

- **Flakiness no pipeline do Bitbucket** — cache, memória, o que estava causando e como caiu a taxa.
- **Ambientes Docker separados** por tipo de teste (manual, Cypress, Appium) e o problema de contenção
  que isso resolveu.
- **Stale element em page objects** no Appium — por que acontecia e qual foi a estratégia de espera.
- **Datepicker nativo do Android** — o caso clássico de elemento que não é do webview.
- **Redesenho do processo de QA** — subtarefas no Jira, template de teste, fluxo de bug, label de bug
  escapado pra produção, dashboard de métricas. O mais valioso: mostra pensamento de processo, não só
  script.

Os dois case studies da Fase 3 (mobile e web) usam esse material como fonte.

### Regra de confidencialidade

Nenhum nome de cliente, nenhum print de sistema interno, nenhum dado de gestão pública, nenhum número
que só a empresa anterior tem. Descrever como "app de professores da rede municipal" já basta. O valor
está na decisão técnica, e ela é do autor. Isso vale pro tom: escrever sobre problema de engenharia,
nunca sobre a empresa.
