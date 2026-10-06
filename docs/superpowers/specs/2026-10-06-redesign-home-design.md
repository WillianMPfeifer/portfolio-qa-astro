# Redesign da home e do visual do site — Design

Status: aprovado em brainstorming (2026-10-06). Substitui a seção **4. Direção visual** do spec
`2026-09-10-portfolio-astro-design.md` e a decisão "CSS puro, sem Tailwind" da seção 2. O resto daquele
spec (i18n, conteúdo, testes, CI, docs) continua valendo.

## 1. Por que refazer

A versão da Fase 2 falhou em quatro pontos:

1. Coluna estreita colada à esquerda numa tela larga: parecia inacabado, não intencional.
2. Nome, nível e contato não apareciam nos primeiros segundos. O hero era só o bloco Gherkin.
3. As provas (115 cenários, 114 bugs, incidente em produção, 2h → 24min) não estavam na home.
4. O texto ("Testes uma IA escreve… isso não", "esse cara sou eu") brigava com o próprio perfil, que
   desenvolve com IA, e com o mercado, que quer QA que usa IA bem.

E um ponto de manutenção: CSS puro espalhado em `<style>` por componente. O autor não conseguia editar.

## 2. Decisões de brainstorming

| Pergunta | Decisão |
|---|---|
| Quem executa | Claude Code, neste repo, com a suíte existente rodando |
| Leitor principal | Recrutador brasileiro, vaga remota júnior/pleno. PT é a versão principal, EN completo |
| Tese | **Automação que segura produção.** Liderança e trajetória fora do padrão como apoio. IA aparece como ferramenta do dia a dia, nem bandeira nem inimiga |
| Estilo | Tailwind v4 (o autor já usou no site do Anibem) |
| Foto | Sim, foto enviada pelo autor (`src/assets/willian.jpg`) |
| Dados | Só dado real (`docs/me/sobre_mim.md`, case studies, `quality.json`). Fato que falta não vira placeholder: o elemento sai |

Fora do escopo: trocar o locale raiz de EN pra PT (mexe em rotas, Starlight e testes). Por ora o link
compartilhado com recrutador BR é o `/pt/`.

## 3. Direção visual

Ponto de partida: a foto (camisa verde-oliva, parede sálvia) e o mundo de QA (relatório de execução,
Gherkin, tabela de resultado). Nada de terminal falso, nada de bege + serifa, nada de preto + verde neon.

### Cor (tokens em `src/styles/tokens.css`)

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `paper` | `#F2F4EE` | `#111410` | fundo |
| `surface` | `#E4E9DC` | `#1A1F17` | blocos de apoio |
| `ink` | `#1A1E17` | `#E8EBE2` | texto |
| `ink-soft` | `#535C4D` | `#A6AF9D` | texto secundário |
| `line` | `#C9D1BF` | `#2E3629` | divisórias |
| `accent` (musgo) | `#2F5226` | `#93C274` | botão, link, `passed` |
| `honey` | `#8A5A06` | `#E3B054` | detalhe pontual (fonte dos números, palavra-chave Gherkin) |
| `failed` | `#9B2C22` | `#E07A66` | estado de falha no /quality |
| `band` / `band-ink` / `band-soft` / `band-honey` | `#22381C` / `#EEF2E6` / `#B9C7AC` / `#E3B054` | `#1C2C17` / iguais | faixa do incidente |

Todos os pares texto/fundo passam WCAG AA (verificado: menor razão 4.79, `honey` sobre `surface`).

### Tipografia

- **Schibsted Grotesk** (variável): títulos em 800 com tracking apertado, corpo em 400. Uma família só,
  com contraste vindo de peso e tamanho.
- **Martian Mono** (variável): só onde o conteúdo é máquina (Gherkin, tabela de resultado, fonte dos
  números, anos da trajetória).

### Layout

Container centralizado de ~1120px com gutter de 16px no mobile. Acaba com o vazio à direita.

### Assinatura

A faixa do incidente: bloco musgo escuro de ponta a ponta, com o caso real escrito como cenário Gherkin
(keywords em PT na versão PT, `# language: pt`) e uma tabela de ambientes cujas linhas viram `passou` em
sequência quando a faixa entra na tela. Sem JS ou com `prefers-reduced-motion`, a tabela aparece pronta.
É o único movimento da página.

### Proibidos (continuam valendo do spec antigo)

Eyebrow em caixa alta espaçada, meta com ponto do meio, seta `→` no fim de link, palavra solta colorida
na headline, card arredondado com sombra cinza idêntica.

## 4. Estrutura da home

1. **Header**: nome à esquerda; Projetos, Qualidade, Docs; `pt`/`en` e o botão de tema à direita.
2. **Hero**: linha de status ("QA Automation, aberto a vagas remotas"), `h1` com o nome, parágrafo de 3
   linhas contando o que fez, botões (e-mail principal, LinkedIn, GitHub), cidade. Foto à direita
   (abaixo no mobile).
3. **Números com fonte**: 115 cenários E2E (suítes Cypress), 114 bugs válidos (Jira, desde mar/2025),
   ~80% menos tempo de execução (case do pipeline), 3 módulos. Cada número cita de onde veio.
4. **Faixa do incidente** (assinatura).
5. **Projetos**: os featured em duas colunas, com problema, resultado, stack e link pro caso.
6. **Além do script**: liderança e processo (treina/coordena testador, cobre o analista de negócios,
   pair com devs, revisão de código, Confluence, arquitetura base pros módulos migrando de Delphi pra
   Java 21, desenvolvimento com IA).
7. **Trajetória** (lista cronológica, aqui a ordem é informação) e **Ferramentas** lado a lado.
8. **Contato**: e-mail em destaque, LinkedIn, GitHub, Credly, e a linha "este site também é testado"
   com os números reais do `quality.json` e link pro `/quality`.
9. **Rodapé** curto.

Todo o texto da home fica em `src/data/home.ts`, objeto `pt`/`en`, tipado.

## 5. Técnica

- `tailwindcss` + `@tailwindcss/vite`. `src/styles/global.css` importa o Tailwind, os tokens e mapeia os
  tokens via `@theme inline`, então `bg-paper`, `text-ink`, `bg-accent` funcionam e trocam sozinhos no
  modo escuro (sem prefixo `dark:`).
- `tokens.css` continua CSS puro e é compartilhado com o Starlight (`starlight-tokens.css` remapeado).
  O Starlight não recebe o Tailwind (evita o preflight quebrar o `/docs`).
- Foto via `astro:assets` (`<Picture>` com AVIF/WebP e larguras responsivas).
- Páginas de projetos, case study e `/quality` migram pras mesmas classes.
- Componentes antigos `GherkinHero` e `hero.ts` saem; `FeaturedProjects`, `Header`, `Footer`,
  `StackList`, `ThemeToggle` são reescritos.

## 6. Testes

- Os seletores da suíte E2E continuam válidos: botão "Toggle color theme", links `pt`/`en` exatos, link
  do case study pelo título.
- `hero.test.ts` vira `home.test.ts` (todo campo obrigatório preenchido nos dois idiomas, mesmo número de
  itens em PT e EN).
- Critério de pronto: `astro check`, `vitest`, suíte Playwright completa (incluindo axe sem violações) e
  screenshots claro/escuro em desktop e mobile revisados.

## 7. Adições após a primeira revisão (2026-10-06)

- Currículo PT em `public/cv/willian-pfeifer-curriculo.pdf`, com botão no hero e no contato. Na versão EN
  o botão avisa que o PDF está em português.
- WhatsApp no contato; link do post do LinkedIn sobre o incidente na faixa.
- Google Cloud Facilitator na trajetória e o freelance do Anibem abaixo dos projetos (ambos do currículo).
- `tests/support/crawler.ts` passou a checar links de arquivo (PDF) sem navegar neles como página.

## 8. Pendências do autor

- Currículo em inglês (PDF), se quiser o botão da versão EN apontando pra ele.
