---
title: 'Optimizing the Cypress test pipeline'
role: 'QA Automation Engineer'
period: '2025'
date: 2025-03-01
stack: ['Cypress', 'JavaScript', 'Bitbucket Pipelines']
problem: 'A legacy Cypress test suite was slow, fragile, and inactive, taking ~2 hours per execution run.'
outcome: 'Reduced execution time from ~2 hours down to ~24 minutes (an ~80% speedup) and re-enabled daily CI execution.'
featured: true
lang: 'en'
translationKey: 'cypress-pipeline-optimization'
---

## Context

The team had an existing Cypress test suite, but it had fallen into disuse due to extreme runtimes—taking over two hours whenever executed.

## Problem

Multiple bottlenecks compounded the pipeline slowdown:
- Misconfigured memory limits and missing Docker layer caching in Bitbucket Pipelines.
- Repetitive validation loops and redundant assertions caused by outdated business rules.
- Reliance on brittle UI-driven authentication flows and arbitrary static waits (`cy.wait(ms)`).
- Accumulated corrupted test state across runs due to lack of environment teardown routines.

## Decisions

- **Infrastructure Tuning:** Optimized Docker memory allocation and enabled dependency/build caching in Bitbucket Pipelines.
- **Fast API Authentication:** Replaced slow, flaky UI login steps with programmatic API authentication, bypassing repeated UI renders.
- **Dynamic Assertions:** Eliminated hardcoded waits in favor of explicit network interceptors (`cy.intercept`) and deterministic DOM assertions.
- **Suite Modernization:** Upgraded Cypress from legacy v6 to v13.5, refactored loops to eliminate redundant checks, and introduced pre-test database state sanitization.

## Outcome

Pipeline execution time dropped from ~2 hours to ~24 minutes—an ~80% reduction in cycle time. The suite was successfully reinstated into the continuous delivery pipeline, providing reliable regression feedback on every pull request.
