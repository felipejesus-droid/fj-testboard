import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GUARD = join(ROOT, 'scripts', 'guard.js');

function runGuard(repo) {
  try {
    execFileSync(process.execPath, [GUARD], { cwd: repo, encoding: 'utf8' });
    return { code: 0 };
  } catch (err) {
    return { code: err.status ?? 1, out: err.stdout ?? '' };
  }
}

test('guard passa num repositório limpo (sem registros com visibility fora de internal, sem public/)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'guard-ok-'));
  mkdirSync(join(dir, 'cases', 'P1'), { recursive: true });
  mkdirSync(join(dir, 'schemas'), { recursive: true });
  copyFileSync(join(ROOT, 'schemas', 'persona.schema.json'), join(dir, 'schemas', 'persona.schema.json'));
  try {
    writeFileSync(join(dir, 'cases', 'P1', 'persona.yaml'), 'id: P1\ncompany_name: Pousada Ficticia\nsegment: Pousada\ncity: Gramado\nsize: pequena\ndigital_maturity: 2\nmaturity_reason: usa planilhas apenas.\ntools_in_use: [WhatsApp, planilhas]\npain_points:\n  - falta confirmação automática de hospedagem\n  - sem histórico do hospede\nbrand_tone: acolhedor e direto\nbrand_colors: [\"#0A1628\"]\nkpi_csv: cases/P1/kpis.csv\ninterview_notes: cases/P1/interview_notes.md\nvisibility: internal\n');
    const r = runGuard(dir);
    assert.equal(r.code, 0, r.out);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('guard falha com visibility diferente de internal', () => {
  const dir = mkdtempSync(join(tmpdir(), 'guard-bad-'));
  mkdirSync(join(dir, 'cases', 'P1'), { recursive: true });
  try {
    writeFileSync(join(dir, 'cases', 'P1', 'x.yaml'), 'foo: bar\nvisibility: public_showcase\n');
    const r = runGuard(dir);
    assert.equal(r.code, 1);
    assert.match(r.out, /guard falhou/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('guard falha se public/ contém arquivos', () => {
  const dir = mkdtempSync(join(tmpdir(), 'guard-pub-'));
  mkdirSync(join(dir, 'public'), { recursive: true });
  try {
    writeFileSync(join(dir, 'public', 'index.html'), '<h1>x</h1>');
    const r = runGuard(dir);
    assert.equal(r.code, 1);
    assert.match(r.out, /public/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
