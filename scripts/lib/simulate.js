import { readFileSync, existsSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { repoPath } from './util.js';
import { validate } from './validate.js';
import { validateAllTasks } from './tasks.js';
import { exitWith } from './envelope.js';
import { appendJsonl, readJsonl } from './util.js';

const SELFTEST_ROUND = 'R000-selftest';
const PROFILE = {
  'mock-good': { scores: { c1: 5, c2: 5, c3: 5, c4: 4, c5: 5 }, minutes: 12 },
  'mock-flaky': { scores: { c1: 4, c2: 4, c3: 3, c4: 3, c5: 4 }, minutes: 31 },
  'mock-bad': { scores: { c1: 2, c2: 2, c3: 1, c4: 1, c5: 2 }, minutes: 65 },
};

export function simulateRatings(roundId) {
  const dir = repoPath('rounds', roundId);
  const runs = readJsonl(join(dir, 'runs.jsonl'));
  const ratingsPath = join(dir, 'ratings.jsonl');
  rmSync(ratingsPath, { force: true });
  let count = 0;
  for (const run of runs) {
    const slug = run.model.name;
    const profile = PROFILE[slug] ?? PROFILE['mock-flaky'];
    const hardFails = run.auto_checks.filter((c) => c.kind === 'hard' && !c.pass).length;
    const approved = hardFails === 0;
    const rating = {
      blind_id: run.blind_id,
      rater: 'simulado-selftest',
      scores: profile.scores,
      approved,
      approved_override_reason: null,
      minutes_to_publishable: profile.minutes,
      notes: 'avaliação simulada para selftest (não é resultado de modelo real)',
      rated_at: new Date().toISOString(),
    };
    const r = validate('rating.schema.json', rating);
    if (!r.ok) return { status: 'error', summary: `rating simulada fora do schema: ${r.errors.join('; ')}` };
    appendJsonl(ratingsPath, rating);
    count++;
  }
  return { status: 'success', summary: `${count} avaliações simuladas escritas`, artifacts: [`rounds/${roundId}/ratings.jsonl`] };
}
