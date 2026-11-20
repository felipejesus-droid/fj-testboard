import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { validate } from './validate.js';
import { repoPath } from './util.js';

const FROBIDDEN_IP = [/m[ée]todo\s+delta/i, /fj\s+smart\s+score/i];

export function loadTasks() {
  const dir = repoPath('tasks');
  const tasks = new Map();
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort()) {
    const data = YAML.parse(readFileSync(join(dir, f), 'utf8'));
    tasks.set(data.id, { ...data, _path: join(dir, f) });
  }
  return tasks;
}

export function validateAllTasks() {
  const problems = [];
  const tasks = loadTasks();
  if (tasks.size !== 12) problems.push(`esperados 12 cartões, encontrados ${tasks.size}`);
  for (const [id, card] of tasks) {
    const { _path, ...cardData } = card;
    const r = validate('task-card.schema.json', cardData);
    if (!r.ok) problems.push(`${id}: ${r.errors.join('; ')}`);
    if (card.id !== id.replace('.yaml', '')) void 0;
    for (const rx of FROBIDDEN_IP) {
      if (rx.test(card.frozen_prompt_pt)) problems.push(`${id}: prompt congelado menciona IP proprietário (Método DELTA / FJ Smart Score)`);
    }
    const weightSum = card.weights.c1 + card.weights.c2 + card.weights.c3 + card.weights.c4 + card.weights.c5;
    if (Math.abs(weightSum - 1) > 1e-9) problems.push(`${id}: pesos somam ${weightSum}, esperado 1`);
  }
  return { tasks, problems };
}
