# OPEN_QUESTIONS.md — FJ-TestBoard v0.1

| # | Pergunta | Estado | Decisão provisória |
|---|---|---|---|
| Q1 | Quais 3 modelos reais o Felipe vai usar na R001? | Aberto para Felipe | Slots `TBD` em `config/models.yaml` |
| Q2 | Custos por token de cada modelo (para custo/entrega) | Aberto para Felipe | `null` até preencher META |

## Pendências pós-v0.1
- Q3: quantas rodadas reais antes de dar pass@3 como métrica confiável? (hoje: n>=3 tentativas por modelo+tarefa, mas conveniência ≠ significância)
- Q4: exceções (override) de aprovação com check duro falhando devem virar alerta no scoreboard? (hoje só ficam em ratings.jsonl)
- Q5: custo por token de modelos com planos de assinatura (acesso manual sem custo marginal) — como registrar? (hoje: nulo → custo/aprov. vira nulo)
