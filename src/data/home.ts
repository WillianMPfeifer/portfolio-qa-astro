// Todo o texto da home, em português (pt) e inglês (en).
// Regra: só fato real (fonte: docs/me/sobre_mim.md). Se mudar algo em pt, muda o mesmo item em en.

export type Locale = 'en' | 'pt';

export interface GherkinStep {
  keyword: string;
  text: string;
}

export interface QualityLineInput {
  passed: number;
  total: number;
  violations: number;
  routes: number;
  performance: string;
}

export interface HomeContent {
  meta: { title: string; description: string };
  nav: { projects: string; quality: string; docs: string; themeToggle: string; language: string };
  hero: {
    status: string;
    name: string;
    lead: string;
    location: string;
    emailCta: string;
    cvCta: string;
    photoAlt: string;
  };
  proof: {
    label: string;
    items: { value: string; label: string; source: string }[];
  };
  incident: {
    label: string;
    title: string;
    body: string;
    languageTag: string | null;
    feature: GherkinStep;
    scenario: GherkinStep;
    steps: GherkinStep[];
    table: { header: [string, string]; rows: string[]; passed: string };
    note: { before: string; link: string; after: string };
  };
  projects: {
    label: string;
    title: string;
    problem: string;
    outcome: string;
    readCase: string;
    seeAll: string;
    freelance: { before: string; link: string; middle: string; secondLink: string; after: string };
  };
  beyond: { label: string; title: string; intro: string; items: string[] };
  journey: {
    label: string;
    title: string;
    intro: string;
    items: { period: string; role: string; place: string; detail: string }[];
  };
  tools: {
    label: string;
    title: string;
    groups: { name: string; items: string[] }[];
    certsTitle: string;
    certs: string[];
    certsLink: string;
  };
  contact: {
    label: string;
    title: string;
    body: string;
    qualityLine: (q: QualityLineInput) => string;
    qualityLink: string;
  };
  footer: { madeWith: string; source: string };
}

export const home: Record<Locale, HomeContent> = {
  pt: {
    meta: {
      title: 'Willian Pfeifer — QA Automation',
      description:
        'QA Automation com Cypress, Appium e BDD. 115 cenários E2E automatizados e CI rodando em sistema de gestão pública.',
    },
    nav: {
      projects: 'Projetos',
      quality: 'Qualidade',
      docs: 'Docs',
      themeToggle: 'Alternar tema claro ou escuro',
      language: 'Idioma',
    },
    hero: {
      status: 'QA Automation, aberto a vagas remotas',
      name: 'Willian Pfeifer',
      lead: 'Há um ano e meio cuido da qualidade de um sistema de gestão pública. Reativei uma suíte Cypress que estava parada, montei outra do zero com BDD e coloquei as duas no CI. Quando um script apagou dados em produção, foram elas que confirmaram que a recuperação deu certo.',
      location: 'Frederico Westphalen, RS',
      emailCta: 'Mandar e-mail',
      cvCta: 'Baixar currículo (PDF)',
      photoAlt: 'Willian Pfeifer, de óculos e camisa verde, num escritório',
    },
    proof: {
      label: 'Em números',
      items: [
        { value: '115', label: 'cenários E2E web automatizados', source: 'suítes Cypress de 2 módulos' },
        { value: '114', label: 'bugs válidos reportados', source: 'Jira, desde mar/2025' },
        { value: '2h → 24min', label: 'tempo da suíte Cypress depois da otimização', source: 'case do pipeline' },
        { value: '3', label: 'módulos sob minha responsabilidade', source: 'Saúde, Educação e Legislativo' },
      ],
    },
    incident: {
      label: 'O caso que eu mais gosto de contar',
      title: 'O dia em que um script apagou dados em produção',
      body: 'A infraestrutura rodou os scripts de recuperação numa máquina isolada. Apontei as suítes E2E de Saúde e Educação pra ela e rodei em paralelo, depois repeti em homologação e em produção. A validação que levaria pelo menos uma noite inteira à mão ficou com a automação.',
      languageTag: '# language: pt',
      feature: { keyword: 'Funcionalidade', text: 'Recuperação de dados em produção' },
      scenario: { keyword: 'Cenário', text: 'validar o sistema depois da restauração' },
      steps: [
        { keyword: 'Dado', text: 'que os scripts de recuperação rodaram numa máquina isolada' },
        { keyword: 'Quando', text: 'as suítes de Saúde e Educação rodam em paralelo contra ela' },
        { keyword: 'Então', text: 'a recuperação é validada em cada ambiente:' },
      ],
      table: {
        header: ['ambiente', 'resultado'],
        rows: ['máquina isolada', 'homologação', 'produção'],
        passed: 'passou',
      },
      note: { before: 'Escrevi sobre esse dia ', link: 'no LinkedIn', after: ': 152 reações e 15.410 impressões.' },
    },
    projects: {
      label: 'Projetos',
      title: 'Casos, com contexto e decisão',
      problem: 'Problema',
      outcome: 'Resultado',
      readCase: 'Ler o caso completo',
      seeAll: 'Ver todos os projetos',
      freelance: {
        before: 'Fora da automação, desenvolvi projetos web como o ',
        link: 'redesign do Hospital Veterinário Anibem 24h',
        middle: ' e a landing page da ',
        secondLink: 'Lava Center Lavanderia Self-Service',
        after: ', ambos em HTML5, Tailwind e JavaScript com foco em SEO local e performance.',
      },
    },
    beyond: {
      label: 'Além do script',
      title: 'Fui contratado como testador. Na prática, virei o QA do time.',
      intro: 'E estou assumindo os outros módulos da empresa. O que isso inclui hoje:',
      items: [
        'Treinei e coordeno o outro testador do módulo.',
        'Cubro o analista de negócios em férias e ausências.',
        'Faço pair programming com os devs nas regras de negócio e leio o código (front e API) antes de testar.',
        'Montei a arquitetura base de automação para Tributos, Contabilidade e Folha, que estão migrando de Delphi para Java 21.',
        'Documento testes e processos no Confluence e levo ferramentas novas para as reuniões do time.',
        'Desenvolvo com IA no dia a dia (Gemini, Claude). Este site foi feito assim, e a suíte de testes dele é o que me diz se ficou certo.',
      ],
    },
    journey: {
      label: 'Trajetória',
      title: 'Do técnico agrícola ao QA',
      intro: 'Caminho fora do padrão, e cada parada deixou alguma coisa que eu uso hoje.',
      items: [
        {
          period: 'até 2028',
          role: 'Sistemas de Informação',
          place: 'UFSM, Frederico Westphalen',
          detail: 'Graduação em andamento.',
        },
        {
          period: 'mar/2025 – hoje',
          role: 'QA',
          place: 'Digifred Sistemas',
          detail: 'Automação web e mobile, CI e o processo de QA de três módulos.',
        },
        {
          period: 'fim de 2025 – início de 2026',
          role: 'Google Cloud Facilitator',
          place: 'Programa Google Cloud',
          detail: 'Apresentei cursos do Google Cloud, coordenei participantes e representei o programa numa feira de profissões.',
        },
        {
          period: 'nov/2024 – mar/2025',
          role: 'Técnico de infraestrutura de redes',
          place: 'LS Soluções em Tecnologia',
          detail: 'Cabeamento e configuração de rede em agências de uma cooperativa de crédito.',
        },
        {
          period: '2024',
          role: 'Professor de estágio',
          place: 'Casa Familiar Rural de Riqueza/SC',
          detail: 'Acompanhei o estágio de 60 alunos do técnico, da documentação à avaliação.',
        },
        {
          period: '2023',
          role: 'Estágio em desenvolvimento Java',
          place: 'Noagro Sistemas',
          detail: 'Primeiro contato com código: telas desktop e banco de dados.',
        },
        {
          period: '2023',
          role: 'Técnico em Agropecuária',
          place: 'Casa Familiar Rural de Riqueza/SC',
          detail: 'Formação técnica, antes de qualquer linha de código.',
        },
      ],
    },
    tools: {
      label: 'Ferramentas',
      title: 'Com o que eu trabalho',
      groups: [
        { name: 'Automação', items: ['Cypress', 'Appium', 'Playwright', 'BDD / Gherkin', 'Page Object Model', 'Allure'] },
        { name: 'Linguagens', items: ['JavaScript', 'Python', 'Java'] },
        { name: 'API, desempenho e segurança', items: ['Postman', 'JMeter', 'Chrome DevTools', 'Burp Suite'] },
        { name: 'CI e infraestrutura', items: ['Bitbucket Pipelines', 'GitHub Actions', 'Docker'] },
        { name: 'Dia a dia', items: ['Jira', 'Confluence', 'Git'] },
      ],
      certsTitle: 'Certificações',
      certs: [
        'Google Cloud Computing Foundations',
        'Google Project Management',
        'Google AI Essentials',
        '4 skill badges do Google Cloud',
      ],
      certsLink: 'Ver no Credly',
    },
    contact: {
      label: 'Contato',
      title: 'Vamos conversar',
      body: 'Procuro vaga remota em QA Automation, no Brasil ou fora. Me chama por e-mail ou WhatsApp.',
      qualityLine: (q) =>
        `Este site também é testado: ${q.passed} de ${q.total} cenários E2E passando, ${q.violations} violações de acessibilidade em ${q.routes} páginas e Lighthouse ${q.performance} em performance.`,
      qualityLink: 'Ver o relatório',
    },
    footer: { madeWith: 'Feito com Astro, testado com Playwright.', source: 'Código no GitHub' },
  },

  en: {
    meta: {
      title: 'Willian Pfeifer — QA Automation',
      description:
        'QA Automation with Cypress, Appium and BDD. 115 automated E2E scenarios and CI running on a public-sector management system.',
    },
    nav: {
      projects: 'Projects',
      quality: 'Quality',
      docs: 'Docs',
      themeToggle: 'Toggle color theme',
      language: 'Language',
    },
    hero: {
      status: 'QA Automation, open to remote roles',
      name: 'Willian Pfeifer',
      lead: "For the last year and a half I've owned quality on a public-sector management system. I revived a Cypress suite nobody was running, built a second one from scratch with BDD, and put both in CI. When a script wiped production data, those suites are what confirmed the recovery worked.",
      location: 'Frederico Westphalen, Brazil',
      emailCta: 'Email me',
      cvCta: 'Resume (PDF, Portuguese)',
      photoAlt: 'Willian Pfeifer, wearing glasses and a green shirt, in an office',
    },
    proof: {
      label: 'By the numbers',
      items: [
        { value: '115', label: 'automated E2E web scenarios', source: 'Cypress suites, 2 modules' },
        { value: '114', label: 'valid bugs reported', source: 'Jira, since Mar 2025' },
        { value: '2h → 24min', label: 'Cypress suite runtime after optimization', source: 'pipeline case study' },
        { value: '3', label: 'modules I am responsible for', source: 'Health, Education and Legislative' },
      ],
    },
    incident: {
      label: 'The story I like telling most',
      title: 'The day a script wiped production data',
      body: 'Infrastructure ran the recovery scripts on an isolated machine. I pointed the Health and Education E2E suites at it and ran them in parallel, then repeated the run on staging and production. Validation that would have taken at least a full night by hand was done by the automation.',
      languageTag: null,
      feature: { keyword: 'Feature', text: 'Production data recovery' },
      scenario: { keyword: 'Scenario', text: 'validate the system after the restore' },
      steps: [
        { keyword: 'Given', text: 'the recovery scripts ran on an isolated machine' },
        { keyword: 'When', text: 'the Health and Education suites run against it in parallel' },
        { keyword: 'Then', text: 'the recovery is validated in each environment:' },
      ],
      table: {
        header: ['environment', 'result'],
        rows: ['isolated machine', 'staging', 'production'],
        passed: 'passed',
      },
      note: { before: 'I wrote about that day ', link: 'on LinkedIn', after: ': 152 reactions and 15,410 impressions.' },
    },
    projects: {
      label: 'Projects',
      title: 'Case studies, with context and decisions',
      problem: 'Problem',
      outcome: 'Outcome',
      readCase: 'Read the full case',
      seeAll: 'See all projects',
      freelance: {
        before: 'Outside automation, I have built web projects like the ',
        link: 'redesign of the Anibem 24h Veterinary Hospital website',
        middle: ' and the landing page for ',
        secondLink: 'Lava Center Self-Service Laundromat',
        after: ', both built with HTML5, Tailwind and JavaScript focusing on local SEO and performance.',
      },
    },
    beyond: {
      label: 'Beyond the script',
      title: 'I was hired as a tester. In practice, I became the team’s QA.',
      intro: "And I'm now taking on the company's other modules. Today that includes:",
      items: [
        'I trained and now coordinate the module’s other tester.',
        'I cover for the business analyst during vacations and absences.',
        'I pair with developers on business rules and read the code (front end and API) before testing.',
        'I built the base automation architecture for the Tax, Accounting and Payroll modules, which are migrating from Delphi to Java 21.',
        'I document tests and processes in Confluence and bring new tools to team meetings.',
        'I build with AI every day (Gemini, Claude). This site was built that way, and its test suite is what tells me it came out right.',
      ],
    },
    journey: {
      label: 'Path',
      title: 'From agricultural technician to QA',
      intro: 'Not the usual route, and every stop left something I still use.',
      items: [
        {
          period: 'until 2028',
          role: 'B.S. in Information Systems',
          place: 'UFSM, Frederico Westphalen',
          detail: 'In progress.',
        },
        {
          period: 'Mar 2025 – now',
          role: 'QA',
          place: 'Digifred Sistemas',
          detail: 'Web and mobile automation, CI and the QA process for three modules.',
        },
        {
          period: 'late 2025 – early 2026',
          role: 'Google Cloud Facilitator',
          place: 'Google Cloud program',
          detail: 'Presented Google Cloud courses, coordinated participants and represented the program at a career fair.',
        },
        {
          period: 'Nov 2024 – Mar 2025',
          role: 'Network infrastructure technician',
          place: 'LS Soluções em Tecnologia',
          detail: 'Structured cabling and network setup in credit union branches.',
        },
        {
          period: '2024',
          role: 'Internship coordinator and teacher',
          place: 'Casa Familiar Rural, Riqueza/SC',
          detail: 'Ran the internships of 60 technical-school students, from paperwork to evaluation.',
        },
        {
          period: '2023',
          role: 'Java development intern',
          place: 'Noagro Sistemas',
          detail: 'First contact with code: desktop screens and databases.',
        },
        {
          period: '2023',
          role: 'Agricultural technician',
          place: 'Casa Familiar Rural, Riqueza/SC',
          detail: 'Technical degree, before any line of code.',
        },
      ],
    },
    tools: {
      label: 'Tools',
      title: 'What I work with',
      groups: [
        { name: 'Automation', items: ['Cypress', 'Appium', 'Playwright', 'BDD / Gherkin', 'Page Object Model', 'Allure'] },
        { name: 'Languages', items: ['JavaScript', 'Python', 'Java'] },
        { name: 'API, performance and security', items: ['Postman', 'JMeter', 'Chrome DevTools', 'Burp Suite'] },
        { name: 'CI and infrastructure', items: ['Bitbucket Pipelines', 'GitHub Actions', 'Docker'] },
        { name: 'Day to day', items: ['Jira', 'Confluence', 'Git'] },
      ],
      certsTitle: 'Certifications',
      certs: [
        'Google Cloud Computing Foundations',
        'Google Project Management',
        'Google AI Essentials',
        '4 Google Cloud skill badges',
      ],
      certsLink: 'See them on Credly',
    },
    contact: {
      label: 'Contact',
      title: "Let's talk",
      body: "I'm looking for a remote QA Automation role, in Brazil or abroad. Reach me by email or WhatsApp.",
      qualityLine: (q) =>
        `This site is tested too: ${q.passed} of ${q.total} E2E scenarios passing, ${q.violations} accessibility violations across ${q.routes} pages, and a Lighthouse performance score of ${q.performance}.`,
      qualityLink: 'See the report',
    },
    footer: { madeWith: 'Built with Astro, tested with Playwright.', source: 'Source on GitHub' },
  },
};
