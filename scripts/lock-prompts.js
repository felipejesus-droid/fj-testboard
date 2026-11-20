#!/usr/bin/env node
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoPath, sha256 } from './lib/util.js';
import { validateAllTasks } from './lib/tasks.js';
import { exitWith } from './lib/envelope.js';

const LOCK = join(repoPath(), 'tasks.lock.json');
const { tasks, problems } = validateAllTasks();
if (problems.length) {
  exitWith({ status: 'error', summary: `cartões inválidos: ${problems.length}`, next_actions: ['Corrija os cartões listados antes de travar prompts'] });
}

if (process.argv.includes('--update')) {
  const lock = { generated_at: new Date().toISOString(), tasks: {} };
  for (const [id, card] of tasks) {
    lock.tasks[id] = { version: card.version, sha256: sha256(card.frozen_prompt_pt) };
  }
  writeFileSync(LOCK, JSON.stringify(lock, null, 2) + '\n', 'utf8');
  exitWith({ status: 'success', summary: 'tasks.lock.json atualizado', artifacts: ['tasks.lock.json'] });
}

if (!existsSync(LOCK)) {
  exitWith({ status: 'error', summary: 'tasks.lock.json não existe', next_actions: ['Rode npm run check:prompts -- --update para gerar o lock inicial'] });
}

const lock = JSON.parse(readFileSync(LOCK, 'utf8'));
const drift = [];
for (const [id, card] of tasks) {
  const entry = lock.tasks[id];
  if (!entry) { drift.push(`${id}: ausente no lock`); continue; }
  const current = sha256(card.frozen_prompt_pt);
  if (entry.sha256 !== current) {
    drift.push(`${id}: prompt mudou (versão registrada v${entry.version}, atual v${card.version})`);
  }
}
for (const id of Object.keys(lock.tasks)) {
  if (!tasks.has(id)) drift.push(`${id}: no lock mas sem cartão`);
}
if (drift.length) {
  exitWith({
    status: 'error',
    summary: `prompts alterados sem atualização do lock: ${drift.length}`,
    artifacts: [],
    next_actions: ['Se a mudança foi intencional, aumente "version" no cartão e rode npm run check:prompts -- --update'],
  });
}
exitWith({ status: 'success', summary: `lock íntegro para ${tasks.size} cartões` });
