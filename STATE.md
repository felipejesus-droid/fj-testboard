# STATE.md — FJ-TestBoard v0.1

## Status atual
- Módulo corrente: M3
- Unidades concluídas: M1 (U1.1–U1.6); M2 (personas, KPIs, notas, armadilhas)
- Próxima unidade: U3.1 (cartões T01–T12)
- Bloqueios: —

## Decisões recentes
- (ver DECISIONS.md)

## Tabela de custo por unidade
| Unidade | Tier | Tokens (est.) | Retries | Tempo | Pass? |
|---|---|---|---|---|---|
| U1.1 | Mid | n/d | 0 | 5 min | sim |
| U1.2 | Highest | n/d | 2 | 25 min | sim |
| U1.3 | Mid | n/d | 1 | 10 min | sim |
| U1.4 | Mid | n/d | 1 | 15 min | sim |
| U1.5 | Lowest | n/d | 0 | 5 min | sim |
| U1.6 | Lowest | n/d | 0 | 10 min | sim |
| M2 personas/KPIs/notas | Mid | n/d | 2 (escapes yaml/json) | 40 min | sim |
| M2 armadilhas + evals | Highest | n/d | 1 (multiline regex) | 15 min | sim |

## M3 — concluído
- 12 cartões de tarefa (T01–T12) validados; prompts congelados em pt-BR bloqueados por sha256 em tasks.lock.json.
- Biblioteca de 22 checks (duros e macios) registrada; arquivos de saída em formato código cercados antes dos checks textuais.
- Fixtures completos: mock-good passa em todos os duros; mock-bad falha ao menos 1; mock-flaky falha 1 duro sutil (T12: 7/12 defeitos).
- Testes: 24 passando (npm test). TAG: m3-done.
