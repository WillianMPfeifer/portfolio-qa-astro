---
title: 'Arquitetura de testes mobile com Appium'
role: 'QA Tester'
period: '2025'
date: 2025-08-01
stack: ['Python', 'Appium', 'BDD']
problem: 'Nenhuma automação mobile existia; toda mudança exigia um dia inteiro de reteste manual.'
outcome: 'Suite funcional cobrindo os principais fluxos do módulo de Educação.'
featured: true
lang: 'pt'
translationKey: 'mobile-automation-appium'
---

## Contexto

Não existia automação mobile. Toda alteração no app exigia reteste manual completo.

## Problema

O reteste manual completo tomava pelo menos um dia inteiro de uma pessoa a cada mudança. Automatizar
mobile também se mostrou mais lento que web — selecionar elementos era tranquilo, mas desenvolver os
testes em cima deles levava bem mais tempo. O app tem uma função de sincronizar dados com o sistema
web, e cada cenário de teste precisava clicar em sincronizar e esperar, o que consumia tempo extra.

## Decisões

Python pela praticidade de desenvolvimento e disponibilidade de bibliotecas. Appium por ser amplamente
usado e combinar bem com BDD, que já fazia parte do dia a dia com automação web. Para o problema de
sincronização, criou um passo reutilizável no BDD que já cuida do clique e da espera, em vez de
repetir essa lógica em cada cenário.

## Resultado

Suite de automação funcional cobrindo os principais fluxos do módulo de Educação, com um passo
reutilizável de sincronização resolvendo o gargalo de espera em todos os cenários.
