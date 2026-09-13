---
title: 'Optimizing the Cypress test pipeline'
role: 'QA Tester'
period: '2025'
date: 2025-03-01
stack: ['Cypress', 'JavaScript', 'Bitbucket Pipelines']
problem: 'Cypress suite was slow and barely running, taking ~2h to execute.'
outcome: 'Run time dropped to ~24 minutes (a ~80% reduction).'
featured: true
lang: 'en'
translationKey: 'cypress-pipeline-optimization'
---

## Context

A Cypress test suite existed but sat mostly idle, and took around 2 hours to run when it did.

## Problem

The slowness came from several causes: poorly sized memory/cache usage in the infrastructure,
validation functions running in loops, outdated business rules creating redundant checks, and a
general lack of optimization (static waits, UI-based login).

## Decisions

Adjusted infrastructure for memory and cache, reduced loop-based validation functions, updated
business rules to remove redundancy, replaced static waits with API interceptors, moved login to run
entirely through the API, and added a routine to clean up broken data before tests run. Upgraded
Cypress from version 6 to 13, which also brought more optimized test reporting.

## Outcome

Run time dropped from around 2 hours to around 24 minutes — roughly an 80% reduction.
