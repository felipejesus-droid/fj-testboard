import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { validate } from '../scripts/lib/validate.js';
import { stopwordRatio, hasMojibake, hasUnresolvedPlaceholder } from '../scripts/lib/pt-ling.js';
import { repoPath } from '../scripts/lib/util.js';

const ROOT = repoPath();
const personas = ['P1', 'P2', 'P3', 'P4', 'P5'].map((id) => ({
  id,
  data: YAML.parse(readFileSync(join(ROOT, 'cases', id, 'persona.yaml'), 'utf8')),
}));

test('m2: as 5 personas validam contra o schema e são todas internal', () => {
  for (const { id, data } of personas) {
    assert.equal(data.id, id, `id inconsistente em ${id}`);
    const r = validate('persona.schema.json', data);
    assert.equal(r.ok, true, `${id}: ${r.errors.join('; ')}`);
  }
});

test('m2: kpis.csv de cada persona tem 12 linhas numéricas e cabeçalho de mês', () => {
  for (const { id } of personas) {
    const text = readFileSync(join(ROOT, 'cases', id, 'kpis.csv'), 'utf8');
    const rows = text.trim().split('\n');
    assert.ok(rows[0].includes('mes'), `${id}: cabeçalho deve ter coluna mes`);
    const monthly = rows.slice(1).filter((r) => /^\d{4}-\d{2},/.test(r));
    assert.equal(monthly.length, 12, `${id}: esperadas 12 linhas mensais`);
    for (const row of monthly) {
      const cells = row.split(',').slice(1);
      for (const cell of cells) {
        assert.equal(isFinite(Number(cell)), true, `${id}: valor não numérico "${cell}"`);
      }
    }
  }
});

test('m2: nenhuma marca real aparece em textos de caso (blocklist)', () => {
  const blocklist = YAML.parse(readFileSync(join(ROOT, 'config', 'brand-blocklist.yaml'), 'utf8')).brands;
  const scanTargets = [];
  for (const { id } of personas) {
    const dir = join(ROOT, 'cases', id);
    for (const f of readdirSync(dir)) scanTargets.push(join(dir, f));
  }
  for (const file of scanTargets) {
    const text = readFileSync(file, 'utf8');
    for (const brand of blocklist) {
      assert.equal(new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text), false, `${file} cita marca real permitida? -> ${brand}`);
    }
  }
});

test('m2: notas de entrevista passam na heurística de pt-BR (stopwords, mojibake, placeholders)', () => {
  for (const { id, data } of personas) {
    const text = readFileSync(join(ROOT, data.interview_notes), 'utf8');
    const ratio = stopwordRatio(text);
    assert.ok(ratio >= 0.2, `${id}: razão de stopwords ${ratio.toFixed(2)} abaixo de 0,2`);
    assert.equal(hasMojibake(text), false, `${id}: caracteres corrompidos nas notas`);
    assert.equal(hasUnresolvedPlaceholder(text), false, `${id}: placeholder não resolvido nas notas`);
  }
});

test('m2: arquivos de armadilha existem e citam linhas reais dos casos', () => {
  const keys = ['P1-traps.yaml', 'P3-traps.yaml', 'P3-kpis-trap.yaml'];
  for (const key of keys) {
    const p = join(ROOT, 'private', 'answer-keys', key);
    assert.equal(existsSync(p), true, `falta ${key}`);
    const data = YAML.parse(readFileSync(p, 'utf8'));
    assert.equal(data.visibility, 'internal');
  }
  const p1 = YAML.parse(readFileSync(join(ROOT, 'private', 'answer-keys', 'P1-traps.yaml'), 'utf8'));
  const notes = readFileSync(join(ROOT, 'cases', 'P1', 'interview_notes.md'), 'utf8');
  for (const c of p1.contradictions) {
    for (const lineRef of c.lines) {
      assert.match(notes, new RegExp(`^${lineRef} `, "m"), `linha ${lineRef} não existe nas notas de P1`);
    }
  }
});
