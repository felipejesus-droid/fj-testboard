# FJ-TestBoard v0.1 — Resumo do PRD

## Problema
Benchmarks públicos (código, matemática, provas difíceis) não medem as entregas que uma consultoria de transformação digital vende a PMEs e profissionais liberais brasileiros: diagnóstico de maturidade digital, PRD, capacitação em IA, apresentação com base em dados, conteúdo social e PWA.

## Produto
Benchmark **privado** que compara modelos de IA nessas entregas, com casos fictícios e avaliação humana.

## Objetivos de Felipe
1. Escolher o modelo certo por tipo de entrega.
2. Saber quando trocar de modelo.
3. (Fase 2) Produzir conteúdo público de autoridade com base nos resultados.

## Sucesso (v0.1)
Uma rodada completa com ~9 horas de avaliação humana: 12 tarefas × 3 modelos × 1 tentativa = 36 entregas, ~15 min de leitura por entrega.

## Regras inegociáveis
- Tudo que aparece para o usuário é pt-BR natural; código e chaves em inglês.
- Nenhum dado real de cliente, marca real, CNPJ real, pessoa real.
- Prompt congelado não menciona "Método DELTA" nem "FJ Smart Score".
- Toda entrega interna (`visibility: internal`); o público é Fase 2.
- Nenhum resultado inventado: fixtures sintéticas só em rodadas `R000*`.
- Sem chaves em arquivos; APIs opcionais leem variáveis de ambiente.
- Sem banco, sem servidor além do avaliador local, sem build step, sem nuvem.
