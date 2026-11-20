#!/usr/bin/env node
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { readYaml } from './lib/util.js';
import { exitWith } from './lib/envelope.js';

const DATA_DIRS = ['cases', 'tasks', 'rubrics', 'config', 'rounds', 'fixtures'];
const DATA_EXT = ['.yaml', '.yml', '.json'];
const ALLOWED = 'internal';

function walk(dir, problems) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, problems);
      continue;
    }
    if (!DATA_EXT.some((ext) => entry.name.endsWith(ext))) continue;
    let data;
    try {
      data = readYaml(full);
    } catch {
      continue;
    }
    const records = Array.isArray(data) ? data : [data];
    for (const rec of records) {
      if (rec === null || typeof rec !== 'object' || Array.isArray(rec)) continue;
      if (rec.visibility !== undefined && rec.visibility !== ALLOWED) {
        problems.push(`${full}: visibility "${rec.visibility}" — valor permitido em v0.1 é apenas "${ALLOWED}"`);
      }
    }
  }
}

function scan(root) {
  const problems = [];
  for (const dir of DATA_DIRS) {
    const abs = join(root, dir);
    if (existsSync(abs)) walk(abs, problems);
  }
  return problems;
}

function checkPublicDir(root) {
  const pub = join(root, 'public');
  if (!existsSync(pub)) return null;
  const files = [];
  const stack = [pub];
  while (stack.length) {
    const cur = stack.pop();
    for (const entry of readdirSync(cur, { withFileTypes: true })) {
      const full = join(cur, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else files.push(full);
    }
  }
  if (files.length > 0) {
    return `diretório "public/" contém arquivos — nada público é permitido em v0.1`;
  }
  return `diretório "public/" existe — remova-o (público é Fase 2)`;
}

const root = resolve(process.cwd());
const problems = scan(root);
const publicProblem = checkPublicDir(root);
if (publicProblem) problems.push(publicProblem);

if (problems.length > 0) {
  exitWith({
    status: 'error',
    summary: `guard falhou: ${problems.length} problema(s) de visibilidade/público`,
    artifacts: [],
    next_actions: ['Corrija os registros listados para visibility "internal" e remova o diretório public/'],
  });
}
exitWith({
  status: 'success',
  summary: 'guard ok: nenhuma visibilidade fora de "internal" e nenhum diretório public/',
  artifacts: [],
  next_actions: [],
});
