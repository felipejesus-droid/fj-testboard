import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { repoPath, readJsonl } from './lib/util.js';
import { validate } from './lib/validate.js';
import { validateAllTasks } from './lib/tasks.js';
import { exitWith } from './lib/envelope.js';
import { computeScoreboard } from './lib/scorecore.js';

function previousRoundId(roundId) {
  const m = roundId.match(/^R(\d{3})$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (n <= 1) return null;
  const prev = `R${String(n - 1).padStart(3, '0')}`;
  return existsSync(repoPath('rounds', prev, 'scoreboard.json')) ? prev : null;
}

export function buildScoreboard(roundId) {
  const dir = repoPath('rounds', roundId);
  const runsPath = join(dir, 'runs.jsonl');
  if (!existsSync(runsPath)) {
    return { status: 'error', summary: `nenhum runs.jsonl para ${roundId}; rode o ingest primeiro` };
  }
  const { tasks } = validateAllTasks();
  const map = JSON.parse(readFileSync(join(dir, 'blind-map.json'), 'utf8'));
  const runs = readJsonl(runsPath);
  const ratings = readJsonl(join(dir, 'ratings.jsonl'));
  const runsByBlind = new Map(runs.map((r) => [r.blind_id, r]));
  const mapByBlind = new Map(map.blinds.map((b) => [b.blind_id, b]));

  const generations = runs.map((r) => {
    const blindInfo = mapByBlind.get(r.blind_id);
    const card = tasks.get(r.task_id);
    const modelJoin = blindInfo ? blindInfo.model_slug : `${r.model.vendor} ${r.model.name}`;
    return {
      blind_id: r.blind_id,
      model: modelJoin,
      task_id: r.task_id,
      task_version: r.task_version,
      category: card?.category ?? '?',
      attempt: r.attempt,
      weights: card?.weights ?? { c1: 0.2, c2: 0.2, c3: 0.2, c4: 0.2, c5: 0.2 },
      cost_brl: r.cost_brl,
      hard_fails: r.auto_checks.filter((c) => c.kind === 'hard' && !c.pass).length,
    };
  });

  const prevId = previousRoundId(roundId);
  const previousScoreboard = prevId ? JSON.parse(readFileSync(repoPath('rounds', prevId, 'scoreboard.json'), 'utf8')) : null;

  const board = computeScoreboard({ roundId, generations, ratings, previousScoreboard });
  const v = validate('scoreboard.schema.json', board);
  if (!v.ok) return { status: 'error', summary: `scoreboard fora do schema: ${v.errors.join('; ')}` };

  const ratedCount = board.metrics.rated;
  const total = board.metrics.generations;
  const boardPath = join(dir, 'scoreboard.json');
  writeFileSync(boardPath, JSON.stringify(board, null, 2) + '\n', 'utf8');

  if (ratedCount < total) {
    return {
      status: 'warning',
      summary: `${ratedCount} de ${total} entregas avaliadas; scoreboard parcial salvo`,
      artifacts: [`rounds/${roundId}/scoreboard.json`],
      next_actions: [`Use npm run rate -- ${roundId} para avaliar o restante.`],
    };
  }
  return {
    status: 'success',
    summary: `scoreboard completo: ${total} entregas, ${board.metrics.approved} aprovadas`,
    artifacts: [`rounds/${roundId}/scoreboard.json`],
    next_actions: [`Rode npm run guide -- ${roundId} para o resumo em texto.`],
  };
}

export function main(args) {
  const roundId = args[0];
  if (!roundId) return exitWith({ status: 'error', summary: 'uso: npm run score -- R001' });
  try {
    const out = buildScoreboard(roundId);
    exitWith(out);
  } catch (e) {
    exitWith({ status: 'error', summary: `score falhou: ${e.message}` });
  }
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('score.js');
if (invokedDirectly) main(process.argv.slice(2));
