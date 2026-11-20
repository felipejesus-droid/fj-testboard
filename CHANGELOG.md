# CHANGELOG

## Entrega pública (primeiro push)
- repositório tornado público pelo dono; `private/answer-keys/` fica fora do git (histórico reescrito antes do push)
- checks de gabarito degradam sem a pasta `private/` (T12 em modo reduzido, sinalizado no detalhe); testes dependentes de gabarito são pulados nesse cenário

## 0.1.0 — Fase de construção (M1–M6)
- M1: schemas JSON (persona, task-card, round, run, rating, scoreboard), validação ajv, guard de visibilidade, envelope de CLI, docs base. Tag `m1-done`.
## M3
- rubrics/A1–C.yaml com âncoras 1/3/5 por critério
- scripts/checks/ com 22 checks + chaves de resposta em private/
- tasks/T01–T12.yaml + tasks.lock.json
- fixtures/mock-{good,bad,flaky}/T01–T12
- correção: rubrics YAML com âncoras citadas; runChecks cerca arquivos de código; pwaStructural extrai blocos fenced (T12)
## M4
- scripts/round-new.js, round-ingest.js, selftest.js, adapters/http-generic.js
## M5
- scripts/lib/scorecore.js, scripts/lib/simulate.js, scripts/score.js, scripts/guide.js, scripts/rate.js + scripts/rater-ui.html
- schemas/scoreboard.schema.json: removido format date-time (padrão regex no validate)
## M6
- scripts/dashboard.js + dashboard/index.html (offline, file://, selftest oculto por padrão)
- scripts/verify.js (schemas, testes, guard, lock, selftest, invariante R000, guia, painel)
- README.md (manual de operação em pt-BR), docs/PHASE2-public.md (esboço)
- rounds/ fora do git (dados operacionais)
