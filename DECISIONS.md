# DECISIONS.md — FJ-TestBoard v0.1

Formato: Decisão | Motivo | Como mudar.

| # | Decisão | Motivo | Como mudar |
|---|---|---|---|
| D001 | Ids de entrega `<task>__<model>__a<n>` com slug do modelo | Nomes de slot podem conter hífens; slug evita ambiguidade no path | Alterar `slugify()` em `scripts/lib/util.js` |
| D002 | Servidor de rating só escuta 127.0.0.1:4173 | Regra de privacidade: nada exposto além do localhost | Editar host/porta em `scripts/rate.js` |
| D003 | Blind ids gerados com `crypto.randomBytes`, colisão rejeitada | Bijetividade exigida pelo brief | Nenhuma; requisito fixo |

## Decisões M3–M6
- D-07: arquivos de saída com formato código (.html/.js/.webmanifest etc.) são cercados (fence) antes dos checks textuais genéricos, evitando falso-positivo de placeholder/idioma; checks de PWA leem os arquivos direto do mapa de saída.
- D-08: pwaStructural extrai os 3 blocos de código do revisado (T12) quando a saída é markdown único; mesmas regras dos dois caminhos.
- D-09: rubricas citam âncoras como strings YAML (escalar com ": " em texto puro quebrava o parser).
- D-10: mock-flaky deve falhar exatamente um check duro sutil (exceto T07/T08, onde o flaky é "magro" demais nos macios, e T12, que corrige 7/12 defeitos) → aprovação simulada distingue bom/flaco/ruim.
- D-11: avaliação simulada do R000-selftest é determinística, marcada como "simulado-selftest" e nunca representa modelo real.
- D-12: adaptador HTTP genérico existe (FJTB_API_URL/KEY/MODEL em variáveis de ambiente), desabilitado por padrão; modo padrão da v0.1 permanece manual.
- D-13: round.yaml segue o esquema estrito; a lista de entregas fica em deliveries.yaml (lado-a-lado), evitando additionalProperties.
- D-14: aviso de descegamento: ingest escaneia a saída por nomes de fornecedor/modelo e emite aviso no envelope.
- D-15: rounds/ são dados operacionais (regeneráveis via selftest) e ficam fora do git; scoreboards ficam no diretório da rodada.
- D-16: revelação do blind-map no avaliador só quando toda a rodada está avaliada (API /api/reveal devolve 403 caso contrário).
