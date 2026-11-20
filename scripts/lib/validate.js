import Ajv from 'ajv/dist/2020.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SCHEMA_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../schemas');

export function loadSchema(name) {
  return JSON.parse(readFileSync(join(SCHEMA_DIR, name), 'utf8'));
}

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
const cache = new Map();

export function compile(name) {
  if (!cache.has(name)) {
    cache.set(name, ajv.compile(loadSchema(name)));
  }
  return cache.get(name);
}

export function validate(schemaName, data) {
  const validateFn = compile(schemaName);
  const ok = validateFn(data);
  return { ok, errors: ok ? [] : validateFn.errors.map(formatError) };
}

function formatError(e) {
  const path = e.instancePath || '(raiz)';
  return `${path} ${e.message}`;
}
