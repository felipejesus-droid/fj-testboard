import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { repoPath } from '../lib/util.js';
import { loadTasks } from '../lib/tasks.js';
import { loadAnswerKey } from '../checks/answerKeys.js';
import { runChecks } from '../checks/index.js';

const FX = join(repoPath(), 'fixtures');
const tasks = loadTasks();
const models = ['mock-good', 'mock-bad', 'mock-flaky'];
let problems = 0;

for (const card of tasks.values()) {
  for (const model of models) {
    const dir = join(FX, model, card.id);
    if (!existsSync(dir)) {
      console.log(`${card.id} ${model}: FALTANDO`);
      problems++;
      continue;
    }
    const files = {};
    for (const f of readdirSync(dir)) files[f] = readFileSync(join(dir, f), 'utf8');
    const results = runChecks(card, files, loadAnswerKey(card.id));
    const fails = results.filter((r) => !r.pass);
    const hardFails = fails.filter((r) => r.kind === 'hard');
    console.log(`${card.id} ${model}: hard-fail=${hardFails.length} soft-fail=${fails.length - hardFails.length}`);
    for (const f of fails) console.log(`   [${f.kind}] ${f.id}: ${f.detail}`);
    if (model === 'mock-good' && hardFails.length > 0) problems++;
    if (model === 'mock-bad' && hardFails.length === 0) problems++;
  }
}
console.log(problems === 0 ? 'EVAL OK' : `EVAL PROBLEMS: ${problems}`);
process.exit(problems === 0 ? 0 : 1);
