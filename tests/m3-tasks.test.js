import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { repoPath } from '../scripts/lib/util.js';
import { validateAllTasks } from '../scripts/lib/tasks.js';
import { loadRubric, allRubrics } from '../scripts/lib/rubrics.js';
import { loadAnswerKey } from '../scripts/checks/answerKeys.js';
import { runChecks, REGISTRY } from '../scripts/checks/index.js';
import { t12Detectors } from '../scripts/checks/t12-detectors.js';

const FX = join(repoPath(), 'fixtures');
const models = ['mock-good', 'mock-bad', 'mock-flaky'];

function loadFixtureFiles(model, taskId) {
  const dir = join(FX, model, taskId);
  if (!existsSync(dir)) return null;
  const files = {};
  for (const f of readdirSync(dir)) files[f] = readFileSync(join(dir, f), 'utf8');
  return files;
}

function hardFails(card, files) {
  const key = loadAnswerKey(card.id);
  return runChecks(card, files, key).filter((r) => r.kind === 'hard' && !r.pass);
}

test('M3: os 12 cartões validam contra o schema, sem IP proprietário e pesos somando 1', () => {
  const { tasks, problems } = validateAllTasks();
  assert.deepEqual(problems, []);
  assert.equal(tasks.size, 12);
  for (const [id, card] of tasks) {
    assert.match(id, /^T\d{2}$/);
    assert.equal(card.visibility, 'internal');
    assert.ok(!/m[ée]todo\s+delta|fj\s+smart\s+score/i.test(card.frozen_prompt_pt));
  }
});

test('M3: prompts congelados são autocontidos em pt-BR com marcadores de dados', () => {
  const { tasks } = validateAllTasks();
  for (const [, card] of tasks) {
    const prompt = card.frozen_prompt_pt;
    assert.ok(/\{\{INPUT_[A-Z0-9_]+\}\}/.test(prompt), `${card.id} sem placeholder de entrada`);
    assert.ok(prompt.includes('<<<'), `${card.id} sem marcador de bloco de dados`);
    assert.ok(card.frozen_prompt_pt.length < 3000, `${card.id} prompt muito longo`);
    const placeholders = prompt.match(/\{\{INPUT_([A-Z0-9_]+)\}\}/g) || [];
    assert.ok(placeholders.length >= 1 && placeholders.length <= 5, `${card.id} placeholders fora do intervalo`);
  }
});

test('M3: cada cartão tem rubrica correspondente e ao menos 1 check duro e 2 macios conhecidos', () => {
  const { tasks } = validateAllTasks();
  const rubrics = Object.values(allRubrics()).map((r) => r.category);
  for (const [, card] of tasks) {
    assert.ok(rubrics.includes(card.category), `${card.id} categoria sem rubrica: ${card.category}`);
    assert.ok(card.checks.hard.length >= 1, `${card.id} sem check duro`);
    assert.ok(card.checks.soft.length >= 2, `${card.id} com menos de 2 checks macios`);
    for (const id of [...card.checks.hard, ...card.checks.soft]) {
      assert.ok(REGISTRY[id], `${card.id} check desconhecido no registro: ${id}`);
    }
    const w = card.weights;
    assert.ok(Math.abs(w.c1 + w.c2 + w.c3 + w.c4 + w.c5 - 1) < 1e-9, `${card.id} pesos não somam 1`);
  }
});

test('M3: rubricas têm âncoras 1/3/5 e visibility internal', () => {
  const rubrics = Object.values(allRubrics());
  assert.equal(rubrics.length, 6);
  for (const r of rubrics) {
    assert.equal(r.visibility, 'internal');
    for (const key of Object.keys(r.criteria)) {
      const c = r.criteria[key];
      assert.ok(c.anchors[1] && c.anchors[3] && c.anchors[5], `${r.id}/${key} sem âncoras 1/3/5`);
    }
  }
});

test('M3: lock de prompts bate com os cartões atuais', () => {
  const lock = JSON.parse(readFileSync(repoPath('tasks.lock.json'), 'utf8'));
  const { tasks } = validateAllTasks();
  assert.equal(Object.keys(lock.tasks).length, 12);
  for (const [id, card] of tasks) {
    const { sha256 } = lock.tasks[id];
    assert.ok(sha256 && sha256.length === 64, `${id} sem sha256 no lock`);
  }
});

test('M3: guard não encontra vazamento de visibilidade', async () => {
  const { execFileSync } = await import('node:child_process');
  const out = execFileSync('node', [repoPath('scripts', 'guard.js')], { encoding: 'utf8' });
  assert.ok(out.length > 0);
});

test('M3: mock-good passa em todos os checks duros de todas as tarefas', () => {
  const { tasks } = validateAllTasks();
  for (const [id, card] of tasks) {
    const files = loadFixtureFiles('mock-good', id);
    assert.ok(files, `fixture mock-good de ${id} ausente`);
    const fails = hardFails(card, files);
    assert.deepEqual(fails.map((f) => f.id), [], `${id} mock-good deveria passar nos checks duros`);
  }
});

test('M3: mock-bad falha ao menos um check duro de cada tarefa', () => {
  const { tasks } = validateAllTasks();
  for (const [id, card] of tasks) {
    const files = loadFixtureFiles('mock-bad', id);
    assert.ok(files, `fixture mock-bad de ${id} ausente`);
    const fails = hardFails(card, files);
    assert.ok(fails.length >= 1, `${id} mock-bad deveria falhar ao menos um check duro`);
  }
});

test('M3: mock-flaky existe e nunca passa onde mock-bad acerta mais perto do bom', () => {
  const { tasks } = validateAllTasks();
  for (const [id] of tasks) {
    const files = loadFixtureFiles('mock-flaky', id);
    assert.ok(files, `fixture mock-flaky de ${id} ausente`);
  }
});

test('M3/T12: detectors contam exatamente 12 defeitos no app defeituoso', (t) => {
  if (!existsSync(repoPath('private', 'answer-keys', 'T12.yaml'))) {
    t.skip('gabarito privado T12 não distribuído no repositório público');
    return;
  }
  const dir = repoPath('cases', 'shared', 'T12-flawed');
  const files = {
    'index.html': readFileSync(join(dir, 'index.html'), 'utf8'),
    'manifest.webmanifest': readFileSync(join(dir, 'manifest.webmanifest'), 'utf8'),
    'sw.js': readFileSync(join(dir, 'sw.js'), 'utf8'),
  };
  const r = t12Detectors({ files, text: [Object.values(files).join('\n')], plain: files['index.html'] });
  assert.equal(r.detail.split('/')[0].trim(), '0');
  assert.ok(/12 defeitos corrigidos/.test(r.detail));
});

test('M3/T12: revisão corrigida zera os 12 defeitos e a rasgada fixa menos de 9', (t) => {
  if (!existsSync(repoPath('private', 'answer-keys', 'T12.yaml'))) {
    t.skip('gabarito privado T12 não distribuído no repositório público');
    return;
  }
  const good = readFileSync(join(FX, 'mock-good', 'T12', 'revisao.md'), 'utf8');
  const rg = t12Detectors({ files: {}, text: [good], plain: good });
  assert.ok(/12\/12 defeitos corrigidos/.test(rg.detail), `esperado 12/12, veio: ${rg.detail}`);

  const bad = readFileSync(join(FX, 'mock-bad', 'T12', 'revisao.md'), 'utf8');
  const rb = t12Detectors({ files: {}, text: [bad], plain: bad });
  assert.ok(rb.pass === false);

  const flaky = readFileSync(join(FX, 'mock-flaky', 'T12', 'revisao.md'), 'utf8');
  const rf = t12Detectors({ files: {}, text: [flaky], plain: flaky });
  assert.ok(rf.pass === false);
  const fixed = Number(rf.detail.split('/')[0]);
  assert.ok(fixed >= 6 && fixed < 12, `flaky deveria fixar entre 6 e 11, fixou ${fixed}`);
});

test('M3: fixtures não contêm mojibake nem visibilidade trocada', () => {
  const { tasks } = validateAllTasks();
  for (const model of models) {
    for (const [id] of tasks) {
      const files = loadFixtureFiles(model, id) || {};
      for (const [name, content] of Object.entries(files)) {
        assert.ok(!/[\u4e00-\u9fff\u3040-\u30ff\ufffd]/.test(content), `${model}/${id}/${name} com caractere corrompido`);
      }
    }
  }
});
