# Arquitetura — FJ-TestBoard v0.1

Node 20+, JavaScript ESM puro, zero build step. Dependências: `yaml` e `ajv`. Testes com `node:test` nativo.

## Pipeline

```mermaid
flowchart LR
  A[cases + tasks + rubrics] --> B[round:new<br/>packets PROMPT.md + META.yaml]
  B --> C[Felipe cola nos chats<br/>salva saídas em outputs/]
  C --> D[round:ingest<br/>checks + blind ids + runs.jsonl]
  D --> E[rate<br/>servidor local 127.0.0.1:4173]
  E --> F[score + guide<br/>scoreboard.json + relatórios]
  F --> G[dashboard<br/>index.html offline]
  R[guard + lock de prompts] -.protege.-> B
  S[selftest R000<br/>fixtures mock-*] -.valida.-> D
```

## Camadas

| Camada | Onde | Responsabilidade |
|---|---|---|
| Contratos | `schemas/*.schema.json` + `scripts/lib/validate.js` | Validação com ajv |
| Dados | `cases/`, `tasks/`, `rubrics/`, `private/answer-keys/` (local, não distribuído) | Casos fictícios, cartões de tarefa, rubricas, chaves de resposta |
| Checks | `scripts/checks/` | Biblioteca de checagens automáticas (hard/soft) |
| Harnês | `scripts/round-*.js`, `scripts/selftest.js` | Rodadas, packets, ingest, cegamento |
| Avaliação | `scripts/rate.js`, `scripts/score.js`, `scripts/guide.js` | Rating local e estatística |
| Saída | `reports/`, `dashboard/` | Relatórios pt-BR e painel offline |
| Proteção | `scripts/guard.js`, `tasks.lock.json` | Visibilidade `internal`; integridade de prompts |
