// Textos das páginas internas (projetos, case study, qualidade), em pt e en.
import type { Locale } from './home';

export const ui = {
  pt: {
    projects: {
      title: 'Projetos',
      intro: 'Casos reais de automação, contados em contexto, problema, decisões e resultado.',
      role: 'Papel',
      previous: 'Anterior',
      next: 'Próximo',
      back: 'Todos os projetos',
      navLabel: 'Navegação entre projetos',
    },
    quality: {
      title: 'Qualidade deste site',
      intro:
        'Este site tem a própria suíte de testes rodando no GitHub Actions a cada push. Os números abaixo são do último run.',
      lastRun: 'Última execução',
      viewRun: 'ver no GitHub',
      scenarios: 'Cenários de teste',
      a11y: 'Acessibilidade',
      a11yLine: (violations: number, routes: number) => `${violations} violações em ${routes} páginas (axe, WCAG 2 AA)`,
      lighthouse: 'Lighthouse',
      size: 'Tamanho',
      pageWeight: 'Peso da home',
      pageWeightHint: 'O que o navegador baixa ao abrir a página inicial (medido pelo Lighthouse).',
      bundle: 'Arquivos do build',
      bundleHint: 'Soma de tudo que é publicado: páginas, imagens, fontes, docs e o currículo em PDF. Ninguém baixa tudo de uma vez.',
      unavailable: 'indisponível',
      bestPractices: 'Boas práticas',
    },
  },
  en: {
    projects: {
      title: 'Projects',
      intro: 'Real automation work, told as context, problem, decisions and outcome.',
      role: 'Role',
      previous: 'Previous',
      next: 'Next',
      back: 'All projects',
      navLabel: 'Project navigation',
    },
    quality: {
      title: 'Quality of this site',
      intro: 'This site has its own test suite running on GitHub Actions on every push. The numbers below come from the latest run.',
      lastRun: 'Last run',
      viewRun: 'view on GitHub',
      scenarios: 'Test scenarios',
      a11y: 'Accessibility',
      a11yLine: (violations: number, routes: number) => `${violations} violations across ${routes} pages (axe, WCAG 2 AA)`,
      lighthouse: 'Lighthouse',
      size: 'Size',
      pageWeight: 'Home page weight',
      pageWeightHint: 'What the browser downloads when opening the home page (measured by Lighthouse).',
      bundle: 'Build output',
      bundleHint: 'Everything that gets published: pages, images, fonts, docs and the résumé PDF. Nobody downloads all of it at once.',
      unavailable: 'unavailable',
      bestPractices: 'Best Practices',
    },
  },
} satisfies Record<Locale, unknown>;
