import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { repoPath } from '../lib/util.js';

const FILES = {
  T02: 'P1-traps.yaml',
  T04: 'P3-traps.yaml',
  T08: 'P3-kpis-trap.yaml',
  T12: 'T12.yaml',
};

export function loadAnswerKey(taskId) {
  const file = FILES[taskId];
  if (!file) return null;
  const p = join(repoPath(), 'private', 'answer-keys', file);
  if (!existsSync(p)) return null;
  return YAML.parse(readFileSync(p, 'utf8'));
}
