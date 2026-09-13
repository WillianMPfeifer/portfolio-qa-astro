---
title: 'Otimizando o pipeline de testes Cypress'
role: 'QA Tester'
period: '2025'
date: 2025-03-01
stack: ['Cypress', 'JavaScript', 'Bitbucket Pipelines']
problem: 'Suite Cypress lenta e praticamente parada, com ~2h de execução.'
outcome: 'Tempo de execução caiu para ~24 minutos (redução de ~80%).'
featured: true
lang: 'pt'
translationKey: 'cypress-pipeline-optimization'
---

## Contexto

Suite de testes Cypress existia mas ficava parada, sem rodar ativamente, e levava cerca de 2 horas
quando rodava.

## Problema

A lentidão vinha de várias causas: uso de memória e cache mal dimensionado na infraestrutura, funções
de validação rodando em loop, regras de negócio desatualizadas gerando redundância nos testes, e falta
geral de otimização (waits estáticos, login via UI).

## Decisões

Ajustou a infraestrutura pra memória/cache, reduziu funções em loop de validação, atualizou as regras
de negócio pra eliminar redundância, substituiu waits estáticos por interceptadores de API, passou o
login a ser feito totalmente via API, e adicionou uma rotina de limpeza de dados quebrados antes dos
testes. Atualizou o Cypress da versão 6 pra 13, o que também trouxe relatórios de teste mais
otimizados.

## Resultado

Tempo de execução caiu de cerca de 2 horas para cerca de 24 minutos — uma redução de aproximadamente
80%.
