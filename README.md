# FJ-TestBoard v0.1

Bench privado da **FJ Smart — Inteligência Pessoal** para comparar modelos de IA em entregas de consultoria para pequenas empresas brasileiras. Modo **manual**: você cola o prompt no modelo, salva a resposta e o fluxo faz o resto — blindagem, avaliação assistida, score e guia.

Aviso permanente: **dados internos**. Nada aqui é público; cegos e blind-map ficam dentro do repositório local.

## Instalação

Requisitos: Node 22+. Sem build, sem banco, sem servidor fixo (só o painel local opcional na porta 4173).

```
npm install
npm run verify
```

`npm run verify` valida schemas, cartões, testes, guard de visibilidade, lock de prompts e roda o selftest de ponta a ponta (rodada sintética R000-selftest). Deve terminar com `"status":"success"`.

## Rodada real, passo a passo

1. **Criar a rodada** (12 tarefas x N modelos):

   ```
   npm run round:new -- R001 --models "claude,gpt,gemini"
   ```

   Cada pacote fica em `rounds/R001/packets/<delivery_id>/PROMPT.md` — **cole exatamente esse texto** no modelo correspondente.

2. **Salvar as respostas**: coloque os arquivos de saída (com os nomes exatos que o PROMPT.md pede, ex.: `deck.md`) dentro de `rounds/R001/packets/<delivery_id>/saida/` e crie um `META.yaml` ao lado:

   ```yaml
   model:
     vendor: Anthropic
     name: claude
     version_label: 2025-06
     access: manual
   tokens_in: 1234        # opcional
   tokens_out: 900        # opcional
   cost_brl: 0.12         # opcional (R$)
   duration_s: 95         # opcional
   tools_actually_used: [] # ex.: ["web_search"] se o modelo buscou na web
   date: 2025-11-10T10:00:00Z
   ```

3. **Ingerir e cegar** (valida contras o lock, roda os checks automáticos e cria os IDs cegos):

   ```
   npm run round:ingest -- R001
   ```

   Saída cega fica em `rounds/R001/blind/<blind_id>/`. O par cego↔entrega só é revelável com a rodada completa (aviso automático se a saída citar nome de modelo).

4. **Avaliar**:

   ```
   npm run rate -- R001
   ```

   Abre `http://127.0.0.1:4173`. Para cada entrega: 5 notas de 0 a 5 com as âncoras da rubrica à mão, aprovação (com motivo obrigatório se algum check duro falhar), minutos até ficar publicável e anotações. Os modelos ficam escondidos; o nome só aparece quando toda a rodada está avaliada.

5. **Pontuar e gerar o guia**:

   ```
   npm run score -- R001
   npm run guide -- R001
   ```

   `score` grava `rounds/R001/scoreboard.json` (score ponderado, aprovações, pass@1/pass@3, mediana de minutos, custo por entrega aprovada, Δ vs rodada anterior). `guide` grava `docs/model-guide.md` com recomendação por categoria.

6. **Painel**:

   ```
   npm run dashboard
   ```

   Gera `dashboard/index.html` — abra direto no navegador (funciona offline, com `file://` e sem rede).

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm test` | Testes das bibliotecas e do fluxo |
| `npm run check` | Valida schemas e casos |
| `npm run check:prompts` | Confere o lock dos prompts congelados |
| `npm run guard` | Garante visibilidade `internal` e ausência de páginas públicas |
| `npm run round:new -- R001 --models "a,b"` | Cria pacotes de prompt |
| `npm run round:ingest -- R001` | Valida, roda checks, cega entregas |
| `npm run rate -- R001` | Painel de avaliação local (127.0.0.1:4173) |
| `npm run score -- R001` | Scoreboard da rodada |
| `npm run guide -- R001` | Recomendação por categoria em docs/model-guide.md |
| `npm run dashboard` | Painel offline |
| `npm run selftest` | Ronda completa com fixtures (R000-selftest) |
| `npm run verify` | Tudo acima, com envelope final |

## Estrutura

- `cases/P1..P5/` — 5 empresas fictícias (personas, KPIs mensais, notas de entrevista com contradições plantadas).
- `tasks/T01..T12.yaml` — cartões de tarefa com prompt congelado em pt-BR.
- `tasks.lock.json` — hash dos prompts congelados; mudou prompt, aumenta `version`.
- `rubrics/` — 6 rubricas (c1..c5 com âncoras 1/3/5).
- `fixtures/` — entregas sintéticas mock-good / mock-bad / mock-flaky por tarefa.
- `rounds/` — pacotes, saídas, blind, runs, ratings, scoreboards.
- `private/answer-keys/` — chaves de resposta dos checks por tarefa (não abrir durante avaliação).
- `scripts/` — biblioteca de checks, rodada, avaliação, score, painel.

## Regras do jogo (v0.1)

- Tudo em português do Brasil; código e chaves em inglês.
- Modo `manual` para models; nenhum dado real ou resultado inventado entra no repositório.
- Cegos e blind-map ficam no repo (visibilidade `internal`); o painel de avaliação roda em loopback.
- Sem páginas públicas, sem banco/serviço externo; dependências só `yaml` e `ajv`.
- Mudou prompt congelado? Aumente `version` no cartão e rode `npm run check:prompts -- --update`.

## Fase 2 (futuro)

Ideias de publicação e acesso externo ficam em `docs/PHASE2-public.md` — apenas esboço, fora do escopo atual.
