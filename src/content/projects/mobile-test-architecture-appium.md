---
title: 'Mobile test architecture with Appium'
role: 'QA Tester'
period: '2025'
date: 2025-08-01
stack: ['Python', 'Appium', 'BDD']
problem: 'No mobile automation existed; every change required a full day of manual retesting.'
outcome: 'A working suite covering the main flows of the Education module.'
featured: true
lang: 'en'
translationKey: 'mobile-automation-appium'
---

## Context

No mobile automation existed. Every app change required a full manual regression test.

## Problem

A full manual retest took at least a full day of one person's time for every change. Automating
mobile also turned out to be slower than web — selecting elements was straightforward, but writing the
tests around them took much longer. The app has a sync function that pushes data to the web system,
and every test scenario had to trigger that sync and wait, adding extra time.

## Decisions

Chose Python for its development practicality and library ecosystem. Chose Appium for its wide
adoption and its fit with BDD, already part of the daily web automation workflow. For the sync
bottleneck, built a reusable BDD step that handles the tap-and-wait instead of repeating that logic in
every scenario.

## Outcome

A working automation suite covering the main flows of the Education module, with a reusable sync step
resolving the wait bottleneck across all scenarios.
