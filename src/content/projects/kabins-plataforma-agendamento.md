---
title: 'Kabins.com.br — Plataforma de Agendamento'
role: 'Desenvolvedor Full-stack & QA'
period: '2026'
date: 2026-03-01
stack: ['Next.js 16', 'NestJS', 'PostgreSQL', 'Playwright', 'BDD', 'Better Auth', 'Docker', 'Vitest', 'Jest']
problem: 'Necessidade de uma plataforma desacoplada e segura para agendamento online de cabanas e refúgios, com alta cobertura de testes e fluxo de execução ágil.'
outcome: 'Arquitetura modular (Next.js 16 + NestJS), autenticação com Better Auth e mais de 300 testes automatizados (unitários, integração e 122 cenários E2E com Playwright + BDD).'
featured: true
lang: 'pt'
translationKey: 'kabins-booking-platform'
url: 'https://kabins.com.br'
repo: 'https://github.com/WillianMPfeifer/cabanas-e2e'
---

## Contexto

O **Kabins.com.br** é uma plataforma completa de agendamento online de cabanas e refúgios para casais, com foco inicial na região Sul do Brasil. O projeto foi projetado e construído do zero com separação estrita entre front-end e back-end, priorizando segurança, manutenibilidade e alta confiabilidade em cada fluxo de negócio.

Para assegurar a qualidade contínua e a estabilidade da plataforma, foi desenvolvida uma suíte completa de testes de ponta a ponta disponível no repositório [cabanas-e2e](https://github.com/WillianMPfeifer/cabanas-e2e).

## Problema

Sistemas de reservas lidam com regras de negócio críticas e concorrentes: cálculo dinâmico de disponibilidade, bloqueios de calendário, gestão de estadias e controle rígido de privacidade de hóspedes e anfitriões.

Sem uma arquitetura desacoplada e uma pirâmide abrangente de testes automatizados, novos deploys facilmente introduzem regressões silenciosas, brechas de segurança ou falhas de usabilidade em dispositivos móveis. Era fundamental:
- Estabelecer uma separação arquitetural estrita entre a interface e os serviços de domínio.
- Proteger dados sensíveis e autenticação corporativa via tokens e sessões resistentes a vazamentos.
- Criar uma automação E2E robusta que exercitasse o produto real (Web + API + PostgreSQL, sem mocks), cobrindo de regras de negócio a layouts responsivos (inclusive a 360px no celular).
- Garantir rastreabilidade de bugs com validações automatizadas de regressão.

## Decisões

- **Arquitetura modular desacoplada:**
  - Front-end (`cabanas-web`): Desenvolvido em **Next.js 16** (App Router) adotando *Feature-based Architecture* (`features/` para domínios como auth, cabins, bookings, search, dashboard) com Server Components.
  - Back-end (`cabanas-api`): Construído em **NestJS** modular, estruturado por domínios de negócio, guards de autorização, interceptors e tipagem estrita com TypeScript (zero `any`).
- **Persistência e integridade:** Banco de dados relacional **PostgreSQL 16** com **Prisma ORM**, migrações versionadas e sincronização de tipos com o cliente Web.
- **Autenticação segura com Better Auth:** Gestão unificada de sessões no banco relacional (`session`, `user`, `account`, `verification`), cookies seguros `httpOnly` e criptografia com algoritmo `Argon2id`.
- **Estratégia completa de testes em pirâmide:**
  - **Unitários & Integração:** No front-end, testes de componentes e UI com **Vitest** e **Testing Library**. No back-end, 200 testes unitários em **Jest** e suíte de integração (`npm run test:tudo`) executada contra uma instância real de PostgreSQL no Docker.
  - **E2E com Playwright + BDD ([cabanas-e2e](https://github.com/WillianMPfeifer/cabanas-e2e)):**
    - 122 cenários em 23 funcionalidades escritas em Gherkin e executadas pelo Playwright em TypeScript estrito.
    - Testes sobre o produto real integrado (front, back e banco real, sem nenhum mock), com criação de massa de dados via API e fixtures.
    - Padrões arquiteturais sólidos: Page Object Model, Locators declarativos e linter próprio (`check-architecture.mjs`) no CI para garantir o isolamento das camadas de teste.
    - Suíte configurada para múltiplos ambientes (`E2E_ENV=local` ou `production`) sem alteração de código.
- **22 bugs reais encontrados e blindados contra regressão:**
  - A suíte identificou e levou à correção de 22 falhas reais, incluindo vulnerabilidades críticas como vazamento de dados pessoais (PII) por rota pública, Server-Side Request Forgery (SSRF), falha de autorização no guia digital de cabanas e inconsistências no cálculo de reservas.

## Resultado

Uma plataforma de agendamento moderna, robusta e segura, operando com cobertura de ponta a ponta e uma suíte de automação E2E de referência no ecossistema Playwright + BDD.
