import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { repoPath } from '../scripts/lib/util.js';
import { runVerify } from '../scripts/verify.js';

test('M6: verify completo termina em success com invariante R000', () => {
  const out = runVerify();
  assert.equal(out.status, 'success', 'verify retornou: ' + out.summary);
  assert.ok(existsSync(repoPath('dashboard', 'index.html')));
  assert.ok(existsSync(repoPath('docs', 'model-guide.md')));
});

test('M6: dashboard offline funciona com file:// (sem src/href externos) e esconde selftest', () => {
  const html = readFileSync(repoPath('dashboard', 'index.html'), 'utf8');
  assert.ok(!/src=["']https?:|href=["']https?:/.test(html), 'dashboard com referência externa');
  assert.ok(html.includes('FJ-TestBoard · INTERNO'));
  assert.ok(html.includes('Como ler este painel'));
  assert.ok(html.includes('show-synthetic'));
  assert.ok(html.includes('Amostra pequena'));
});

test('M6: README tem manual de rodada real e PHASE2 é esboço', () => {
  const readme = readFileSync(repoPath('README.md'), 'utf8');
  for (const cmd of ['round:new', 'round:ingest', 'rate', 'score', 'guide', 'dashboard', 'verify']) {
    assert.ok(readme.includes(cmd), `README sem ${cmd}`);
  }
  const phase2 = readFileSync(repoPath('docs', 'PHASE2-public.md'), 'utf8');
  assert.ok(phase2.includes('ESBOÇO'));
  assert.ok(phase2.includes('sem publicação'));
});

test('M6: nenhuma página pública e tudo marcado internal', () => {
  assert.ok(!existsSync(repoPath('public')), 'diretório public/ não deveria existir');
});
