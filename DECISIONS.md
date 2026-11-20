# DECISIONS.md — FJ-TestBoard v0.1

Formato: Decisão | Motivo | Como mudar.

| # | Decisão | Motivo | Como mudar |
|---|---|---|---|
| D001 | Ids de entrega `<task>__<model>__a<n>` com slug do modelo | Nomes de slot podem conter hífens; slug evita ambiguidade no path | Alterar `slugify()` em `scripts/lib/util.js` |
| D002 | Servidor de rating só escuta 127.0.0.1:4173 | Regra de privacidade: nada exposto além do localhost | Editar host/porta em `scripts/rate.js` |
| D003 | Blind ids gerados com `crypto.randomBytes`, colisão rejeitada | Bijetividade exigida pelo brief | Nenhuma; requisito fixo |
