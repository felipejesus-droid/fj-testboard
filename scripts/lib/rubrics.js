import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { repoPath } from './util.js';

const NAMES = {
  A1: 'A1-diagnostico.yaml',
  A2: 'A2-prd.yaml',
  A3: 'A3-capacitacao.yaml',
  B1: 'B1-apresentacao.yaml',
  B2: 'B2-social.yaml',
  C: 'C-pwa.yaml',
};

export function loadRubric(category) {
  const file = join(repoPath('rubrics'), NAMES[category]);
  return YAML.parse(readFileSync(file, 'utf8'));
}

export function allRubrics() {
  const dir = repoPath('rubrics');
  const out = {};
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.yaml'))) {
    const data = YAML.parse(readFileSync(join(dir, f), 'utf8'));
    out[data.category] = data;
  }
  return out;
}
