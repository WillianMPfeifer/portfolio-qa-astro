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
      intro: 'Real-world software testing and engineering cases: problem discovery, architectural decisions, and measurable outcomes.',
      role: 'Role',
      previous: 'Previous',
      next: 'Next',
      back: 'All projects',
      navLabel: 'Project navigation',
    },
    quality: {
      title: 'Site Quality & Test Report',
      intro:
        'This portfolio is continuously tested by its own automated test suite on GitHub Actions with every push. Metrics below reflect the latest run.',
      lastRun: 'Latest run',
      viewRun: 'View on GitHub',
      scenarios: 'Automated scenarios',
      a11y: 'Accessibility',
      a11yLine: (violations: number, routes: number) => `${violations} violations across ${routes} pages (axe-core, WCAG 2 AA)`,
      lighthouse: 'Lighthouse',
      size: 'Size',
      pageWeight: 'Home page weight',
      pageWeightHint: 'Total payload transferred when loading the home page (measured by Lighthouse).',
      bundle: 'Build output',
      bundleHint: 'Sum of all published assets: HTML pages, images, fonts, docs, and resume PDFs.',
      unavailable: 'unavailable',
      bestPractices: 'Best Practices',
    },
  },
} satisfies Record<Locale, unknown>;
