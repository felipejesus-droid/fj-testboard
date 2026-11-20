import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import YAML from 'yaml';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export function repoPath(...parts) {
  return join(ROOT, ...parts);
}

export function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function readYaml(path) {
  if (!existsSync(path)) throw new Error(`arquivo nao encontrado: ${path}`);
  return YAML.parse(readFileSync(path, 'utf8'));
}

export function writeYaml(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, YAML.stringify(data), 'utf8');
}

export function writeFileSafe(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
}

export function readJsonl(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

export function appendJsonl(path, record) {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify(record) + '\n', 'utf8');
}

export function randomHexId() {
  return randomBytes(3).toString('hex');
}

export function listFilesRecursive(dir, filterFn = () => true) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full, filterFn));
    else if (filterFn(full)) out.push(full);
  }
  return out;
}

export function toBrl(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function round(value, digits = 4) {
  const f = Math.pow(10, digits);
  return Math.round(value * f) / f;
}
