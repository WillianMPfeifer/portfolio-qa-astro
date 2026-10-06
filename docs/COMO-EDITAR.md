# Como editar o site

Guia rápido de onde mexer. Rodar local: `npm run dev` e abrir <http://localhost:4321/pt/>.
(O Astro 7 pede Node 22+: `nvm use 22.23.2` antes.)

## Quero mudar um texto

| O quê | Onde |
|---|---|
| Qualquer texto da home (hero, números, incidente, trajetória, ferramentas, contato) | `src/data/home.ts` — tem `pt` e `en`, mude os dois |
| E-mail, LinkedIn, GitHub, Credly | `src/data/links.ts` |
| Textos das páginas de projetos e qualidade | `src/data/ui.ts` |
| Um case study | `src/content/projects/*.md` (um arquivo por idioma, ligados pelo `translationKey`) |
| Um doc | `src/content/docs/docs/...` (en) e `src/content/docs/pt/docs/...` (pt) |

Novo case study: copie um `.md` existente, troque o `translationKey`, e crie a versão no outro idioma
com o mesmo `translationKey`. `featured: true` coloca ele na home.

## Quero mudar cor ou fonte

`src/styles/tokens.css`. Cada cor tem versão clara (`:root`) e escura (`[data-theme='dark']`).
Muda ali e vale pro site inteiro, inclusive o `/docs`.

## Quero mudar layout ou espaçamento

É Tailwind, direto no HTML de cada componente:

| Seção | Arquivo |
|---|---|
| Topo (nome, menu, idioma, tema) | `src/components/Header.astro` |
| Hero com a foto | `src/components/home/Hero.astro` |
| Números | `src/components/home/ProofNumbers.astro` |
| Faixa verde do incidente | `src/components/home/IncidentBand.astro` |
| Cards de projetos | `src/components/FeaturedProjects.astro` |
| "Além do script" | `src/components/home/Beyond.astro` |
| Trajetória e ferramentas | `src/components/home/JourneyAndTools.astro` |
| Contato | `src/components/home/Contact.astro` |
| Rodapé | `src/components/Footer.astro` |
| Ordem das seções da home | `src/components/home/HomePage.astro` |

Classes próprias reutilizáveis (`container-page`, `btn btn-primary`, `btn btn-ghost`, `section-label`)
ficam em `src/styles/global.css`.

## Trocar a foto

Substitua `src/assets/willian.jpg` (retrato, de preferência 4:5). O Astro gera AVIF/WebP sozinho.

## Trocar o currículo

Substitua `public/cv/willian-pfeifer-curriculo.pdf` mantendo o mesmo nome. Se quiser outro nome ou
uma versão em inglês, ajuste o `cv` em `src/data/links.ts`.

## Antes de subir

```
npm run check
npm run test:unit
npm run test:e2e
```

Se o E2E passar, o site está navegável, sem link quebrado e sem violação de acessibilidade.
