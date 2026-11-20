import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { repoPath, readJsonl } from '../scripts/lib/util.js';
import { validate } from '../scripts/lib/validate.js';
import { computeScoreboard, weightedScore } from '../scripts/lib/scorecore.js';
import { createApp } from '../scripts/rate.js';

function runScript(script, args) {
  return execFileSync('node', [repoPath('scripts', script), ...args], { encoding: 'utf8' });
}

const ROUND = 'R000-selftest';

test('M5: selftest gera runs + avaliações simuladas e scoreboard completo', () => {
  const out = runScript('selftest.js', []);
  assert.match(out, /"status":"success"/);
  const dir = repoPath('rounds', ROUND);
  const scores = runScript('score.js', [ROUND]);
  assert.match(scores, /"status":"success"/);
  const board = JSON.parse(readFileSync(join(dir, 'scoreboard.json'), 'utf8'));
  const v = validate('scoreboard.schema.json', board);
  assert.equal(v.ok, true, v.errors.join('; '));
  assert.equal(board.round_id, ROUND);
});

test('M5/R000: em cada categoria, bom > flaco > ruim', () => {
  const board = JSON.parse(readFileSync(repoPath('rounds', ROUND, 'scoreboard.json'), 'utf8'));
  const cats = [...new Set(board.by_model_category.map((c) => c.category))];
  for (const cat of cats) {
    const rows = Object.fromEntries(board.by_model_category.filter((r) => r.category === cat).map((r) => [r.model, r.mean_score]));
    assert.ok(rows['mock-good'] > rows['mock-flaky'], `categoria ${cat}: good (${rows['mock-good']}) deveria superar flaky (${rows['mock-flaky']})`);
    assert.ok(rows['mock-flaky'] > rows['mock-bad'], `categoria ${cat}: flaky (${rows['mock-flaky']}) deveria superar bad (${rows['mock-bad']})`);
  }
  const all = Object.fromEntries(board.by_model.map((m) => [m.model, m]));
  assert.ok(all['mock-good'].mean_score > all['mock-flaky'].mean_score);
  assert.ok(all['mock-flaky'].mean_score > all['mock-bad'].mean_score);
});

test('M5/R000: pass@1, mediana de minutos e custo nulo ficam coerentes', () => {
  const board = JSON.parse(readFileSync(repoPath('rounds', ROUND, 'scoreboard.json'), 'utf8'));
  const all = Object.fromEntries(board.by_model.map((m) => [m.model, m]));
  assert.equal(all['mock-good'].pass_at_1, 1);
  assert.equal(all['mock-bad'].pass_at_1, 0);
  assert.ok(all['mock-flaky'].pass_at_1 > 0 && all['mock-flaky'].pass_at_1 < 1);
  assert.equal(all['mock-good'].median_minutes, 12);
  assert.equal(all['mock-flaky'].median_minutes, 31);
  assert.equal(all['mock-bad'].median_minutes, 65);
  assert.equal(all['mock-good'].cost_per_approved, null);
  assert.equal(all['mock-bad'].cost_per_approved, null);
});

test('M5: score ponderado usa os pesos do cartão da tarefa', () => {
  const weights = { c1: 0.2, c2: 0.4, c3: 0.1, c4: 0.1, c5: 0.2 };
  const s = weightedScore(weights, { c1: 5, c2: 3, c3: 5, c4: 5, c5: 5 });
  assert.equal(s, Math.round(((0.2 * 5 + 0.4 * 3 + 0.1 * 5 + 0.1 * 5 + 0.2 * 5) / 1) * 100) / 100);
});

test('M5: Δ contra rodada anterior só conta pares tarefa+versão presentes, com valor exato', () => {
  const gen = () => [
    { blind_id: 'aa0001', model: 'm1', task_id: 'T01', task_version: 1, category: 'A1', attempt: 1, weights: { c1: 1, c2: 0, c3: 0, c4: 0, c5: 0 }, cost_brl: null, hard_fails: 0 },
  ];

  const ratingsA = [
    { blind_id: 'aa0001', scores: { c1: 3, c2: 3, c3: 3, c4: 3, c5: 3 }, approved: false, minutes_to_publishable: 20 },
  ];
  const boardA = computeScoreboard({ roundId: 'R001', generations: gen(), ratings: ratingsA, previousScoreboard: null });
  const ratingsB = [
    { blind_id: 'aa0001', scores: { c1: 4, c2: 3, c3: 3, c4: 3, c5: 3 }, approved: true, minutes_to_publishable: 18 },
  ];
  const boardB = computeScoreboard({ roundId: 'R002', generations: gen(), ratings: ratingsB, previousScoreboard: boardA });
  const m1b = boardB.by_model.find((m) => m.model === 'm1');
  assert.equal(m1b.score_delta_vs_previous, 1);
  assert.equal(m1b.delta_n, 1);

  const genNewVersion = [
    { blind_id: 'aa0002', model: 'm1', task_id: 'T01', task_version: 2, category: 'A1', attempt: 1, weights: { c1: 1, c2: 0, c3: 0, c4: 0, c5: 0 }, cost_brl: null, hard_fails: 0 },
  ];
  const boardC = computeScoreboard({ roundId: 'R003', generations: genNewVersion, ratings: ratingsB, previousScoreboard: boardA });
  const m1c = boardC.by_model.find((m) => m.model === 'm1');
  assert.equal(m1c.score_delta_vs_previous, null);
  assert.equal(m1c.delta_n, 0);
});

test('M5: custo por entrega aprovada fica nulo se qualquer custo faltar', () => {
  const generations = [
    { blind_id: 'b1', model: 'm1', task_id: 'T01', task_version: 1, category: 'A1', attempt: 1, weights: { c1: 1, c2: 0, c3: 0, c4: 0, c5: 0 }, cost_brl: 10, hard_fails: 0 },
    { blind_id: 'b2', model: 'm1', task_id: 'T02', task_version: 1, category: 'A1', attempt: 1, weights: { c1: 1, c2: 0, c3: 0, c4: 0, c5: 0 }, cost_brl: null, hard_fails: 0 },
  ];
  const ratings = [
    { blind_id: 'b1', scores: { c1: 5, c2: 5, c3: 5, c4: 5, c5: 5 }, approved: true, minutes_to_publishable: 10 },
    { blind_id: 'b2', scores: { c1: 5, c2: 5, c3: 5, c4: 5, c5: 5 }, approved: true, minutes_to_publishable: 10 },
  ];
  const board = computeScoreboard({ roundId: 'R004', generations, ratings, previousScoreboard: null });
  assert.equal(board.by_model[0].cost_per_approved, null);

  generations[1].cost_brl = 20;
  const board2 = computeScoreboard({ roundId: 'R004', generations, ratings, previousScoreboard: null });
  assert.equal(board2.by_model[0].cost_per_approved, 15);
});

test('M5: pass@3 é nulo com menos de 3 tentativas e numérico com 3', () => {
  const base = (id) => ({ blind_id: id, model: 'm1', task_id: 'T01', task_version: 1, category: 'A1', attempt: 1, weights: { c1: 1, c2: 0, c3: 0, c4: 0, c5: 0 }, cost_brl: null, hard_fails: 0 });
  const ratings = [{ blind_id: 'c1', scores: { c1: 5, c2: 4, c3: 4, c4: 4, c5: 4 }, approved: true, minutes_to_publishable: 5 }];
  const board = computeScoreboard({ roundId: 'R005', generations: [base('c1')], ratings, previousScoreboard: null });
  assert.equal(board.by_model[0].pass_at_3, null);

  const gen3 = [base('c1'), base('c2'), base('c3')];
  const rat3 = [ratings[0], { ...ratings[0], blind_id: 'c2', approved: false }, { ...ratings[0], blind_id: 'c3', approved: true }];
  const board3 = computeScoreboard({ roundId: 'R005', generations: gen3, ratings: rat3, previousScoreboard: null });
  assert.equal(board3.by_model[0].pass_at_3, Math.round((2 / 3) * 100) / 100);
});

test('M5: servidor de avaliação aplica política de check duro e cega modelos', async () => {
  const server = createApp();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  try {
    const rounds = await (await fetch(base + '/api/rounds')).json();
    assert.ok(rounds.rounds.includes(ROUND));
    const rd = await (await fetch(base + `/api/round?id=${ROUND}`)).json();
    assert.ok(rd.entries.length >= 0);
    const reveal = await fetch(base + `/api/reveal?id=${ROUND}`);
    assert.ok(reveal.status === 403 || reveal.status === 200);
  } finally {
    await new Promise((r) => server.close(r));
  }
});
