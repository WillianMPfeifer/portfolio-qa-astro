---
title: 'Kabins.com.br — Cabin Booking Platform'
role: 'Full-stack Developer & QA Engineer'
period: '2026'
date: 2026-03-01
stack: ['Next.js 16', 'NestJS', 'PostgreSQL', 'Playwright', 'BDD', 'Better Auth', 'Docker', 'Vitest', 'Jest']
problem: 'Need for a decoupled, secure online booking platform for romantic getaways, backed by high test coverage and a fast developer workflow.'
outcome: 'Engineered a modular full-stack platform (Next.js 16 + NestJS), Better Auth security, and 300+ automated tests (unit, integration, and 122 E2E scenarios with Playwright + BDD).'
featured: true
lang: 'en'
translationKey: 'kabins-booking-platform'
url: 'https://kabins.com.br'
repo: 'https://github.com/WillianMPfeifer/cabanas-e2e'
---

## Context

**Kabins.com.br** is a full-stack online booking platform tailored for romantic cabins and secluded retreats, initially focused on Southern Brazil. Built from the ground up with strict layer decoupling, the project emphasizes software quality, automated testing, and security across all customer and administrative workflows.

To guarantee continuous quality and high release confidence, an end-to-end automation suite was built in the companion repository [cabanas-e2e](https://github.com/WillianMPfeifer/cabanas-e2e).

## Problem

Hospitality booking systems involve business-critical, concurrent logic: dynamic availability computation, calendar block validations, reservation locks, and strict host/guest privacy rules.

Without a decoupled architecture and a comprehensive automated testing pyramid, deployments quickly introduce silent regressions, security vulnerabilities, or mobile layout defects. Key objectives included:
- Establishing a strict architectural boundary between client UI and domain services.
- Securing personal data and session state against hijacking and secret leakage.
- Implementing an enterprise-grade E2E suite exercising the actual integrated product (Web + API + PostgreSQL, zero mocks), from core booking flows down to responsive layouts (including 360px mobile viewports).
- Enforcing bug traceability and regression prevention through automated tests.

## Decisions

- **Decoupled Modular Architecture:**
  - Front-end (`cabanas-web`): Built on **Next.js 16** (App Router) adopting *Feature-based Architecture* (`features/` for auth, cabins, bookings, search, dashboard) with Server Components.
  - Back-end (`cabanas-api`): Built on modular **NestJS**, organized by business domain modules, authorization guards, interceptors, and strict TypeScript typing (zero `any`).
- **Data Layer & Persistence:** Relational **PostgreSQL 16** managed via **Prisma ORM**, with versioned migrations and type synchronization with the web client.
- **Hardened Authentication with Better Auth:** Unified relational session management (`session`, `user`, `account`, `verification`), secure `httpOnly` cookies, and password encryption using `Argon2id`.
- **Full Pyramid Testing Strategy:**
  - **Unit & Integration:** Front-end tested with **Vitest** and **Testing Library**. Back-end backed by 200 unit tests in **Jest** and integration test suites (`npm run test:tudo`) running against real PostgreSQL Docker containers.
  - **E2E with Playwright + BDD ([cabanas-e2e](https://github.com/WillianMPfeifer/cabanas-e2e)):**
    - 122 scenarios across 23 features written in Gherkin and driven by Playwright in strict TypeScript.
    - Tested against the real integrated system (front, back, and database with zero mocks), leveraging API-level seed fixtures and data teardown.
    - Established testing patterns: Page Object Model, declarative locators, and custom architectural linting (`check-architecture.mjs`) in CI to preserve test layer boundaries.
    - Multi-environment readiness (`E2E_ENV=local` or `production`) without modifying test code.
- **22 Real Bugs Caught and Shielded Against Regression:**
  - The E2E suite discovered and facilitated fixes for 22 real defects, including critical security issues such as guest PII leaks on public endpoints, Server-Side Request Forgery (SSRF), unauthorized guide access to other cabins, and rate limit locking.

## Outcome

A production-ready booking platform engineered with a strict modular architecture and protected by a benchmark Playwright + BDD end-to-end automation suite.
