# PLAN.md — FJ-TestBoard v0.1 (M1–M6)

## Ordem dos módulos
1. **M1** Fundação e contratos: schemas JSON + validação (ajv), guard de visibilidade, envelope de saída, docs base. Risco: contrato de dados mal definido trava tudo → schemas primeiro, tudo validado por evals E1.
2. **M2** Casos fictícios: 5 personas + KPIs + notas de entrevista + armadilhas plantadas (chave de respostas em `private/`). Risco: texto genérico ou vazamento de marca real → checks de blocklist e stopwords.
3. **M3** Tarefas, rubricas e checks automáticos: T01–T12, rubricas por categoria, biblioteca de checks, fixtures mock-good/bad/flaky, lock de prompts. Risco: mock-bad não falhar → iterar até a assinatura de falha bater.
4. **M4** Harnês de execução: round:new, packets, ingest, blind ids, adaptador HTTP genérico, rodada de autoteste R000. Risco: vazamento de nome de modelo no packet → check no ingest.
5. **M5** Avaliação e pontuação: servidor local de rating (127.0.0.1:4173), score/guide, invariantes estatísticas. Risco: estatística errada em amostra pequena → testes com valores calculados à mão.
6. **M6** Dashboard interno, QA e handoff: dashboard offline, README operacional, `npm run verify`, tags m1–m6.

## Riscos principais
- Amostra pequena → sempre exibir `n`, nunca estimar pass@3 sem 3 tentativas, nulls propagam.
- Texto pt-BR ruim → heurística de stopwords + checagens de mojibake/placeholder em todo texto gerado.
- Vazamento público → guard a cada commit; visibilidade só `internal`.

## Premissas
- Acesso manual é o modo padrão; adaptador HTTP fica desligado por padrão.
- Tudo em um repositório local, sem remote, sem push, sem serviços pagos.
